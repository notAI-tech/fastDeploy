from gevent import monkey

monkey.patch_all()
import gevent
import gevent.pool
import os
import sys
import glob
import time
import uuid
import ujson
import falcon
import base64
import shutil
import logging
import datetime
import mimetypes
from functools import partial

from . import _utils

NO_LOOP_MODE = False
if os.getenv("NO_LOOP").lower() == "true":
    NO_LOOP_MODE = True

ONLY_ASYNC = os.getenv("ONLY_ASYNC", False)


if NO_LOOP_MODE:
    from predictor import predictor

    IS_FILE_INPUT = False

else:
    if "LAST_PREDICTOR_SEQUENCE" not in _utils.META_INDEX:
        _utils.logger.info(f"Waiting for warmup, batch size search to finish.")
        while "LAST_PREDICTOR_SEQUENCE" not in _utils.META_INDEX:
            time.sleep(5)

    LAST_PREDICTOR_SEQUENCE = _utils.META_INDEX["LAST_PREDICTOR_SEQUENCE"]

    while (
        f"example_{LAST_PREDICTOR_SEQUENCE}" not in _utils.META_INDEX
        or f"time_per_example_{LAST_PREDICTOR_SEQUENCE}" not in _utils.META_INDEX
    ):
        time.sleep(5)

    TIME_PER_EXAMPLE = sum(
        [
            _utils.META_INDEX[f"time_per_example_{_}"]
            for _ in range(LAST_PREDICTOR_SEQUENCE + 1)
        ]
    )
    IS_FILE_INPUT = _utils.META_INDEX["IS_FILE_INPUT"]

    REQUEST_INDEX, RESULTS_INDEX = _utils.get_request_index_results_index(
        None, is_first=True, is_last=True
    )
    print(REQUEST_INDEX.directory, RESULTS_INDEX.directory)


def wait_and_read_pred(unique_id):
    """
    Waits for and reads result for unique_id.

    :param unique_id: unique_id of the input

    :return response: json dumped python dict with keys "success" and "prediction"/ "reason"
    :return status: HTTP status code
    """
    # Keeping track of start_time for TIMEOUT implementation
    start_time = time.time()
    # Default response and status
    response, status = (
        {"success": False, "reason": "timeout"},
        falcon.HTTP_503,
    )
    while True:
        try:
            # if result doesn't exist for this uuid,  while loop continues/
            pred = RESULTS_INDEX.pop(unique_id)
            response = {"prediction": pred, "success": True}
            status = falcon.HTTP_200
            break
        except:
            # stop in case of timeout
            if time.time() - start_time >= _utils.TIMEOUT:
                try:
                    REQUEST_INDEX.pop(unique_id)
                except:
                    pass

                _utils.logger.warn(
                    f"unique_id: {unique_id} timedout, with timeout {_utils.TIMEOUT}"
                )
                break

            gevent.time.sleep(TIME_PER_EXAMPLE * 0.505)

    return response, status


class Infer(object):
    def on_post(self, req, resp):
        try:
            unique_id = str(uuid.uuid4())

            req_params = req.params
            is_async_request = ONLY_ASYNC or req_params.get("async")

            _extra_options_for_predictor = {}

            if (req.content_type == "application/json" and IS_FILE_INPUT) or (
                req.content_type != "application/json" and not IS_FILE_INPUT
            ):
                if IS_FILE_INPUT:
                    resp.media = {
                        "success": False,
                        "reason": f"Received json input. Expected multi-part file input.",
                    }
                else:
                    resp.media = {
                        "success": False,
                        "reason": f"Received multi-part file input. Expected json input.",
                    }

                resp.status = falcon.HTTP_400

            else:
                if req.content_type == "application/json":
                    in_data = req.media

                    try:
                        # Legacy. use data in "data" key if exists
                        in_data = in_data["data"]
                    except:
                        pass

                    _in_file_names = [None for _ in range(len(in_data))]

                else:
                    in_data = []
                    _in_file_names = []

                    for part in req.get_media():
                        if not part.filename and _utils.META_INDEX["ACCEPTS_EXTRAS"]:
                            try:
                                _extra_options_for_predictor.update(
                                    ujson.loads(part.text)
                                )
                            except:
                                pass

                        else:
                            _in_file_names.append(part.name)

                            _temp_file_path = (
                                f"{uuid.uuid4()}{os.path.splitext(part.filename)[1]}"
                            )
                            _temp_file = open(_temp_file_path, "wb")

                            while True:
                                chunk = part.stream.read(2048)
                                if not chunk:
                                    break

                                _temp_file.write(chunk)
                            _temp_file.flush()
                            _temp_file.close()

                            in_data.append(_temp_file_path)

                if NO_LOOP_MODE:
                    resp.media = {"success": True, "prediction": predictor(in_data)}
                    resp.status = falcon.HTTP_200
                else:
                    _utils.META_INDEX["TO_PROCESS_COUNT"] += len(in_data)

                    _metrics = {}
                    _metrics["received"] = time.time()
                    _metrics["in_data"] = in_data
                    _utils.METRICS_INDEX[unique_id] = _metrics

                    REQUEST_INDEX[unique_id] = (
                        in_data,
                        [_extra_options_for_predictor.get(_) for _ in _in_file_names],
                    )

                    if is_async_request:
                        resp.media = {"unique_id": unique_id, "success": True}
                        resp.status = falcon.HTTP_200
                    else:
                        resp.media, resp.status = wait_and_read_pred(unique_id)

                    _metrics = _utils.METRICS_INDEX[unique_id]
                    _metrics["responded"] = time.time()
                    _utils.METRICS_INDEX[unique_id] = _metrics

        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            resp.media = {"success": False, "reason": "malformed request"}
            resp.status = falcon.HTTP_400


class Metrics(object):
    def on_get(self, req, resp):

        try:
            resp.media = {}
            resp.status = falcon.HTTP_200

        except Exception as ex:
            logging.exception(ex, exc_info=True)
            pass


class Health(object):
    def on_get(self, req, resp):
        stuck_for = req.params.get("stuck")
        ready_in = min(req.params.get("ready_in", _utils.TIMEOUT), _utils.TIMEOUT)

        if stuck_for:
            stuck_for = float(stuck_for)
            last_prediction_loop_start_time = min(
                [
                    _utils.META_INDEX[f"last_prediction_loop_start_time_{_}"]
                    for _ in range(LAST_PREDICTOR_SEQUENCE + 1)
                ]
            )
            prediction_loop_stuck_for = time.time() - last_prediction_loop_start_time

            if last_prediction_loop_start_time:
                if stuck_for and prediction_loop_stuck_for >= stuck_for:
                    resp.status = falcon.HTTP_503
                    resp.media = {
                        "predictor_status": f"prediction loop stuck for {prediction_loop_stuck_for}. deemed stuck."
                    }
                else:
                    resp.status = falcon.HTTP_200
                    resp.media = {
                        "predictor_status": f"prediction loop running for {prediction_loop_stuck_for}"
                    }
            else:
                resp.status = falcon.HTTP_200
                resp.media = {"predictor_status": f"prediction loop not started"}

        elif ready_in:
            last_prediction_loop_start_time = _utils.META_INDEX[
                f"last_prediction_loop_start_time_{LAST_PREDICTOR_SEQUENCE}"
            ]

            running_time_per_example = 0
            for _ in range(LAST_PREDICTOR_SEQUENCE + 1):
                running_time_per_example += _utils.META_INDEX[
                    f"running_time_per_example_{_}"
                ]

            to_process_count = _utils.META_INDEX["TO_PROCESS_COUNT"]
            expected_wait_time = (
                time.time()
                - last_prediction_loop_start_time
                + (running_time_per_example * to_process_count)
            )

            if last_prediction_loop_start_time == 0:
                resp.status = falcon.HTTP_503
                resp.media = {"ready_status": f"Not ready, prediction loop not started"}
            elif expected_wait_time >= ready_in:
                resp.status = falcon.HTTP_503
                resp.media = {
                    "ready_status": f"Not ready, to_process_count: {to_process_count} running_time_per_example: {running_time_per_example}",
                }
            else:
                resp.status = falcon.HTTP_200
                resp.media = {
                    "ready_status": f"Ready, to_process_count: {to_process_count} running_time_per_example: {running_time_per_example}",
                }


class Meta(object):
    def on_get(self, req, resp):
        if req.params.get("example") == "true":
            resp.content_type = mimetypes.guess_type(_utils.example[0])[0]
            resp.stream = open(_utils.example[0], "rb")
            resp.downloadable_as = os.path.basename(_utils.example[0])

        else:
            ALL_META = {}
            for k, v in _utils.META_INDEX.items():
                ALL_META[k] = v

            ALL_META["is_file_input"] = IS_FILE_INPUT
            ALL_META["example"] = _utils.example

            resp.media = ALL_META
            resp.status = falcon.HTTP_200


class Res(object):
    def on_post(self, req, resp):
        try:
            unique_id = req.media["unique_id"]
            _utils.logger.info(f"unique_id: {unique_id} Result request received.")
            try:
                pred = RESULTS_INDEX.pop(unique_id)
                resp.media = {"success": True, "prediction": pred}
                _metrics = _utils.METRICS_INDEX[unique_id]
                _metrics["responded"] = time.time()
                _utils.METRICS_INDEX[unique_id] = _metrics
            except:
                if unique_id in REQUEST_INDEX:
                    resp.media = {"success": None, "reason": "processing"}
                else:
                    resp.media = {
                        "success": False,
                        "reason": "No request found with this unique_id",
                    }

            resp.status = falcon.HTTP_200

        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            resp.media = {"success": False, "reason": str(ex)}
            resp.status = falcon.HTTP_400


json_handler = falcon.media.JSONHandler(
    loads=ujson.loads, dumps=partial(ujson.dumps, ensure_ascii=False)
)

extra_handlers = {
    "application/json": json_handler,
}

app = falcon.App(cors_enable=True)
app.req_options.media_handlers.update(extra_handlers)
app.resp_options.media_handlers.update(extra_handlers)
app.req_options.auto_parse_form_urlencoded = True
app = falcon.App(
    middleware=falcon.CORSMiddleware(
        allow_origins=_utils.ALLOWED_ORIGINS, allow_credentials=_utils.ALLOWED_ORIGINS
    )
)

infer_api = Infer()
res_api = Res()
metrics_api = Metrics()
meta_api = Meta()
health_api = Health()

app.add_route("/infer", infer_api)
app.add_route("/result", res_api)
app.add_route("/metrics", metrics_api)
app.add_route("/meta", meta_api)
app.add_route("/health", health_api)


app.add_static_route(
    "/",
    _utils.FASTDEPLOY_UI_PATH,
    fallback_filename="index.html",
)

# Backwards compatibility
app.add_route("/sync", infer_api)


def websocket_handler(env, start_response):
    if "wsgi.websocket" in env:
        ws = env["wsgi.websocket"]

        connection_id = f"{uuid.uuid4()}"
        n = 0
        start_time = time.time()
        _utils.logger.info(f"{self.connection_id} websocket connection opened.")

        while True:
            msg = ws.receive()
            if msg is None:
                break

            message_id = f"{connection_id}.{n}"
            REQUEST_INDEX[message_id] = [message]
            preds, status = wait_and_read_pred(message_id)
            if "prediction" in preds:
                preds["prediction"] = preds["prediction"][0]

            ws.send(ujson.dumps(preds))

        _utils.logger.info(
            f"{self.connection_id} websocket connection closed. Time spent: {time.time() - self.start_time} n_mesages: {self.n}"
        )

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

_utils.logger.info(f"Waiting for warmup, batch size search to finish.")

while "LAST_PREDICTOR_SEQUENCE" not in _utils.META_INDEX:
    time.sleep(5)

LAST_PREDICTOR_SEQUENCE = _utils.META_INDEX["LAST_PREDICTOR_SEQUENCE"]

while f"example_{LAST_PREDICTOR_SEQUENCE}" not in _utils.META_INDEX:
    time.sleep(5)

ONLY_ASYNC = os.getenv("ONLY_ASYNC", False)

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

                _metrics = {}
                _metrics["received"] = time.time()
                _metrics["in_data"] = in_data
                _utils.METRICS_CACHE[unique_id] = _metrics

                REQUEST_INDEX[unique_id] = (
                    in_data,
                    [_extra_options_for_predictor.get(_) for _ in _in_file_names],
                )

                if is_async_request:
                    resp.media = {"unique_id": unique_id, "success": True}
                    resp.status = falcon.HTTP_200
                else:
                    resp.media, resp.status = wait_and_read_pred(unique_id)

                _metrics = _utils.METRICS_CACHE[unique_id]
                _metrics["responded"] = time.time()
                _utils.METRICS_CACHE[unique_id] = _metrics

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


ALL_META = {}
for k, v in _utils.META_INDEX.items():
    ALL_META[k] = v

ALL_META["is_file_input"] = IS_FILE_INPUT
ALL_META["example"] = _utils.example


class Health(object):
    def on_get(self, req, resp):
        stuck_for = req.params.get("stuck")
        if stuck_for:
            stuck_for = float(stuck_for)
            last_prediction_loop_start_time = _utils.META_INDEX[
                f"last_prediction_loop_start_time_0"
            ]
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

        else:
            pass
            # time.time() - REQUEST_INDEX[]

class Readiness(object):
    def on_get(self, req, resp):
        max_wait_time = float(req.params.get("waittime", _utils.TIMEOUT)) # Incase max wait time is not defined use TIMEOUT as max wait time
        use_time_based_avg = True if req.params.get("timeavg", "false") == "true" else False

        last_prediction_loop_start_time = _utils.META_INDEX["last_prediction_loop_start_time"]
        
        if last_prediction_loop_start_time == 0:
            # If prediction loop not started ==> not ready
            resp.status = falcon.HTTP_503
            resp.media = {
                "ready_status": f"Not ready, prediction loop not started"
            }
        else:
            # If prediction loop started, check for wait time
            last_100_metric = [_utils.METRICS_CACHE[i][1] for i in range(len(_utils.METRICS_CACHE)-1, max(len(_utils.METRICS_CACHE)-100, -1), -1)] # use only last 100 responses for approximation.
            current_time = time.time()

            total_response_time = _utils.META_INDEX["time_per_example"] + (current_time - last_prediction_loop_start_time) # also use time per example and current loop running time as 2 samples.
            total_requests = 2
            
            if use_time_based_avg:
                # Filter samples based on time intervals
                time_samples = float(req.params.get("samples", 10))

                for _metrics in last_100_metric:
                    if (current_time - _metrics["received"]) <= time_samples:
                        total_response_time += (_metrics["responded"]-_metrics["received"])
                        total_requests += _metrics["predicted_in_batch"]
                    else:
                        break
            else:
                # Filter samples based on top N number of samples
                num_samples = min(int(req.params.get("samples", 100)), len(last_100_metric))

                for i in range(num_samples):
                    _metrics = last_100_metric[i]
                    total_response_time += (_metrics["responded"]-_metrics["received"])
                    total_requests += _metrics["predicted_in_batch"]
            
            # Calculate total numbers of reqs in pending reqs queue
            total_reqs_in_queue = 0
            for key, value in _utils.REQUEST_INDEX.items():
                total_reqs_in_queue += len(value[0])

            approx_wait_time = total_reqs_in_queue*(total_response_time/total_requests) # expected wait time

            if (max_wait_time) and (approx_wait_time > max_wait_time):
                    resp.status = falcon.HTTP_503
                    resp.media = {
                        "ready_status": f"Not ready, current wait time is {approx_wait_time}s which is more than max wait time of {max_wait_time}s"
                    }
            else:
                resp.status = falcon.HTTP_200
                resp.media = {
                    "ready_status": f"Ready, current wait time is {approx_wait_time}s"
                }

class Meta(object):
    def on_get(self, req, resp):
        if req.params.get("example") == "true":
            resp.content_type = mimetypes.guess_type(_utils.example[0])[0]
            resp.stream = open(_utils.example[0], "rb")
            resp.downloadable_as = os.path.basename(_utils.example[0])

        else:
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
                _metrics = _utils.METRICS_CACHE[unique_id]
                _metrics["responded"] = time.time()
                _utils.METRICS_CACHE[unique_id] = _metrics
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
readiness_api = Readiness()

app.add_route("/infer", infer_api)
app.add_route("/result", res_api)
app.add_route("/metrics", metrics_api)
app.add_route("/meta", meta_api)
app.add_route("/health", health_api)
app.add_route("/readiness", readiness_api)


app.add_static_route(
    "/",
    _utils.FASTDEPLOY_UI_PATH,
    fallback_filename="index.html",
)

# Backwards compatibility
app.add_route("/sync", infer_api)

from geventwebsocket import WebSocketApplication


class WebSocketInfer(WebSocketApplication):
    def on_open(self):
        self.connection_id = f"{uuid.uuid4()}"
        self.n = 0
        self.start_time = time.time()
        _utils.logger.info(f"{self.connection_id} websocket connection opened.")

    def on_message(self, message):
        self.n += 1
        try:
            if message is not None:
                metrics = {
                    "received": time.time(),
                    "prediction_start": -1,
                    "prediction_end": -1,
                    "batch_size": 1,
                    "predicted_in_batch": -1,
                    "responded": -1,
                }
                message_id = f"{self.connection_id}.{self.n}"
                REQUEST_INDEX[message_id] = ([message], metrics)
                preds, status, metrics = wait_and_read_pred(message_id)
                if "prediction" in preds:
                    preds["prediction"] = preds["prediction"][0]

                self.ws.send(ujson.dumps(preds))

        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            pass

    def on_close(self, reason):
        _utils.logger.info(
            f"{self.connection_id} websocket connection closed. Time spent: {time.time() - self.start_time} n_mesages: {self.n}"
        )
        pass

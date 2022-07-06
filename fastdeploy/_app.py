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
while "time_per_example" not in _utils.META_INDEX:
    time.sleep(5)

ONLY_ASYNC = os.getenv("ONLY_ASYNC", False)

TIME_PER_EXAMPLE = _utils.META_INDEX["time_per_example"]
IS_FILE_INPUT = _utils.META_INDEX["IS_FILE_INPUT"]


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
            pred, metrics = _utils.RESULTS_INDEX[unique_id]
            try:
                response = {"prediction": pred, "success": True}
            # if return dict has any non json serializable values, we str() it
            except:
                _utils.logger.info(
                    f"unique_id: {unique_id} could not json serialize the result."
                )
                response = {"prediction": str(pred), "success": True}
            status = falcon.HTTP_200
            break
        except:
            # stop in case of timeout
            if time.time() - start_time >= _utils.TIMEOUT:
                _utils.logger.warn(
                    f"unique_id: {unique_id} timedout, with timeout {_utils.TIMEOUT}"
                )
                break

            gevent.time.sleep(TIME_PER_EXAMPLE * 0.501)
            metrics = {}

    return response, status, metrics


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

            metrics = {
                "received": time.time(),
                "prediction_start": -1,
                "prediction_end": -1,
                "batch_size": len(in_data),
                "predicted_in_batch": -1,
                "responded": -1,
            }

            _utils.REQUEST_INDEX[unique_id] = (
                in_data,
                metrics,
                [_extra_options_for_predictor.get(_) for _ in _in_file_names],
            )

            _utils.META_INDEX["TOTAL_REQUESTS"] += 1

            if is_async_request:
                resp.media = {"unique_id": unique_id, "success": True}
                resp.status = falcon.HTTP_200
            else:
                preds, status, _metrics = wait_and_read_pred(unique_id)

                if not len(_metrics):
                    _metrics = metrics

                _metrics["responded"] = time.time()
                _utils.METRICS_CACHE[len(_utils.METRICS_CACHE)] = (
                    unique_id,
                    _metrics,
                    in_data,
                )

                resp.media = preds
                resp.status = status

        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            resp.media = {"success": False, "reason": "malformed request"}
            resp.status = falcon.HTTP_400


class Metrics(object):
    def on_get(self, req, resp):

        try:
            end_time = int(req.params.get("from_time", time.time()))
            total_time = int(req.params.get("total_time", 3600))

            loop_batch_size = _utils.META_INDEX["batch_size"]
            batch_size_to_time_per_example = _utils.META_INDEX[
                "batch_size_to_time_per_example"
            ]

            first_end_time = 0
            all_metrics_in_time_period = {
                "time_graph_data": {
                    "labels": [],
                    "datasets": [
                        {"name": "Response time", "values": []},
                        {"name": "Prediction time", "values": []},
                    ],
                },
                "auto_batching_graph_data": {
                    "labels": [],
                    "datasets": [
                        {"name": "Input batch size", "values": []},
                        {"name": "Dynamically batched to", "values": []},
                    ],
                },
                "index_to_all_meta": {},
            }

            current_time = time.time()

            n_metrics = len(_utils.METRICS_CACHE)
            total_requests = n_metrics

            for _ in reversed(range(n_metrics)):
                unique_id, _metrics, _in_data = _utils.METRICS_CACHE[_]
                # max 5 second loop alowed
                if time.time() - current_time >= 5:
                    break

                received_time = _metrics["received"]
                prediction_start = _metrics["prediction_start"]
                prediction_end = _metrics["prediction_end"]
                batch_size = _metrics["batch_size"]
                predicted_in_batch = _metrics["predicted_in_batch"]
                responded_at = _metrics["responded"]

                prediction_time_per_example = (
                    prediction_end - prediction_start
                ) / predicted_in_batch

                if current_time - received_time >= total_time:
                    break

                if received_time <= 0 or responded_at <= 0:
                    continue

                x_id = total_requests - len(
                    all_metrics_in_time_period["index_to_all_meta"]
                )

                all_metrics_in_time_period["auto_batching_graph_data"]["labels"].insert(
                    0, x_id
                )
                all_metrics_in_time_period["auto_batching_graph_data"]["datasets"][0][
                    "values"
                ].insert(0, batch_size)
                all_metrics_in_time_period["auto_batching_graph_data"]["datasets"][1][
                    "values"
                ].insert(0, predicted_in_batch)

                all_metrics_in_time_period["time_graph_data"]["labels"].insert(0, x_id)
                all_metrics_in_time_period["time_graph_data"]["datasets"][0][
                    "values"
                ].insert(0, responded_at - received_time)
                all_metrics_in_time_period["time_graph_data"]["datasets"][1][
                    "values"
                ].insert(
                    0,
                    batch_size
                    * (prediction_end - prediction_start)
                    / predicted_in_batch,
                )

                all_metrics_in_time_period["index_to_all_meta"][
                    n_metrics - len(all_metrics_in_time_period["index_to_all_meta"])
                ] = {
                    "unique_id": unique_id,
                    "received_time": str(
                        datetime.datetime.fromtimestamp(received_time)
                    ),
                    "prediction_time_per_example": prediction_time_per_example,
                    "batch_size": batch_size,
                    "start_to_end_time": responded_at - received_time,
                    "predicted_in_batch": predicted_in_batch,
                }

            resp.media = all_metrics_in_time_period
            resp.status = falcon.HTTP_200

        except Exception as ex:
            logging.exception(ex, exc_info=True)
            pass


ALL_META = {}
for k, v in _utils.META_INDEX.items():
    ALL_META[k] = v

ALL_META["is_file_input"] = IS_FILE_INPUT
ALL_META["example"] = _utils.example


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
                pred, metrics = _utils.RESULTS_INDEX[unique_id]
                resp.media = {"success": True, "prediction": pred}
            except:
                if unique_id in _utils.REQUEST_INDEX:
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

app.add_route("/infer", infer_api)
app.add_route("/result", res_api)
app.add_route("/metrics", metrics_api)
app.add_route("/meta", meta_api)


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
                _utils.REQUEST_INDEX[message_id] = ([message], metrics)
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

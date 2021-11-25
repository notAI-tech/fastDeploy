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
import datetime
import logging
import epyk
from functools import partial

from . import _utils

while "META.time_per_example" not in _utils.LOG_INDEX:
    _utils.logger.info(f"Waiting for batch size search to finish.")
    time.sleep(5)

ONLY_ASYNC = os.getenv("ONLY_ASYNC", False)

TIME_PER_EXAMPLE = _utils.LOG_INDEX["META.time_per_example"]
IS_FILE_INPUT = _utils.LOG_INDEX["META.IS_FILE_INPUT"]


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

                else:
                    in_data = []

                    for part in req.get_media():
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

            _utils.REQUEST_INDEX[unique_id] = (in_data, metrics)

            if is_async_request:
                resp.media = {"unique_id": unique_id, "success": True}
                resp.status = falcon.HTTP_200
            else:
                preds, status, _metrics = wait_and_read_pred(unique_id)

                if not len(_metrics):
                    _metrics = metrics

                _metrics["responded"] = time.time()
                _utils.LOG_INDEX[unique_id] = (_metrics, in_data)

                resp.media = preds
                resp.status = status

        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            resp.media = {"success": False, "reason": str(ex)}
            resp.status = falcon.HTTP_400


class Metrics(object):
    def on_get(self, req, resp):

        try:
            end_time = int(req.params.get("from_time", time.time()))
            total_time = int(req.params.get("total_time", 600))

            loop_batch_size = _utils.LOG_INDEX["META.batch_size"]
            batch_size_to_time_per_example = _utils.LOG_INDEX[
                "META.batch_size_to_time_per_example"
            ]

            first_end_time = 0
            all_results_in_time_period = []

            current_time = time.time()

            for _ in reversed(_utils.LOG_INDEX):
                if _[:5] == "META.":
                    continue

                (metrics, in_data), result = (
                    _utils.LOG_INDEX[_],
                    _utils.RESULTS_INDEX[_],
                )

                if metrics["received"] <= end_time:
                    all_results_in_time_period.append(
                        {
                            "unique_id": _,
                            "loop_time_per_example": loop_time_per_example,
                            "received_on": metrics["received"] - current_time,
                            "prediction_time_per_example": (
                                metrics["prediction_end"] - metrics["prediction_start"]
                            )
                            / metrics["predicted_in_batch"],
                            "latency": metrics["prediction_start"]
                            - metrics["received"]
                            + metrics["responded"]
                            - metrics["prediction_end"],
                        }
                    )
                    if first_end_time == 0:
                        first_end_time = metrics["received"]

                if metrics["received"] + total_time < end_time:
                    break

            page = epyk.Page()
            page.headers.dev()
            js_data = page.data.js.record(data=all_results_in_time_period)

            line = page.ui.charts.chartJs.line(
                all_results_in_time_period,
                y_columns=["prediction_time_per_example", "loop_time_per_example"],
                x_axis="unique_id",
            )
            page.ui.row([line])

            print(dir(page.outs))

            resp.text = page.outs.html()
            resp.content_type = "text/html"
            resp.status = falcon.HTTP_200
        except Exception as ex:
            logging.exception(ex, exc_info=True)
            pass


class Webui(object):
    def on_get(self, req, resp):

        try:
            pass
        except Exception as ex:
            logging.exception(ex, exc_info=True)
            pass


class Res(object):
    def on_post(self, req, resp):
        try:
            unique_id = req.media["unique_id"]
            _utils.logger.info(f"unique_id: {unique_id} Result request received.")
            resp.media = {"success": None, "reason": "processing"}
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
webui_api = Webui()

app.add_route("/infer", infer_api)
app.add_route("/result", res_api)
app.add_route("/metrics", metrics_api)
app.add_route("/", webui_api)

# Backwards compatibility
app.add_route("/sync", infer_api)


from geventwebsocket import WebSocketApplication

CONTEXT_PREDICTOR = _utils.LOG_INDEX[f"META.context"]


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
                if not CONTEXT_PREDICTOR:
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

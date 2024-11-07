from gevent import monkey

monkey.patch_all()

import os
import json
import time
import uuid
import pickle
import falcon
import gevent
import threading
import importlib

from . import _utils
from . import _infer

try:
    get_prometheus_metrics = importlib.import_module(
        "extra_prometheus_metrics"
    ).get_prometheus_metrics
except ImportError:
    get_prometheus_metrics = None


class AsyncResponseHandler:
    def __init__(self, check_interval=0.003):
        self.pending_requests = {}
        self.check_interval = check_interval
        self.lock = threading.Lock()
        self.infer = _infer.Infer()

        gevent.spawn(self._response_checker)

    def register_request_and_wait_for_response(
        self, unique_id, is_compressed, input_type, timeout
    ):
        event = gevent.event.Event()

        with self.lock:
            self.pending_requests[unique_id] = {
                "event": event,
                "is_compressed": is_compressed,
                "input_type": input_type,
                "timestamp": time.time(),
            }

        try:
            if event.wait(timeout=timeout):
                with self.lock:
                    response = self.pending_requests[unique_id].get("response")
                    return response
            else:
                return self.infer.get_timeout_response(
                    unique_id, is_compressed, input_type, is_client_timeout=True
                )
        finally:
            with self.lock:
                self.pending_requests.pop(unique_id, None)

    def deregister_request(self, unique_id):
        with self.lock:
            self.pending_requests.pop(unique_id, None)

    def _response_checker(self):
        last_input_received_at = time.time()
        while True:
            try:
                unique_ids = []
                is_compresseds = []
                input_types = []
                with self.lock:
                    for uid, data in self.pending_requests.items():
                        unique_ids.append(uid)
                        is_compresseds.append(data["is_compressed"])
                        input_types.append(data["input_type"])
                        last_input_received_at = data["timestamp"]

                if not unique_ids and (time.time() - last_input_received_at) > 5:
                    time.sleep(0.05)
                    continue

                if unique_ids:
                    _utils.logger.debug(
                        f"Checking responses for unique_ids: {unique_ids}"
                    )
                    try:
                        responses = self.infer.get_responses_for_unique_ids(
                            unique_ids=unique_ids,
                            is_compresseds=is_compresseds,
                            input_types=input_types,
                        )

                        for uid, response in responses.items():
                            if response is not None:
                                with self.lock:
                                    if uid in self.pending_requests:
                                        request_data = self.pending_requests[uid]
                                        request_data["response"] = response
                                        request_data["event"].set()

                    except Exception as e:
                        _utils.logger.exception(e, exc_info=True)
                        _utils.logger.error(f"Error checking responses: {e}")

            except Exception as e:
                _utils.logger.error(f"Error in response checker loop: {e}")

            finally:
                gevent.sleep(self.check_interval)


class Infer(object):
    def __init__(self):
        self._infer = _infer.Infer()
        self._response_handler = AsyncResponseHandler()

    def on_post(self, req, resp):
        request_received_at = time.time()

        unique_id = str(req.params.get("unique_id", uuid.uuid4()))
        client_timeout = float(req.params.get("timeout", os.getenv("TIMEOUT", 480)))

        is_compressed = req.params.get("compressed", "f")[0].lower() == "t"
        input_type = req.params.get("input_type", "json")

        success, failure_response = self._infer.add_to_infer_queue(
            inputs=req.stream.read(),
            unique_id=unique_id,
            input_type=input_type,
            is_compressed=is_compressed,
        )

        if is_compressed:
            resp.content_type = "application/octet-stream"
        elif input_type == "json":
            resp.content_type = "application/json"
        elif input_type == "pickle":
            resp.content_type = "application/pickle"
        elif input_type == "msgpack":
            resp.content_type = "application/msgpack"

        if success is not True:
            resp.status = falcon.HTTP_400
            if input_type == "json":
                resp.media = failure_response
            else:
                resp.data = failure_response

        else:
            (
                success,
                response,
            ) = self._response_handler.register_request_and_wait_for_response(
                unique_id, is_compressed, input_type, client_timeout
            )
            if success:
                resp.status = falcon.HTTP_200
            else:
                resp.status = falcon.HTTP_500

            if input_type == "json":
                resp.media = response
            else:
                resp.data = response


class PrometheusMetrics(object):
    def on_get(self, req, resp):
        _LAST_X_SECONDS = int(
            req.params.get("last_x_seconds", int(os.getenv("LAST_X_SECONDS", 30)))
        )
        CURRENT_TIME = time.time()
        LAST_X_SECONDS = time.time() - _LAST_X_SECONDS

        number_of_requests_timedout_in_last_x_seconds = _utils.MAIN_INDEX.count(
            query={
                "-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME},
                "timedout_in_queue": True,
            }
        )

        requests_received_in_last_x_seconds = _utils.MAIN_INDEX.count(
            query={"-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME}}
        )

        requests_received_in_last_x_seconds_that_failed = _utils.MAIN_INDEX.count(
            query={
                "-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME},
                "last_predictor_success": False,
            }
        )

        requests_received_in_last_x_seconds_that_are_pending = _utils.MAIN_INDEX.count(
            query={
                "-1.predicted_at": 0,
                "last_predictor_success": {"$ne": False},
                "-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME},
            }
        )

        requests_received_in_last_x_seconds_that_are_successful = (
            _utils.MAIN_INDEX.count(
                query={
                    "-1.predicted_at": {"$ne": 0},
                    "last_predictor_success": True,
                    "-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME},
                }
            )
        )

        avg_total_time_per_req_for_reqs_in_last_x_seconds = 0

        __sum_of_received_at = _utils.MAIN_INDEX.math(
            "-1.received_at",
            "sum",
            query={
                "-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME},
                "-1.predicted_at": {"$ne": 0},
            },
        )

        __sum_of_predicted_at = _utils.MAIN_INDEX.math(
            "-1.predicted_at",
            "sum",
            query={
                "-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME},
                "-1.predicted_at": {"$ne": 0},
            },
        )

        if __sum_of_received_at and __sum_of_predicted_at:
            avg_total_time_per_req_for_reqs_in_last_x_seconds = (
                __sum_of_predicted_at - __sum_of_received_at
            ) / requests_received_in_last_x_seconds_that_are_successful

        avg_actual_total_time_per_req_for_reqs_in_last_x_seconds = 0

        for executor_n in [0]:
            _temp_sum_of_received_at = _utils.MAIN_INDEX.math(
                f"{executor_n}.received_at",
                "sum",
                query={
                    "-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME},
                    "-1.predicted_at": {"$ne": 0},
                },
            )

            _temp_sum_of_predicted_at = _utils.MAIN_INDEX.math(
                f"{executor_n}.predicted_at",
                "sum",
                query={
                    "-1.received_at": {"$gt": LAST_X_SECONDS, "$lt": CURRENT_TIME},
                    "-1.predicted_at": {"$ne": 0},
                },
            )

            if _temp_sum_of_received_at and _temp_sum_of_predicted_at:
                avg_actual_total_time_per_req_for_reqs_in_last_x_seconds = (
                    _temp_sum_of_predicted_at - _temp_sum_of_received_at
                ) / requests_received_in_last_x_seconds_that_are_successful

        prometheus_text = f"""
# HELP requests_received_in_last_x_seconds The number of requests received in last {_LAST_X_SECONDS} seconds.
# TYPE requests_received_in_last_x_seconds gauge
requests_received_in_last_x_seconds {requests_received_in_last_x_seconds}

# HELP number_of_requests_timedout_in_last_x_seconds The number of requests timedout at predictor(s) in last {_LAST_X_SECONDS} seconds.
# TYPE number_of_requests_timedout_in_last_x_seconds gauge
number_of_requests_timedout_in_last_x_seconds {number_of_requests_timedout_in_last_x_seconds}

# HELP requests_received_in_last_x_seconds_that_failed The number of requests received in last {_LAST_X_SECONDS} seconds that failed.
# TYPE requests_received_in_last_x_seconds_that_failed gauge
requests_received_in_last_x_seconds_that_failed {requests_received_in_last_x_seconds_that_failed}

# HELP requests_received_in_last_x_seconds_that_are_pending The number of requests received in last {_LAST_X_SECONDS} seconds that are pending.
# TYPE requests_received_in_last_x_seconds_that_are_pending gauge
requests_received_in_last_x_seconds_that_are_pending {requests_received_in_last_x_seconds_that_are_pending}

# HELP requests_received_in_last_x_seconds_that_are_successful The number of requests received in last {_LAST_X_SECONDS} seconds that are successful.
# TYPE requests_received_in_last_x_seconds_that_are_successful gauge
requests_received_in_last_x_seconds_that_are_successful {requests_received_in_last_x_seconds_that_are_successful}

# HELP avg_total_time_per_req_for_reqs_in_last_x_seconds The average total time per request for requests in last {_LAST_X_SECONDS} seconds.
# TYPE avg_total_time_per_req_for_reqs_in_last_x_seconds gauge
avg_total_time_per_req_for_reqs_in_last_x_seconds {avg_total_time_per_req_for_reqs_in_last_x_seconds}

# HELP avg_actual_total_time_per_req_for_reqs_in_last_x_seconds The average actual total time per request for requests in last {_LAST_X_SECONDS} seconds.
# TYPE avg_actual_total_time_per_req_for_reqs_in_last_x_seconds gauge
avg_actual_total_time_per_req_for_reqs_in_last_x_seconds {avg_actual_total_time_per_req_for_reqs_in_last_x_seconds}
        """.strip()

        if get_prometheus_metrics is not None:
            extra_prometheus_metrics_data = get_prometheus_metrics()

            if extra_prometheus_metrics_data:
                extra_prometheus_texts = []
                for metric_name, metric_data in extra_prometheus_metrics_data.items():
                    extra_prometheus_texts.append(
                        f"""
# HELP {metric_name} {metric_data['help']}
# TYPE {metric_name} {metric_data['type']}
{metric_name} {metric_data['value']}
                    """.strip()
                    )
                prometheus_text += "\n\n" + "\n\n".join(extra_prometheus_texts)

        resp.status = falcon.HTTP_200
        resp.content_type = "text/plain; version=0.0.4"
        resp.text = prometheus_text


class Health(object):
    def on_get(self, req, resp):
        fail_if_percentage_of_requests_failed_in_last_x_seconds_is_more_than_y_param = req.params.get(
            "fail_if_percentage_of_requests_failed_in_last_x_seconds_is_more_than_y",
            None,
        )

        fail_if_requests_older_than_x_seconds_pending_param = req.params.get(
            "fail_if_requests_older_than_x_seconds_pending", None
        )

        fail_if_up_time_more_than_x_seconds_param = req.params.get(
            "fail_if_up_time_more_than_x_seconds", None
        )

        fail_if_requests_timedout_in_last_x_seconds_is_more_than_y_param = (
            req.params.get(
                "fail_if_requests_timedout_in_last_x_seconds_is_more_than_y", None
            )
        )

        is_predictor_is_up_param = req.params.get("is_predictor_is_up", None)

        if fail_if_percentage_of_requests_failed_in_last_x_seconds_is_more_than_y_param:
            (
                x,
                y,
            ) = fail_if_percentage_of_requests_failed_in_last_x_seconds_is_more_than_y_param.split(
                ","
            )
            x, y = int(x), int(y)
            if _utils.check_if_percentage_of_requests_failed_in_last_x_seconds_is_more_than_y(
                x, y
            ):
                resp.status = falcon.HTTP_503
                resp.media = {
                    "reason": f"More than {y}% requests failed in last {x} seconds"
                }
                return

        elif fail_if_requests_older_than_x_seconds_pending_param:
            if _utils.check_if_requests_older_than_x_seconds_pending(
                int(fail_if_requests_older_than_x_seconds_pending_param)
            ):
                resp.status = falcon.HTTP_503
                resp.media = {
                    "reason": f"Requests older than {fail_if_requests_older_than_x_seconds_pending_param} seconds are pending"
                }
                return

        elif fail_if_up_time_more_than_x_seconds_param:
            if time.time() - Infer.started_at_time > int(
                fail_if_up_time_more_than_x_seconds_param
            ):
                resp.status = falcon.HTTP_503
                resp.media = {
                    "reason": f"Up time more than {fail_if_up_time_more_than_x_seconds_param} seconds"
                }
                return

        elif fail_if_requests_timedout_in_last_x_seconds_is_more_than_y_param:
            (
                x,
                y,
            ) = fail_if_requests_timedout_in_last_x_seconds_is_more_than_y_param.split(
                ","
            )
            x, y = int(x), int(y)
            if _utils.check_if_requests_timedout_in_last_x_seconds_is_more_than_y(x, y):
                resp.status = falcon.HTTP_503
                return

        resp.status = falcon.HTTP_200
        resp.media = {"status": "ok"}


class Meta(object):
    def on_get(self, req, resp):
        resp.status = falcon.HTTP_200

        if "is_pickle_allowed" in req.params:
            resp.media = {
                "is_pickle_allowed": os.getenv("ALLOW_PICKLE", "true").lower() == "true"
            }

        else:
            try:
                json.dumps(_utils.example)
                __example = _utils.example
            except:
                __example = None

            resp.media = {
                "name": _utils.recipe_name,
                "example": __example,
                "is_pickle_allowed": os.getenv("ALLOW_PICKLE", "true").lower()
                == "true",
                "timeout": int(os.getenv("TIMEOUT")),
            }


app = falcon.App(
    middleware=falcon.CORSMiddleware(allow_origins="*", allow_credentials="*"),
)

infer_api = Infer()
prometheus_metrics = PrometheusMetrics()
health_api = Health()

app.add_route("/infer", infer_api)
app.add_route("/sync", infer_api)
app.add_route("/prometheus_metrics", prometheus_metrics)
app.add_route("/health", health_api)
app.add_route("/meta", Meta())

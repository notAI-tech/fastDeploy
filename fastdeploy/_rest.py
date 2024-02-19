from gevent import monkey

monkey.patch_all()

import os
import time
import uuid
import pickle
import falcon

from . import _utils
from . import _infer

ONLY_ASYNC = os.environ.get("ONLY_ASYNC", "f")[0].lower() == "t"


class Infer(object):
    def __init__(self):
        self._infer = _infer.Infer()

    def on_post(self, req, resp):
        request_received_at = time.time()

        unique_id = str(req.params.get("unique_id", uuid.uuid4()))

        is_async_request = ONLY_ASYNC or req.params.get("async", "f")[0].lower() == "t"
        is_compressed = req.params.get("compressed", "f")[0].lower() == "t"
        input_type = req.params.get("input_type", "json")

        success, response = self._infer.infer(
            inputs=req.stream.read(),
            unique_id=unique_id,
            input_type=input_type,
            is_compressed=is_compressed,
            is_async_request=is_async_request,
        )

        if is_compressed:
            resp.data = response
            resp.content_type = "application/octet-stream"

        elif input_type == "json":
            resp.media = response
        elif input_type == "pickle":
            resp.data = response
            resp.content_type = "application/pickle"
        elif input_type == "msgpack":
            resp.data = response
            resp.content_type = "application/msgpack"

        resp.status = falcon.HTTP_200 if success else falcon.HTTP_400


class PrometheusMetrics(object):
    def on_get(self, req, resp):
        _LAST_X_SECONDS = 300
        LAST_X_SECONDS = time.time() - _LAST_X_SECONDS
        requests_received_in_last_x_seconds = _utils.MAIN_INDEX.count(
            query={"-1.received_at": {"$gt": LAST_X_SECONDS}}
        )

        requests_received_in_last_x_seconds_that_failed = _utils.MAIN_INDEX.count(
            query={
                "-1.received_at": {"$gt": LAST_X_SECONDS},
                "last_predictor_success": False
            }
        )

        requests_received_in_last_x_seconds_that_are_pending = _utils.MAIN_INDEX.count(
            query={"-1.predicted_at": 0, "last_predictor_success": {"$ne": False}}
        )

        requests_received_in_last_x_seconds_that_are_successful = _utils.MAIN_INDEX.count(
            query={"-1.predicted_at": {"$ne": 0}, "last_predictor_success": True}
        )

        prometheus_text = f"""# HELP pending_requests The number of pending requests.
        # TYPE pending_requests gauge
        pending_requests {_utils.MAIN_INDEX.count(query={"-1.predicted_at": 0, "last_predictor_success": True})}

        # HELP failed_requests The number of failed requests.
        # TYPE failed_requests gauge
        failed_requests {_utils.MAIN_INDEX.count(query={"last_predictor_success": False})}

        # HELP successful_requests The number of failed requests.
        # TYPE successful_requests gauge
        successful_requests {_utils.MAIN_INDEX.count(query={"-1.predicted_at": {"$ne": 0}, "last_predictor_success": True})}

        # HELP requests_received_in_last_x_seconds The number of requests received in last {_LAST_X_SECONDS} seconds.
        # TYPE requests_received_in_last_x_seconds gauge
        requests_received_in_last_x_seconds {requests_received_in_last_x_seconds}

        # HELP requests_received_in_last_x_seconds_that_failed The number of requests received in last {_LAST_X_SECONDS} seconds that failed.
        # TYPE requests_received_in_last_x_seconds_that_failed gauge
        requests_received_in_last_x_seconds_that_failed {requests_received_in_last_x_seconds_that_failed}
        """

        resp.status = falcon.HTTP_200
        resp.content_type = "text/plain; version=0.0.4"
        resp.text = prometheus_text


class Health(object):
    def on_get(self, req, resp):
        fail_if_any_request_takes_more_than_x_seconds_param = req.params.get(
            "fail_if_any_request_takes_more_than_x_seconds", None
        )

        fail_if_percentage_of_requests_failed_in_last_x_seconds_param = req.params.get(
            "fail_if_percentage_of_requests_failed_in_last_x_seconds", None
        )

        if fail_if_percentage_of_requests_failed_in_last_x_seconds_param:
            fail_if_percentage_of_requests_failed_in_last_x_seconds_param = fail_if_percentage_of_requests_failed_in_last_x_seconds_param.split(",")
            x_seconds_back_time = time.time() - int(
                fail_if_percentage_of_requests_failed_in_last_x_seconds_param[1]
            )

            max_percentage_of_failed_requests = int(
                fail_if_percentage_of_requests_failed_in_last_x_seconds_param[0]
            )

            requests_received_in_last_x_seconds = _utils.MAIN_INDEX.count(
                query={"-1.received_at": {"$gt": x_seconds_back_time}}
            )
            requests_received_in_last_x_seconds_that_failed = _utils.MAIN_INDEX.count(
                query={
                    "-1.received_at": {"$gt": x_seconds_back_time},
                    "last_predictor_success": False
                }
            )

            if requests_received_in_last_x_seconds and (requests_received_in_last_x_seconds_that_failed / requests_received_in_last_x_seconds) * 100 >= max_percentage_of_failed_requests:
                resp.status = falcon.HTTP_503
                resp.media = {
                    "status": "error",
                    "message": f"More than {max_percentage_of_failed_requests}% of requests failed in last {fail_if_percentage_of_requests_failed_in_last_x_seconds_param[1]} seconds."
                }
                return


        if fail_if_any_request_takes_more_than_x_seconds_param:
            x_seconds_back_time = time.time() - int(
                fail_if_any_request_takes_more_than_x_seconds_param
            )

            if _utils.MAIN_INDEX.count(
                query={
                    "-1.received_at": {"$lt": x_seconds_back_time},
                    "-1.predicted_at": 0,
                    "last_predictor_success": {
                        "$ne": False
                    }
                }
            ):
                resp.status = falcon.HTTP_503
                resp.media = {
                    "status": "error",
                    "message": f"Request took more than {fail_if_any_request_takes_more_than_x_seconds_param} seconds to process."
                }
                return
        
            fail_if_percentage_of_requests_failed_in_last_x_seconds_param = req.params.get(
                "fail_if_percentage_of_requests_failed_in_same_x_seconds", None
            )

        

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
            resp.media = {
                "name": _utils.recipe_name,
                "example": _utils.example,
                "is_pickle_allowed": os.getenv("ALLOW_PICKLE", "true").lower()
                == "true",
                "timeout": os.getenv("TIMEOUT"),
            }


app = falcon.App(
    cors_enable=True,
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

from gevent import monkey

monkey.patch_all()

import os
import time
import uuid
import pickle
import falcon
import msgpack
import mimetypes
import zstandard
from functools import partial

from . import _utils
from . import _infer

ONLY_ASYNC = os.environ.get("ONLY_ASYNC", "0") == "1"


class Infer(object):
    def __init__(self):
        self._infer = _infer.Infer()

    def on_post(self, req, resp):
        request_received_at = time.time()

        unique_id = str(req.params.get("unique_id", uuid.uuid4()))
        is_async_request = ONLY_ASYNC or req.params.get("async") == "1"
        is_pickled_input = req.params.get("pickled") == "1"
        is_compressed = req.params.get("compressed") == "1"

        success, response = self._infer.infer(
            inputs=req.stream.read(),
            unique_id=unique_id,
            is_pickled_input=is_pickled_input,
            is_compressed=is_compressed,
            is_async_request=is_async_request,
        )

        resp.data = response
        resp.content_type = "application/msgpack"
        resp.status = falcon.HTTP_200 if success else falcon.HTTP_400


class PrometheusMetrics(object):
    def on_get(self, req, resp):
        metric_output = f"""# HELP pending_requests The number of pending requests.
        # TYPE pending_requests gauge
        pending_requests {_utils.MAIN_INDEX.count(query={"-1.predicted_at": None, "last_predictor_success": True})}
        """

        resp.status = falcon.HTTP_200
        resp.content_type = "text/plain; version=0.0.4"


app = falcon.App(
    cors_enable=True,
    middleware=falcon.CORSMiddleware(
        allow_origins=_utils.ALLOWED_ORIGINS, allow_credentials=_utils.ALLOWED_ORIGINS
    ),
)

infer_api = Infer()

app.add_route("/infer", infer_api)
app.add_route("/sync", infer_api)

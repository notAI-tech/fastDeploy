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
from functools import partial

from . import _utils

while "META.batch_size" not in _utils.RESULTS_INDEX:
    _utils.logger.info(f"Waiting for batch size search to finish.")
    time.sleep(5)

ONLY_ASYNC = os.getenv("ONLY_ASYNC", False)


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
            pred = _utils.RESULTS_INDEX[unique_id]
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

            gevent.time.sleep(0)

    return response, status


class Infer(object):
    def on_post(self, req, resp):
        try:
            unique_id = str(uuid.uuid4())
            _utils.REQUEST_QUEUE.appendleft((unique_id, req.media["data"]))
            req.media.clear()
            resp.media = wait_and_read_pred(unique_id)
            resp.statys = falcon.HTTP_200

        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            resp.media = {"success": False, "reason": str(ex)}
            resp.status = falcon.HTTP_400


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


class Monitor(object):
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
app.add_route("/infer", infer_api)
app.add_route("/result", res_api)

if __name__ == "__main__":
    batch_size = _utils.RESULTS_INDEX["META.batch_size"]

    from gunicorn.app.wsgiapp import WSGIApplication

    WSGIApplication("%(prog)s [OPTIONS] [APP_MODULE]").run()

    from gevent import pywsgi

    port = int(os.getenv("PORT", "8080"))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"fastDeploy active at http://{host}:{port}")

    server = pywsgi.WSGIServer((host, port), app, spawn=1000, log=None)
    server.serve_forever()

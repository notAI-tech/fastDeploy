from gevent import monkey
import gevent

monkey.patch_all()

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

import _utils

ONLY_ASYNC = os.getenv("ONLY_ASYNC", False)


def wait_and_read_pred(unique_id):
    """
    Waits for and reads result for unique_id.

    :param unique_id: unique_id of the input

    :return response: json dumped python dict with keys "success" and "prediction"/ "reason"
    :return status: HTTP status code
    """
    # Keeping track of start_time for TIMEOUT implementation
    _utils.logger.info(f"unique_id: {unique_id} started waiting.")

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

    # Since this is the last step in /sync, we delete all files related to this unique_id
    _utils.cleanup(unique_id)
    _utils.logger.info(f"unique_id: {unique_id} cleaned up.")

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
    while "META.batch_size" not in _utils.REQUEST_QUEUE:
        _utils.logger.info(f"Waiting for batch size search to finish.")
        time.sleep(5)

    batch_size = _utils.REQUEST_QUEUE["META.batch_size"]

    from gevent import pywsgi
    from gevent import server
    from gevent.server import _tcp_listener
    from multiprocessing import Process, current_process, cpu_count

    port = int(os.getenv("PORT", "8080"))
    host = os.getenv("HOST", "0.0.0.0")

    listener = _tcp_listener((host, port))

    def serve_forever(listener):
        pywsgi.WSGIServer(listener, app).serve_forever()

    print(f"fastDeploy active at http://{host}:{port}")

    if not _utils.WORKERS:
        n_workers = max(3, int((cpu_count()) + 1))
        n_workers = min(n_workers, batch_size + 1)
        _utils.logger.info(
            f"WORKERS={n_workers}; batch_size={batch_size}; cpu_count={multiprocessing.cpu_count()}"
        )
    else:
        n_workers = _utils.WORKERS
        _utils.logger.info(f"WORKERS={n_workers} from supplied config.")

    for _ in range(n_workers):
        _utils.logger.info(f"worker {_ + 1}/{n_workers} started")
        Process(target=serve_forever, args=(listener,)).start()

    serve_forever(listener)

    # server = pywsgi.WSGIServer((host, port), app)
    # server.serve_forever()

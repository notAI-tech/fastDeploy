from gevent import monkey
monkey.patch_all()

import os
import time
import uuid
import falcon
import msgpack
import mimetypes
from functools import partial

from . import _utils

ONLY_ASYNC = bool(os.getenv("ONLY_ASYNC", False))
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", 0))

class Infer(object):
    def on_post(self, req, resp):
        try:
            request_received_at = time.time()

            unique_id = str(req.params.get("unique_id", uuid.uuid4()))
            is_async_request = ONLY_ASYNC or req.params.get("async") and req.params.get("async").lower() == "true"

            inputs = msgpack.unpackb(req.stream.read(), use_list=False, raw=False)

            if not inputs or not isinstance(inputs, (list, tuple)):
                response = {"success": False, "reason": "malformed request"}
                response_status = falcon.HTTP_400

            elif MAX_BATCH_SIZE and len(inputs) > MAX_BATCH_SIZE:
                response = {"success": False, "reason": "batch size exceeded"}
                response_status = falcon.HTTP_400

            else:
                _utils.MAIN_INDEX.update({
                                            unique_id: {
                                                "-1.outputs": inputs,
                                                "-1.received_at": request_received_at,
                                                "-1.predicted_in_batch_of": len(inputs),
                                                "is_async_request": is_async_request,
                                                "last_predictor_sequence": -1,
                                                "last_predictor_success": True,
                                            }
                                        })

                while True:
                    current_results = _utils.MAIN_INDEX.get(unique_id, 
                                            select_keys=[
                                                f"{_utils.LAST_PREDICTOR_SEQUENCE}.outputs",
                                                "last_predictor_success",
                                                "last_predictor_sequence"
                                            ]
                                        )[unique_id]
                    
                    if current_results["last_predictor_success"] is True and current_results["last_predictor_sequence"] == _utils.LAST_PREDICTOR_SEQUENCE:
                        response = {"success": True, "unique_id": unique_id, "prediction": current_results[f"{_utils.LAST_PREDICTOR_SEQUENCE}.outputs"]}
                        response_status = falcon.HTTP_200
                        break
                    elif current_results["last_predictor_success"] is False:
                        response = {"success": False, "reason": f"prediction failed predictor {current_results['last_predictor_sequence']}", "unique_id": unique_id}
                        response_status = falcon.HTTP_500
                        break
                    else:
                        if _utils.TIMEOUT > 0 and _utils.TIMEOUT and time.time() - request_received_at >= _utils.TIMEOUT:
                            response = {"success": False, "reason": "timeout", "unique_id": unique_id}
                            response_status = falcon.HTTP_408
                            break
                        
                        time.sleep(0.1)

        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            response = {"success": False, "reason": "malformed request", "unique_id": unique_id}
            response_status = falcon.HTTP_400
        
        resp.data = msgpack.packb(response, use_bin_type=True)
        resp.content_type = "application/msgpack"
        resp.status = response_status

app = falcon.App(
    cors_enable=True,
    middleware=falcon.CORSMiddleware(
        allow_origins=_utils.ALLOWED_ORIGINS, allow_credentials=_utils.ALLOWED_ORIGINS
    )
)

infer_api = Infer()

app.add_route("/infer", infer_api)
app.add_route("/sync", infer_api)


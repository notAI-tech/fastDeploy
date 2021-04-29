import falcon
from gevent import monkey

monkey.patch_all()

import os
import sys
import uuid
import glob
import time
import json
import base64
import pickle
import shutil
import datetime


import _utils

ONLY_ASYNC = os.getenv("ONLY_ASYNC", False)


def wait_and_read_pred(res_path, unique_id):
    """
    Waits for and reads pickle file at res_path.

    :param res_path: the result pickle file path to watch.
    :param unique_id: unique_id used in cleanup

    :return response: python dict with keys "success" and "prediction"/ "reason"
    :return status: HTTP status code
    """
    # Keeping track of start_time for TIMEOUT implementation
    _utils.logger.info(f"unique_id: {unique_id} waiting for {res_path}")

    start_time = time.time()
    # Default response and status
    response, status = (
        json.dumps({"success": False, "reason": "timeout"}),
        falcon.HTTP_503,
    )
    while True:
        try:
            # if pickle doesn't exist,  while loop continues/
            pred = pickle.load(open(res_path, "rb"))
            try:
                response = json.dumps({"prediction": pred, "success": True})
            # if return dict has any non json serializable values, we str() it
            except:
                _utils.logger.info(
                    f"unique_id: {unique_id} could not json serialize the result."
                )
                response = json.dumps({"prediction": str(pred), "success": True})
            status = falcon.HTTP_200
            break
        except:
            # stop in case of timeout
            if time.time() - start_time >= _utils.TIMEOUT:
                _utils.logger.warn(
                    f"unique_id: {unique_id} timedout, with timeout {_utils.TIMEOUT}"
                )
                break

            time.sleep(_utils.SYNC_RESULT_POLING_SLEEP)

    # Since this is the last step in /sync, we delete all files related to this unique_id
    _utils.cleanup(unique_id)
    _utils.logger.info(f"unique_id: {unique_id} cleaned up.")

    return response, status


def get_write_res_paths(unique_id, in_size=0):
    """
    :param unique_id: unique id
    :param in_size: size of the input data in bytes

    :return write_path: input file/dir path
    :return res_path: result file path
    """
    write_path = os.path.join(_utils.get_write_dir(in_size), unique_id + ".inp")
    res_path = os.path.join(_utils.RAM_DIR, unique_id + ".res")

    return write_path, res_path


def handle_json_request(unique_id, in_json):
    """
    Main function for handling JSON type data.

    :param unique_id: unique id
    :param in_json: in list

    :return res_path: result file path
    """
    # protocol 2 is faster than 3
    in_json = pickle.dumps(in_json, protocol=2)

    write_path, res_path = get_write_res_paths(unique_id, sys.getsizeof(in_json))

    open(write_path, "wb").write(in_json)

    _utils.logger.info(f"unique_id: {unique_id} added to queue as {write_path}")

    # If an input is more in size (than MAX_RAM_FILE_SIZE) or if CACHE is full, it is written to disk.
    # in these cases, for faster glob and other file ops, we symlink them in RAM.
    # This helps _loop.py to be optimal
    _utils.create_symlink_in_ram(write_path)

    return res_path


def handle_file_dict_request(unique_id, in_dict):
    """
    Main function for handling FILE type data.

    :param unique_id: unique id
    :param in_json: in dict of file names and base64 encoded files

    :return res_path: result file path
    """
    # file_size = 0.75 * len(base64 string of the file)
    _write_dir, res_path = get_write_res_paths(
        unique_id, 0.75 * sum([len(v) for v in in_dict.values()])
    )

    # since we write files sequentially, we don't want loop to pickup truncated inputs.
    # _write_dir is a temporary location which will be moved to write_dir when all files are written.
    # Since _write_dir and write_dir exist in same disk, mv is instantaneous
    write_dir = _write_dir + ".dir"

    os.mkdir(_write_dir)

    for i, (file_name, b64_string) in enumerate(in_dict.items()):
        file_name = os.path.basename(file_name)
        file_path = os.path.join(
            _write_dir, f"{str(i).zfill(len(in_dict) + 1)}.{file_name}"
        )
        open(file_path, "wb").write(base64.b64decode(b64_string.encode("utf-8")))

    shutil.move(_write_dir, write_dir)

    _utils.logger.info(f"unique_id: {unique_id} added to queue as {_write_dir}")

    _utils.create_symlink_in_ram(write_dir)

    return res_path


class Sync(object):
    # Class for dealing with sync requests
    def on_post(self, req, resp):
        try:
            if ONLY_ASYNC:
                resp.body, resp.status = (
                    json.dumps(
                        {
                            "success": False,
                            "reason": "ONLY_ASYNC is set to True on this server.",
                        }
                    ),
                    falcon.HTTP_200,
                )

            else:
                priority = 8

                try:
                    priority = int(req.media["priority"])
                except:
                    pass

                unique_id = _utils.get_uuid(priority=8)

                _utils.logger.info(f"unique_id: {unique_id} Sync request recieved.")

                res_path = None

                if _utils.MAX_PER_CLIENT_BATCH and (
                    len(req.media["data"]) > _utils.MAX_PER_CLIENT_BATCH
                ):
                    _utils.logger.info(
                        f'unique_id: {unique_id} has batch of size {len(req.media["data"])}. MAX_PER_CLIENT_BATCH: {_utils.MAX_PER_CLIENT_BATCH}'
                    )

                    resp.body, resp.status = (
                        json.dumps(
                            {
                                "success": False,
                                "reason": f"Maximum number of examples allowed in client batch is {_utils.MAX_PER_CLIENT_BATCH}",
                            }
                        ),
                        falcon.HTTP_200,
                    )

                elif len(req.media["data"]) == 0:
                    _utils.logger.info(f"unique_id: {unique_id} has empty batch.")

                    resp.body, resp.status = (
                        json.dumps({"prediction": [], "success": True}),
                        falcon.HTTP_200,
                    )

                else:
                    if isinstance(req.media["data"], list):
                        if _utils.FILE_MODE:
                            _utils.logger.info(
                                f"unique_id: {unique_id} is a JSON input. Expectig FILE input."
                            )

                            resp.body = json.dumps(
                                {"success": False, "reason": "Expecting FILE input"}
                            )
                            resp.status = falcon.HTTP_400

                        else:
                            res_path = handle_json_request(unique_id, req.media["data"])

                    elif isinstance(req.media["data"], dict):
                        if not _utils.FILE_MODE:
                            _utils.logger.info(
                                f"unique_id: {unique_id} is a FILE input. Expectig JSON input."
                            )

                            resp.body = json.dumps(
                                {"success": False, "reason": "Expecting JSON input"}
                            )
                            resp.status = falcon.HTTP_400

                        else:
                            res_path = handle_file_dict_request(
                                unique_id, req.media["data"]
                            )

                    else:
                        resp.body, resp.status = (
                            json.dumps({"success": False, "reason": "invalid request"}),
                            falcon.HTTP_400,
                        )

                    if res_path:
                        req.media.clear()
                        resp.body, resp.status = wait_and_read_pred(res_path, unique_id)

        except Exception as ex:
            try:
                _utils.cleanup(unique_id)
            except:
                pass
            _utils.logger.exception(ex, exc_info=True)
            resp.body = json.dumps({"success": False, "reason": str(ex)})
            resp.status = falcon.HTTP_400


class Async(object):
    def on_post(self, req, resp):
        try:
            unique_id = _utils.get_uuid()
            _utils.logger.info(f"unique_id: {unique_id} Async request recieved.")

            webhook = req.media.get("webhook")

            _utils.write_webhook(unique_id, webhook)

            if _utils.MAX_PER_CLIENT_BATCH and (
                len(req.media["data"]) > _utils.MAX_PER_CLIENT_BATCH
            ):
                _utils.logger.info(
                    f'unique_id: {unique_id} has batch of size {len(req.media["data"])}. MAX_PER_CLIENT_BATCH: {_utils.MAX_PER_CLIENT_BATCH}'
                )
                resp.body, resp.status = (
                    json.dumps(
                        {
                            "success": False,
                            "reason": f"Maximum number of examples allowed in client batch is {_utils.MAX_PER_CLIENT_BATCH}",
                        }
                    ),
                    falcon.HTTP_200,
                )

            elif len(req.media["data"]) == 0:
                _utils.logger.info(f"unique_id: {unique_id} has empty batch.")

                resp.body, resp.status = (
                    json.dumps({"prediction": [], "success": True}),
                    falcon.HTTP_200,
                )

            else:
                if isinstance(req.media["data"], list):
                    if _utils.FILE_MODE:
                        _utils.logger.info(
                            f"unique_id: {unique_id} is a JSON input. Expectig FILE input."
                        )
                        resp.body = json.dumps(
                            {"success": False, "reason": "Expecting FILE input"}
                        )
                        resp.status = falcon.HTTP_400

                    else:
                        handle_json_request(unique_id, req.media["data"])
                        req.media.clear()
                        resp.body = json.dumps(
                            {"success": True, "unique_id": unique_id}
                        )
                        resp.status = falcon.HTTP_200

                elif isinstance(req.media["data"], dict):
                    if not _utils.FILE_MODE:
                        _utils.logger.info(
                            f"unique_id: {unique_id} is a FILE input. Expectig JSON input."
                        )
                        resp.body = json.dumps(
                            {"success": False, "reason": "Expecting JSON input"}
                        )
                        resp.status = falcon.HTTP_400
                    else:
                        handle_file_dict_request(unique_id, req.media["data"])
                        req.media.clear()
                        resp.body = json.dumps(
                            {"success": True, "unique_id": unique_id}
                        )
                        resp.status = falcon.HTTP_200

                else:
                    resp.body, resp.status = (
                        json.dumps({"success": False, "reason": "invalid request"}),
                        falcon.HTTP_400,
                    )

        except Exception as ex:
            try:
                _utils.cleanup(unique_id)
            except:
                pass
            _utils.logger.exception(ex, exc_info=True)
            resp.body = json.dumps({"success": False, "reason": str(ex)})
            resp.status = falcon.HTTP_400


class Res(object):
    def on_post(self, req, resp):
        try:
            unique_id = req.media["unique_id"]
            _utils.logger.info(f"unique_id: {unique_id} Result request recieved.")

            res_path = os.path.join(_utils.RAM_DIR, unique_id + ".res")
            res_path_disk = os.path.join(_utils.DISK_DIR, unique_id + ".res")

            try:
                try:
                    pred = pickle.load(open(res_path, "rb"))
                except:
                    pred = pickle.load(open(res_path_disk, "rb"))

                try:
                    response = json.dumps({"prediction": pred, "success": True})
                except:
                    response = json.dumps({"prediction": str(pred), "success": True})
                _utils.cleanup(unique_id)

                _utils.logger.info(f"unique_id: {unique_id} cleaned up.")

                resp.body = response
                resp.status = falcon.HTTP_200
            except:
                if not glob.glob(os.path.join(_utils.RAM_DIR, unique_id + ".inp*")):
                    _utils.logger.info(f"unique_id: {unique_id} does not exist.")

                    resp.body = json.dumps(
                        {
                            "success": None,
                            "reason": f"{unique_id} does not exist. You might have already accessed its result.",
                        }
                    )
                    resp.status = falcon.HTTP_200

                else:
                    _utils.logger.info(f"unique_id: {unique_id} processing.")
                    resp.body = json.dumps({"success": None, "reason": "processing"})
                    resp.status = falcon.HTTP_200

        except Exception as ex:
            try:
                _utils.cleanup(unique_id)
            except:
                pass
            _utils.logger.exception(ex, exc_info=True)
            resp.body = json.dumps({"success": False, "reason": str(ex)})
            resp.status = falcon.HTTP_400


app = falcon.App(cors_enable=True)
app.req_options.auto_parse_form_urlencoded = True
app = falcon.App(
    middleware=falcon.CORSMiddleware(
        allow_origins=_utils.ALLOWED_ORIGINS, allow_credentials=_utils.ALLOWED_ORIGINS
    )
)

sync_api = Sync()
async_api = Async()
res_api = Res()
app.add_route("/sync", sync_api)
app.add_route("/async", async_api)
app.add_route("/result", res_api)

if __name__ == "__main__":
    from gevent import pywsgi

    port = 8080
    server = pywsgi.WSGIServer(("0.0.0.0", port), app)
    server.serve_forever()

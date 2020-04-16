from gevent import monkey

monkey.patch_all()

import os
import sys
import ast
import uuid
import glob
import time
import json
import base64
import pickle
import shutil
import datetime

import falcon

import _utils


def wait_and_read_pred(res_path, unique_id):
    """
        Waits for res_path and reads it.

        :param res_path: the result file path to watch.

        :return response: python dict with keys "success" and "prediction"/ "reason"
        :return status: HTTP status code
    """
    start_time = time.time()
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
            # if return dict has any non json serializable values, this might help.
            except:
                response = json.dumps(
                    {"prediction": ast.literal_eval(str(pred)), "success": True}
                )
            status = falcon.HTTP_200
            break
        except:
            # stop in case of timeout
            if time.time() - start_time >= _utils.TIMEOUT:
                break

    _utils.cleanup(unique_id)

    return response, status


def get_write_res_paths(unique_id, in_size=0):
    """
        :param unique_id: unique id
        :param in_size: size of the input data

        :return write_path: input file/dir path
        :return res_path: result file path
    """
    write_path = os.path.join(_utils.get_write_dir(in_size), unique_id + ".inp")
    res_path = write_path[:-3] + "res"

    return write_path, res_path


def handle_json_request(unique_id, in_json):
    """
        Main function for handling JSON type data.

        :param unique_id: unique id
        :param in_json: in list

        :return res_path: result file path
    """
    in_json = pickle.dumps(in_json, protocol=2)

    write_path, res_path = get_write_res_paths(unique_id, sys.getsizeof(in_json))

    open(write_path, "wb").write(in_json)

    _utils.create_symlink_in_ram(write_path)

    return res_path


def handle_file_dict_request(unique_id, in_dict):
    """
        Main function for handling FILE type data.

        :param unique_id: unique id
        :param in_json: in dict of file names and base64 encoded files

        :return res_path: result file path
    """
    _write_dir, res_path = get_write_res_paths(
        unique_id, 0.75 * sum([len(v) for v in in_dict.items()])
    )

    write_dir = _write_dir + ".dir"

    os.mkdir(_write_dir)

    for i, (file_name, b64_string) in enumerate(in_dict.items()):
        file_name = os.path.basename(file_name)
        file_path = os.path.join(
            _write_dir, f"{str(i).zfill(len(in_dict) + 1)}.{file_name}"
        )
        open(file_path, "wb").write(base64.b64decode(b64_string.encode("utf-8")))

    shutil.move(_write_dir, write_dir)

    _utils.create_symlink_in_ram(write_dir)

    return res_path


class Sync(object):
    def on_post(self, req, resp):
        try:
            unique_id = _utils.get_uuid()

            res_path = None
            if isinstance(req.media["data"], list):
                res_path = handle_json_request(unique_id, req.media["data"])

            elif isinstance(req.media["data"], dict):
                res_path = handle_file_dict_request(unique_id, req.media["data"])

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

            webhook = req.media.get("webhook")

            _utils.write_webhook(unique_id, webhook)

            if isinstance(req.media["data"], list):
                handle_json_request(unique_id, req.media["data"])
                req.media.clear()
                resp.body = json.dumps({"success": True, "unique_id": unique_id})
                resp.status = falcon.HTTP_200

            elif isinstance(req.media["data"], dict):
                handle_file_dict_request(unique_id, req.media["data"])
                req.media.clear()
                resp.body = json.dumps({"success": True, "unique_id": unique_id})
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
                    response = json.dumps(
                        {"prediction": ast.literal_eval(str(pred)), "success": True}
                    )
                _utils.cleanup(unique_id)
                resp.body = response
                resp.status = falcon.HTTP_200
            except:
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


app = falcon.API()
app.req_options.auto_parse_form_urlencoded = True

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

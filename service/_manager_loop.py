import os
import time
import glob
import json
import pickle
import requests

import _utils


def process_webhooks():
    """
        Searches for webhook files, and sends the result if completed.
    """
    # list of webhooks left to send.
    webhooks_left = glob.glob(os.path.join(_utils.RAM_DIR, "*webhook"))
    if not webhooks_left:
        return

    _utils.logger.info(f"{len(webhooks_left)} webhooks found")
    for webhook_f in webhooks_left:
        try:
            # check if res exists
            unique_id = os.path.basename(webhook_f).split(".")[0]
            res_path = glob.glob(os.path.join(_utils.RAM_DIR, f"{unique_id}*res"))
            if not res_path:
                continue
            res_path = res_path[0]

            pred = pickle.load(open(res_path, "rb"))
            try:
                json.dumps(pred)
            # if return dict has any non json serializable values, this might help.
            except:
                pred = str(pred)
            pred = {"prediction": pred, "success": True, "unique_id": unique_id}

            webhook_url = open(webhook_f).read().strip()
            # try 3 times with timeout=5 seconds.
            for _ in range(3):
                try:
                    requests.post(webhook_url, json=pred, timeout=5)
                    _utils.logger.info(f"webhook success: {unique_id}")
                    break
                except Exception as ex:
                    _utils.logger.warn(ex)
                    _utils.logger.warn(
                        f"webhook failed for {unique_id} with url {webhook_url} in try {_}"
                    )
                    pass

            # will be deleted after succes or after 3 fails
            _utils.cleanup(unique_id)
        except Exception as exc:
            _utils.logger.exception(exc, exc_info=True)


while True:
    # This is the loop where non cpu heavy, managerial stuff happens.
    #
    process_webhooks()

    time.sleep(15)

import os
import ast
import time
import glob
import json
import pickle
import requests

import _utils


def process_webhooks():
    webhooks_left = glob.glob(os.path.join(_utils.RAM_DIR, '*webhook'))
    if not webhooks_left:
        return
        
    _utils.logger.info(f'{len(webhooks_left)} webhooks found')
    for webhook_f in webhooks_left:
        try:
            unique_id = os.path.basename(webhook_f).split('.')[0]
            res_path = glob.glob(os.path.join(_utils.RAM_DIR, f'{unique_id}*res'))
            if not res_path: continue
            res_path = res_path[0]

            pred = pickle.load(open(res_path, 'rb'))
            try: json.dumps(pred)
            # if return dict has any non json serializable values, this might help.
            except: pred = ast.literal_eval(str(pred))
            pred = {'prediction': pred, 'success': True, 'unique_id': unique_id}
            
            webhook_url = open(webhook_f).read().strip()
            for _ in range(3):
                try:
                    requests.post(webhook_url, json=pred, timeout=5)
                    _utils.logger.info(f'webhook success: {unique_id}')
                    break
                except Exception as ex:
                    _utils.logger.warn(ex)
                    _utils.logger.warn(f'webhook failed for {unique_id} with url {webhook_url} in try {_}')
                    pass
            
            _utils.cleanup(unique_id)
        except Exception as exc:
            _utils.logger.exception(exc, exc_info=True)

while True:
    process_webhooks()
    
    time.sleep(15)
import os
import time
import glob
import pickle
import requests

import _utils

while True:
    webhooks_left = glob.glob(os.path.join(_utils.RAM_DIR, '*webhook'))
    for webhook_f in webhooks_left:
        unique_id = os.path.basename(webhook_f).split('.')[0]
        res_path = glob.glob(os.path.join(_utils.RAM_DIR, f'{unique_id}*res'))
        if not res_path: continue
        res_path = res_path[0]
        res = pickle.load(open(res_path, 'rb'))
        webhook_url = open(webhook_f).read().strip()
        for _ in range(3):
            try:
                requests.post(webhook_url, json=res, timeout=5)
            except:
                pass
        
        _utils.cleanup(unique_id)
    
    time.sleep(15)
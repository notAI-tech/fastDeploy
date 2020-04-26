import os
import sys
import json
import time
import random
random.seed(42)
import requests

base_url = 'http://localhost:8080'

try:
    base_url = sys.argv[1]
except:
    print('Assuming server is located at', base_url)

sync_url = os.path.join(base_url, 'sync')
async_url = os.path.join(base_url, 'async')
result_url = os.path.join(base_url, 'result')

def verify(in_json, pred):
    if json.dumps(in_json) != json.dumps(pred):
        print('\n\nSOMETHING IS HORRIBLY WRONG\n\n')
        print('in_json:', in_json, 'pred:', pred)
        return False
    return True


def test_sync(in_jsons=[]):
    try:
        preds = requests.post(sync_url, json=in_jsons).json()
        for pred, in_json in zip(preds, in_jsons):
            if not verify(in_json, pred):
                break
    except Exception as ex:
        print(ex)
                


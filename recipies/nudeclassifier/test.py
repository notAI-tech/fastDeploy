import base64
import argparse
from requests import post
from pickle import load

parser = argparse.ArgumentParser(description="nudeclassifier test")
parser.add_argument(
    "--image", type=str, help="Path to image",
)
# parser.add_argument('--webhook', type=str, help='Webhook url')

if not args.image:
    print("--image should be supplied")
    exit()

args = parser.parse_args()


b64_image = base64.b64encode(open(args.image, "rb").read()).decode("utf-8")

for n in range(1, 4):
    print(
        f"n:{n}",
        post(
            "http://localhost:8080/sync",
            json={"data": {str(i): b64_image for i in range(n)}},
        ).json(),
    )

"""
for n in range(1, 4):
    uid = post('http://localhost:8080/async', json={'data': {str(i): b64_image for i in range(n)}, 'webhook': 'https://webhook.site/d1702b5c-bf4f-4e78-91d3-0118467fe0c7'}).json()['unique_id']
    print(uid)
"""

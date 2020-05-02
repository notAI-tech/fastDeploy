import os
import base64
import argparse
from requests import post
from pickle import load
from glob import glob   

parser = argparse.ArgumentParser(description="nudeclassifier test")
parser.add_argument("--image", type=str, help="Path to image")

parser.add_argument(
    "--dir",
    type=str,
    help="Path to directory of images. png, jpg, jpeg, PNG, JPG, JPEG",
)
parser.add_argument("--async", action="store_true", help="Make an async request")
parser.add_argument("--webhook", type=str, help="webhook url (only works with async)")
parser.add_argument(
    "--host_url", type=str, help="Host url. defaults to http://localhost:8080"
)
parser.add_argument("--result", type=str, help="Get the result for a given unique_id")

args = parser.parse_args()

if not args.host_url:
    args.host_url = "http://localhost:8080"


if args.result:
    print(post(os.path.join(args.host_url, 'result'), json={'unique_id': args.result}).json())
    exit()
    
if not args.image and not args.dir:
    print("--image or --dir should be supplied")
    exit()

data = None
if args.image:
    b64_image = base64.b64encode(open(args.image, "rb").read()).decode("utf-8")
    data = {args.image: b64_image}
if args.dir:
    images = (
        glob(os.path.join(args.dir, "*png"))
        + glob(os.path.join(args.dir, "*jpg"))
        + glob(os.path.join(args.dir, "*jpeg"))
        + glob(os.path.join(args.dir, "*PNG"))
        + glob(os.path.join(args.dir, "*JPG"))
        + glob(os.path.join(args.dir, "*JPEG"))
    )
    data = {f: base64.b64encode(open(f, "rb").read()).decode("utf-8") for f in images}

if not args.async:
    print(post(os.path.join(args.host_url, "sync"), json={"data": data}).json())

else:
    print(
        post(
            os.path.join(args.host_url, "async"),
            json={"data": data, "webhook": args.webhook},
        ).json()
    )

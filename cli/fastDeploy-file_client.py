import os
import glob
import base64
import requests
import argparse

parser = argparse.ArgumentParser(description="CLI for testing fastDeploy FILE input.")
parser.add_argument("--file", type=str, help="Path to file. For prediction on dir.")

parser.add_argument(
    "--dir",
    type=str,
    help="Path to a directory. Extensions must be specified with --ext.",
)

parser.add_argument("--ext", type=str, help="extension name. to be used with --dir.")

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
    print(
        post(
            os.path.join(args.host_url, "result"), json={"unique_id": args.result}
        ).json()
    )
    exit()

if not args.file and not args.dir:
    print("--file or --dir should be supplied")
    exit()

data = None
if args.file:
    b64_file = base64.b64encode(open(args.file, "rb").read()).decode("utf-8")
    data = {args.file: b64_file}
if args.dir:
    if not args.ext:
        print("--ext must be supplied along with --dir")
        exit()
    files = glob.glob(os.path.join(args.dir, "*." + args.ext))
    if not files:
        print("No files found in", args.dir, "with extension", args.ext)
        exit()
    data = {f: base64.b64encode(open(f, "rb").read()).decode("utf-8") for f in files}

if not args.async:
    print(requests.post(os.path.join(args.host_url, "sync"), json={"data": data}).json())

else:
    print(
        requests.post(
            os.path.join(args.host_url, "async"),
            json={"data": data, "webhook": args.webhook},
        ).json()
    )

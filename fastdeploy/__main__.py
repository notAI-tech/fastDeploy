import os
import sys
import argparse

parser = argparse.ArgumentParser(description="CLI for fastDeploy")
parser.add_argument(
    "--recipe", type=str, help="Path to your recipe folder", required=True
)
parser.add_argument(
    "--mode", type=str, help='One of, ["loop", "rest", "websocket"]', required=True
)
args = parser.parse_args()
sys.path.append(args.recipe)

if args.mode == "loop":
    from ._loop import start_loop

    start_loop()

if args.mode == "rest":
    from ._app import app
    from gevent import pywsgi

    port = int(os.getenv("PORT", "8080"))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"fastDeploy active at http://{host}:{port}")

    server = pywsgi.WSGIServer((host, port), app, spawn=1000, log=None)
    server.serve_forever()

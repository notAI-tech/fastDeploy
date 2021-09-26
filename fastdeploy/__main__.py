import os
import sys
import time
import argparse

parser = argparse.ArgumentParser(description="CLI for fastDeploy")
parser.add_argument(
    "--recipe", type=str, help="Path to your recipe folder", required=True
)

parser.add_argument(
    "--mode",
    type=str,
    help='One of, ["loop", "rest", "websocket", "build_rest"]',
    required=True,
)

parser.add_argument(
    "--queue_dir", type=str, help='Defaults to "--recipe" folder', required=False
)

parser.add_argument(
    "--base",
    type=str,
    help='docker image to use as base. defaults to "auto"',
    required=False,
)

args = parser.parse_args()
sys.path.append(args.recipe)

QUEUE_DIR = args.recipe

QUEUE_NAME = os.getenv(f"QUEUE_NAME", f"{time.time()}")

if args.queue_dir:
    queue_dir = args.QUEUE_DIR

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

if args.mode == "build_rest":
    """
    FROM python:3.6.7-slim
    RUN apt-get update && apt-get install -y build-essential gcc
    RUN python3 -m pip install --upgrade pip
    RUN python3 -m pip install Cython requests gevent gunicorn
    RUN python3 -m pip install --no-binary :all: falcon
    WORKDIR /app
    ADD . /app
    CMD ["bash", "_run.sh"]
    """
    dockerfile_lines = []

    if not args.base:
        base = "python:3.6-slim"
    else:
        base = args.base

    dockerfile_lines.append(f"FROM {base}")
    dockerfile_lines.append(
        f"RUN python3 -m pip install --upgrade --no-cache-dir pip fastdeploy gunicorn"
    )
    if os.path.exists(os.path.join(args.recipe, "extras.sh")):
        dockerfile_lines.append(f"COPY extras.sh /extras.sh")
        dockerfile_lines.append(f"RUN bash /extras.sh")

    dockerfile_lines.append(f"COPY requirements.txt /requirements.txt")
    dockerfile_lines.append(
        f"RUN python3 -m pip install --no-cache-dir -r /requirements.txt"
    )

    # recipe_base_name = f'/{os.path.basename(args.recipe).strip("./")}'
    # if not recipe_base_name:
    recipe_base_name = "/recipe"

    dockerfile_lines.append(f"ADD . {recipe_base_name}")

    dockerfile_lines.append(f"RUN cd {recipe_base_name} && python3 predictor.py")

    dockerfile_lines.append(
        f'CMD python3 -m fastdeploy --recipe /recipe --mode loop ; python3 -m fastdeploy --recipe /recipe --mode {args.mode.split("build_")[1]} \n'
    )

    dockerfile_path = os.path.join(args.recipe, "fastDeploy.dockerfile")

    _f = open(dockerfile_path, "w")
    _f.write("\n".join(dockerfile_lines))
    _f.flush()
    _f.close()

import os
import sys
import subprocess

RECIPE = os.getenv("RECIPE")
MODE = os.getenv("MODE")
QUEUE_DIR = os.getenv("QUEUE_DIR")

if RECIPE is None or MODE is None:
    import argparse

    parser = argparse.ArgumentParser(description="CLI for fastDeploy")
    parser.add_argument(
        "--recipe",
        type=str,
        help="Path to your recipe folder; env: RECIPE",
        required=True,
    )

    parser.add_argument(
        "--mode",
        type=str,
        help='One of, ["loop", "rest", "websocket", "build_rest"]; env: MODE',
        required=True,
    )

    parser.add_argument(
        "--queue_dir",
        type=str,
        help='Defaults to "--recipe" folder; end: QUEUE_DIR',
        required=False,
    )

    parser.add_argument(
        "--base",
        type=str,
        help='docker image to use as base. defaults to "auto"',
        required=False,
    )

    args = parser.parse_args()
    sys.path.append(RECIPE)

    QUEUE_DIR = args.recipe
    if args.queue_dir:
        QUEUE_DIR = args.queue_dir

    MODE = args.mode
    RECIPE = args.recipe

    if args.queue_dir:
        queue_dir = args.QUEUE_DIR

QUEUE_NAME = os.getenv(f"QUEUE_NAME", f"default")


def loop():
    from ._loop import start_loop

    start_loop()


def rest():
    from ._app import app
    from gevent import pywsgi

    port = int(os.getenv("PORT", "8080"))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"fastDeploy active at http://{host}:{port}")

    server = pywsgi.WSGIServer((host, port), app, spawn=1000, log=None)
    server.serve_forever()


def build_rest():
    dockerfile_lines = []

    if not BASE:
        base = "python:3.6-slim"
    else:
        base = BASE

    dockerfile_lines.append(f"FROM {base}")
    dockerfile_lines.append(
        f"RUN python3 -m pip install --upgrade --no-cache-dir pip fastdeploy gunicorn"
    )
    if os.path.exists(os.path.join(RECIPE, "extras.sh")):
        dockerfile_lines.append(f"COPY extras.sh /extras.sh")
        dockerfile_lines.append(f"RUN bash /extras.sh")

    dockerfile_lines.append(f"COPY requirements.txt /requirements.txt")
    dockerfile_lines.append(
        f"RUN python3 -m pip install --no-cache-dir -r /requirements.txt"
    )

    # if not recipe_base_name:
    recipe_base_name = "/recipe"

    dockerfile_lines.append(f"ADD . {recipe_base_name}")

    dockerfile_lines.append(f"RUN cd {recipe_base_name} && python3 predictor.py")

    dockerfile_lines.append(
        f'CMD python3 -m fastdeploy --recipe /recipe --mode loop ; python3 -m fastdeploy --recipe /recipe --mode {MODE.split("build_")[1]} \n'
    )

    dockerfile_path = os.path.join(RECIPE, "fastDeploy.auto_dockerfile")

    _f = open(dockerfile_path, "w")
    _f.write("\n".join(dockerfile_lines))
    _f.flush()
    _f.close()

    docker_image_name = f"fastdeploy_{os.path.basename(os.path.abspath(RECIPE))}".strip(
        "/"
    ).lower()

    subprocess.call(
        f"docker build -f {dockerfile_path} -t {docker_image_name} {RECIPE}",
        shell=True,
    )


if MODE == "loop":
    loop()

if MODE == "rest":
    rest()

if MODE == "build_rest":
    build_rest()

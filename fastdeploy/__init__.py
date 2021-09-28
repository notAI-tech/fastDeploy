import os
import sys
import subprocess

RECIPE = os.getenv("RECIPE")
MODE = os.getenv("MODE")
QUEUE_DIR = os.getenv("QUEUE_DIR")
QUEUE_NAME = os.getenv(f"QUEUE_NAME", f"default")
WORKERS = os.getenv("WORKERS", "3")
TIMEOUT = os.getenv("TIMEOUT", "1000")

WSGI_ONLY = True

if not RECIPE or not MODE:
    WSGI_ONLY = False
    import argparse

    parser = argparse.ArgumentParser(description="CLI for fastDeploy 1.0-rc10")
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

    QUEUE_DIR = args.recipe

    MODE = args.mode
    RECIPE = args.recipe
    BASE = args.base

sys.path.append(RECIPE)

wsgi_app = None

if not QUEUE_DIR:
    QUEUE_DIR = RECIPE

if WSGI_ONLY:
    from ._app import app as wsgi_app


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
        f"RUN python3 -m pip install --upgrade --no-cache-dir pip https://github.com/notAI-tech/fastDeploy/archive/refs/heads/master.zip gunicorn"
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

    gunicorn_command = f'RECIPE={recipe_base_name} MODE={MODE.split("build_")[1]} gunicorn --preload  -b 0.0.0.0:8080 fastdeploy:wsgi_app --workers={WORKERS} --worker-connections=1000 --worker-class=gevent --timeout={TIMEOUT}'

    dockerfile_lines.append(
        f'ENTRYPOINT {os.getenv("ENTRYPOINT", ["/bin/sh", "-c"])} \n'.replace("'", '"')
    )

    dockerfile_lines.append(
        f'CMD ["python3 -m fastdeploy --recipe /recipe --mode loop & {gunicorn_command}"] \n'
    )

    dockerfile_path = os.path.join(RECIPE, "fastDeploy.auto_dockerfile")
    _dockerignore_f = open(os.path.join(RECIPE, ".dockerignore"), "w")
    _dockerignore_f.write("*.request_queue\n*.results_index\n*.log_queue")
    _dockerignore_f.flush()
    _dockerignore_f.close()

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

    print(f"{docker_image_name} built!")
    exit()


if MODE == "loop":
    loop()

if not WSGI_ONLY:
    if MODE == "rest":
        rest()

if MODE == "build_rest":
    build_rest()

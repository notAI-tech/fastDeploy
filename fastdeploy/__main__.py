import resource

try:
    resource.setrlimit(resource.RLIMIT_NOFILE, (131072, 131072))
except:
    pass

import os
import sys
import subprocess

RECIPE = os.getenv("RECIPE")
MODE = os.getenv("MODE")
QUEUE_DIR = os.getenv("QUEUE_DIR")
QUEUE_NAME = os.getenv(f"QUEUE_NAME", f"default")
WORKERS = int(os.getenv("WORKERS", 3))
TIMEOUT = os.getenv("TIMEOUT", "1000")

if not RECIPE or not MODE:
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

    QUEUE_DIR = os.path.abspath(args.recipe)

    MODE = args.mode
    RECIPE = os.path.abspath(args.recipe)
    BASE = args.base

if os.path.exists(RECIPE):
    sys.path.append(RECIPE)
    os.chdir(RECIPE)

if not QUEUE_DIR:
    QUEUE_DIR = RECIPE


def loop():
    from ._loop import start_loop

    start_loop()


def rest():
    from ._app import app
    import gunicorn.app.base

    class StandaloneApplication(gunicorn.app.base.BaseApplication):
        def __init__(self, app, options=None):
            self.options = options or {}
            self.application = app
            super().__init__()

        def load_config(self):
            config = {
                key: value
                for key, value in self.options.items()
                if key in self.cfg.settings and value is not None
            }
            for key, value in config.items():
                self.cfg.set(key.lower(), value)

        def load(self):
            return self.application

    port = int(os.getenv("PORT", "8080"))
    host = os.getenv("HOST", "0.0.0.0")

    options = {
        "preload": "",
        "bind": "%s:%s" % (host, port),
        "workers": WORKERS,
        "worker_connections": 1000,
        "worker_class": "gevent",
        "timeout": TIMEOUT,
    }

    print(f"fastDeploy active at http://{host}:{port}")

    StandaloneApplication(app, options).run()


def websocket():
    from ._app import WebSocketInfer
    from collections import OrderedDict
    from geventwebsocket import WebSocketServer, Resource

    port = int(os.getenv("PORT", "8080"))
    host = os.getenv("HOST", "0.0.0.0")

    WebSocketServer(
        (host, port), Resource(OrderedDict([("/infer", WebSocketInfer)]))
    ).serve_forever()


def build(mode="build_rest"):
    dockerfile_lines = []

    if not BASE:
        base = "python:3.6-slim"
    else:
        base = BASE

    dockerfile_lines.append(f"FROM {base}")
    dockerfile_lines.append(
        f"RUN python3 -m pip install --upgrade --no-cache-dir pip fastdeploy"
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
        f'ENTRYPOINT {os.getenv("ENTRYPOINT", ["/bin/sh", "-c"])} \n'.replace("'", '"')
    )

    if mode == "build_rest":
        dockerfile_lines.append(
            f'CMD ["ulimit -n 1000000 && python3 -m fastdeploy --recipe /recipe --mode loop & python3 -m fastdeploy --recipe /recipe --mode rest"] \n'
        )
    elif mode == "build_websocket":
        dockerfile_lines.append(
            f'CMD ["ulimit -n 1000000 && python3 -m fastdeploy --recipe /recipe --mode loop & python3 -m fastdeploy --recipe /recipe --mode websocket"] \n'
        )

    dockerfile_path = os.path.join(RECIPE, "fastDeploy.auto_dockerfile")
    _dockerignore_f = open(os.path.join(RECIPE, ".dockerignore"), "w")
    _dockerignore_f.write("*.request_index\n*.results_index\n*.log_index")
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

elif MODE == "rest":
    rest()

elif MODE == "build_rest":
    build(mode="build_rest")

elif MODE == "build_websocket":
    build(mode="build_socket")

elif MODE == "websocket":
    websocket()

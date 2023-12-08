import resource

try:
    resource.setrlimit(resource.RLIMIT_NOFILE, (131072, 131072))
except:
    pass

import os
import sys
import glob
import argparse
import subprocess

parser = argparse.ArgumentParser(
    description="CLI for fastDeploy", formatter_class=argparse.RawTextHelpFormatter
)
parser.add_argument(
    "--recipe",
    type=str,
    help="Path to recipe folder that contains predictor.py",
    required=True,
)

parser.add_argument(
    "--loop",
    help=f"""Start prediction loop""",
    required=False,
    action="store_true",
)

parser.add_argument(
    "--rest",
    help="""Start REST server""",
    required=False,
    action="store_true",
)

parser.add_argument(
    "--build",
    help="""Build docker image""",
    required=False,
    action="store_true",
)

parser.add_argument(
    "--config",
    type=str,
    help="""
        example usage: --config "workers=3, timeout:480, allow_pickle=true"

        REST
            max_request_batch_size: integer max number of inputs in a batch, default=0 (None)
            workers: integer number of workers, default=3
            timeout: seconds after which request will fail, default=480
            host: host for the REST server, default=0.0.0.0
            port: port for the REST server, default=8080
            only_async: true/false, default=false
            allow_pickle: true/false, default=true
            keep_alive: gunicorn gevent keep alive, default=60


        LOOP
            predictor_name: predictor.py or predictor_N.py, name of the predictor run in the loop, default: predictor.py
            optimal_batch_size: integer max batch size for the predictor, default=0 (auto)
        
        DOCKER
            base: base image for docker, default=python:3.8-slim
    """,
    required=False,
    default="max_request_batch_size=0,workers=3,timeout=480,host=0.0.0.0,port=8080,only_async=false,allow_pickle=true,predictor_name=predictor.py,optimal_batch_size=0,keep_alive=60,base=python:3.8-slim",
)

args = parser.parse_args()

CONFIG = {
    # rest config
    "max_request_batch_size": int(os.getenv("MAX_REQUEST_BATCH_SIZE", "0")),
    "workers": int(os.getenv("WORKERS", "3")),
    "timeout": int(os.getenv("TIMEOUT", "480")),
    "host": os.getenv("HOST", "0.0.0.0"),
    "port": int(os.getenv("PORT", "8080")),
    "only_async": os.getenv("ONLY_ASYNC", "false").lower() == "true",
    "allow_pickle": os.getenv("ALLOW_PICKLE", "true").lower() == "true",
    # predictor config
    "predictor_name": os.getenv("PREDICTOR_NAME", "predictor.py"),
    "optimal_batch_size": int(os.getenv("OPTIMAL_BATCH_SIZE", "0")),
    "keep_alive": int(os.getenv("KEEP_ALIVE", "60")),
    # building docker config
    "base": os.getenv("BASE", "python:3.8-slim"),
}

if args.config:
    for config in args.config.split(","):
        try:
            k, v = config.strip().split("=")
        except:
            continue

        if os.getenv(k.upper()) is not None:
            continue

        try:
            CONFIG[k.strip()] = int(v.strip())
        except:
            CONFIG[k.strip()] = v.strip()

for k, v in CONFIG.items():
    os.environ[k.upper()] = str(v)

sys.path.append(os.path.abspath(args.recipe))
os.chdir(os.path.abspath(args.recipe))

try:
    if not os.path.exists(os.path.join(args.recipe, ".gitignore")):
        _gitignore_f = open(os.path.join(args.recipe, ".gitignore"), "a")
        _gitignore_f.write("\nfastdeploy_dbs\nfastdeploy_dbs/*\n")
        _gitignore_f.flush()
        _gitignore_f.close()
except:
    pass

try:
    if not os.path.exists(os.path.join(args.recipe, ".dockerignore")):
        _dockerignore_f = open(os.path.join(args.recipe, ".dockerignore"), "w")
        _dockerignore_f.write("\nfastdeploy_dbs\nfastdeploy_dbs/*\n")
        _dockerignore_f.flush()
        _dockerignore_f.close()
except:
    pass


def loop():
    from ._loop import start_loop

    start_loop()


def rest():
    from ._rest import app
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

    options = {
        "preload": "",
        "bind": "%s:%s" % (CONFIG["host"], CONFIG["port"]),
        "workers": CONFIG["workers"],
        "worker_connections": 1000,
        "worker_class": "gevent",
        "timeout": CONFIG["timeout"],
        "allow_redirects": True,
        "keepalive": CONFIG["keep_alive"],
        "keep_alive": CONFIG["keep_alive"],
    }

    print(
        f"fastDeploy REST interface active at http://{CONFIG['host']}:{CONFIG['port']}"
    )

    StandaloneApplication(app, options).run()


def build_docker_image():
    if not os.path.exists("requirements.txt"):
        raise Exception("requirements.txt not found")

    f = open("fastDeploy.auto_dockerfile", "w")
    f.write(
        f"""FROM {CONFIG['base']}
RUN python3 -m pip install --upgrade --no-cache-dir pip fastdeploy

ENV {' '.join([f"{k.upper()}={v}" for k, v in CONFIG.items()])}

ADD . /recipe
WORKDIR /recipe
{'' if not os.path.exists("extras.sh") else 'RUN chmod +x /recipe/extras.sh && /recipe/extras.sh'}
RUN python3 -m pip install --no-cache-dir -r /recipe/requirements.txt
RUN cd /recipe && python3 -c "from predictor import predictor; from example import example; predictor(example)"

ENTRYPOINT ["/bin/sh", "-c"]

CMD ["ulimit -n 1000000 && python3 -m fastdeploy --recipe /recipe --loop & python3 -m fastdeploy --recipe /recipe --rest"]
"""
    )
    f.flush()
    f.close()

    print(f"Dockerfile generated at {os.path.abspath('fastDeploy.auto_dockerfile')}")

    print(
        f"Run `docker build -f fastDeploy.auto_dockerfile -t <image_name:tag> {os.path.abspath('.')}` to build the image"
    )
    exit()


if args.loop:
    loop()

elif args.rest:
    rest()

elif args.build:
    build_docker_image()

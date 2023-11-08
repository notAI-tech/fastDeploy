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
    "--config",
    type=str,
    help="""
        example: workers:3, timeout:480

        REST
            max_allowed_batch_size: integer max batch size for the predictor, default=0
            workers: integer number of workers, default=3
            timeout: seconds after which request will fail, default=480
            host: host for the REST server, default=localhost
            port: port for the REST server, default=8080

        LOOP
            max_batch_size: integer max batch size for the predictor, default=0 (auto)
            predictor_name: predictor.py or predictor_N.py, name of the predictor run in the loop, default: predictor.py
    """,
    required=False,
    default="max_allowed_batch_size:0,workers:3,timeout:480,host:localhost,port:8080,predictor_name:predictor.py,max_batch_size:0",
)

args = parser.parse_args()

CONFIG = {
    "max_allowed_batch_size": 0,
    "workers": 3,
    "timeout": 480,
    "host": "localhost",
    "port": 8080,
    "predictor_name": "predictor.py",
    "max_batch_size": 0,
}

if args.config:
    for config in args.config.split(","):
        try:
            k, v = config.strip().split(":")
        except:
            continue
        try:
            CONFIG[k.strip()] = int(v.strip())
        except:
            CONFIG[k.strip()] = v.strip()

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

    start_loop(max_batch_size=0, predictor_name=CONFIG["predictor_name"])


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
    }

    print(
        f"fastDeploy REST interface active at http://{CONFIG['host']}:{CONFIG['port']}"
    )

    StandaloneApplication(app, options).run()


if args.loop:
    loop()

elif args.rest:
    rest()

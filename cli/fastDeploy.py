#!/usr/bin/env python
# -*- coding: utf-8 -*-
from __future__ import print_function

import os
import json
import time
import shlex
import random
import argparse

red, green, yellow, black = (
    "\x1b[38;5;1m",
    "\x1b[38;5;2m",
    "\x1b[38;5;3m",
    "\x1b[38;5;0m",
)

BASE_IMAGES = {
    "base-v0.1": "Python-3.6.7 | Only fastDeploy",
    "tf_1_14_cpu": "Python-3.6.8 | Tensorflow 1.14 | CPU",
    "tf_2_1_cpu": "Python-3.6.9 | Tensorflow 2.1 | CPU",
    "pyt_1_5_cpu": "Python-3.6.7 | Pytorch 1.5 | CPU",
}

RECIPES = {
    "deepsegment_en": "https://github.com/bedapudi6788/deepsegment",
    "deepsegment_fr": "https://github.com/bedapudi6788/deepsegment",
    "deepsegment_it": "https://github.com/bedapudi6788/deepsegment",
    "craft_text_detection": "https://github.com/notAI-tech/keras-craft",
    "nudeclassifier": "https://github.com/bedapudi6788/NudeNet",
    "efficientnet_b2": "https://github.com/qubvel/efficientnet",
    "kaldi_vosk-en_us-small": "https://github.com/alphacep/vosk-api/blob/master/doc/models.md",
    "kaldi_vosk-en_us-aspire": "https://github.com/alphacep/vosk-api/blob/master/doc/models.md",
}


def _run_cmd(cmd, log=False):
    if log:
        print(os.linesep, yellow, cmd, black)

    res = os.system(cmd)

    if res:
        return False
    else:
        return True


def _get_docker_command(log=False):
    docker = "docker"

    if not _run_cmd("which docker > /dev/null"):
        print(os.linesep, red, "Docker not found.", black)

    if _run_cmd("docker -v > /dev/null", log):
        print(os.linesep, green, "Docker installation found", black)
    else:
        print(
            os.linesep,
            yellow,
            "Install docker from https://docs.docker.com/install/",
            black,
        )
        return False

    if not _run_cmd("docker ps > /dev/null", log):
        if _run_cmd("sudo docker ps > /dev/null"):
            print(os.linesep, yellow, "Using sudo to run docker.", black)
            docker = "sudo docker"
        else:
            print(os.linesep, red, "Error in running docker", black)
            return False

    return docker


def _docker_build(docker, name, code_dir, port, base_image, log, extra_config):
    name = shlex.quote(name)
    code_dir = shlex.quote(code_dir)
    cmd = (
        docker
        + " run --name "
        + name
        + extra_config
        + " -v "
        + code_dir
        + ":/to_setup_data --tmpfs /ramdisk -p"
        + port
        + ":8080 -it "
        + base_image
    )
    _run_cmd(cmd, log)


def _docker_rm(docker, name):
    name = shlex.quote(name)
    _run_cmd(docker + " rm " + name, log=False)


def _build(args, docker="docker", log=False, extra_config=""):
    code_dir = os.path.abspath(args.source_dir)

    base_image = "notaitech/fastdeploy:" + args.base

    _docker_rm(docker, args.build)

    if not extra_config:
        extra_config = ""

    _docker_build(
        docker,
        args.build,
        code_dir,
        args.port,
        base_image,
        log,
        extra_config=extra_config,
    )


def _parse_extra_config(extra_config):
    if not extra_config:
        return ""
    try:
        extra_config = json.loads(extra_config)
        extra_config = "".join(
            [
                " -e " + key + "=" + shlex.quote(val) + " "
                for key, val in extra_config.items()
            ]
        )
        return extra_config
    except Exception as ex:
        print(os.linesep, ex)
        print(os.linesep, red, "Extra config must be a json.", black)
    return ""


def parse_args(args):
    if args.list_recipes:
        max_recipe_name_len = len(max(RECIPES.keys(), key=len))
        for recipe, desc in RECIPES.items():
            print(
                os.linesep,
                green,
                recipe
                + "".join([" " for _ in range(max_recipe_name_len - len(recipe))]),
                black,
                ":",
                yellow,
                desc,
                black,
            )
        print(os.linesep)
        exit()

    docker = _get_docker_command()

    if os.getenv("VERBOSE"):
        args.verbose = True

    if not docker:
        print(os.linesep, red, "Error in running docker.", black)
        exit()

    if len([v for v in (args.build, args.run) if v]) != 1:
        print(os.linesep, red, "One of --build --run must be specified.", black)
        exit()

    extra_config = _parse_extra_config(args.extra_config)

    if args.build:
        if not args.source_dir or not os.path.exists(args.source_dir):
            print(
                red, "--source_dir must be supplied and must exist for building", black
            )
            exit()

        if not args.base:
            print(os.linesep, yellow, "List of available base images.", black)
            for k, v in BASE_IMAGES.items():
                print(
                    os.linesep, red, "NAME:", black, k, red, "  Description:", black, v
                )

            print(
                os.linesep, yellow, "Enter the name of the base you want to use", black
            )
            while True:
                args.base = input()
                if args.base not in BASE_IMAGES:
                    print(
                        os.linesep,
                        red,
                        "input must be on of the above list. ctrl/cmd + c to quit.",
                        black,
                    )
                    continue
                break

        os.system(docker + " pull notaitech/fastdeploy:" + args.base)

        if not args.port:
            print(os.linesep, yellow, "--port defaults to 8080", black)
            args.port = "8080"

        _build(args, docker, log=args.verbose, extra_config=extra_config)

    if args.run:
        if args.run in RECIPES:
            args.run = "notaitech/fastdeploy-recipe:" + args.run

        if not args.port:
            print(os.linesep, yellow, "--port defaults to 8080", black)
            args.port = "8080"

        if not args.name:
            print(
                os.linesep,
                yellow,
                "You can also use --name along with run for giving your container a meaningful name.",
                black,
            )
            args.name = (
                "fastDeploy" + "." + str(random.randint(0, 9)) + "." + str(time.time())
            )
            print(
                os.linesep,
                yellow,
                "Attempting to start a container with the name",
                black,
                args.name,
                os.linesep,
            )

        os.system(docker + " pull " + args.run)

        cmd = (
            docker
            + " run -d --name "
            + args.name
            + " --tmpfs /ramdisk -p"
            + args.port
            + ":8080 "
            + extra_config
            + args.run
        )

        if _run_cmd(cmd, args.verbose):
            print(os.linesep, "======================================", os.linesep)
            print(
                os.linesep,
                green,
                "Succesfully started the container",
                black,
                args.name,
                green,
                "in background.",
                black,
            )
            print(os.linesep, "You can exit the logs by pressing Ctrl + C")
            print(
                os.linesep,
                "To view logs of this container in future, run:",
                yellow,
                docker,
                "logs -f",
                args.name,
                black,
            )
            print(os.linesep, "======================================", os.linesep)
            os.system(docker + " logs -f " + args.name)
        else:
            _docker_rm(docker, args.name)
            print(
                os.linesep,
                red,
                "Unsuccesfull attempt to start container with name",
                black,
                args.name,
            )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="CLI for fastDeploy. https://fastDeploy.notAI.tech/cli"
    )
    # parser.add_argument('--gpu', type=str, help='Id(s) of the gpu to run on.')
    parser.add_argument("-b", "--build", type=str, help="Name of the build eg: resnet_v1")
    parser.add_argument(
        "-s",
        "--source_dir",
        type=str,
        help="Path to your recipe directory. eg: ./resnet_dir",
    )
    parser.add_argument(
        "-r",
        "--run", type=str, help="local or cloud name of built recipe to run.",
    )
    parser.add_argument(
        "-n",
        "--name",
        type=str,
        help="To be used along with run. Sets a name for the container.",
    )
    parser.add_argument("-p", "--port", type=str, help="Port to run on. eg: 8080")
    parser.add_argument(
        "--base", type=str, help="Optionsl base image name for the build."
    )
    parser.add_argument(
        "-e",
        "--extra_config",
        type=str,
        help='a json with variable name and value as key value pairs. eg: --extra_config \'{"ENV_1": "VAL"}\'',
    )
    parser.add_argument(
        "-v",
        "--verbose", action="store_true", help="displays the docker commands used."
    )
    parser.add_argument(
        "-l",
        "--list_recipes",
        action="store_true",
        help="Lists available fastDeploy recipes.",
    )

    parser.add_argument(
        "--no_colors", action="store_true", help="Disable colored output from CLI.",
    )

    args = parser.parse_args()

    if args.no_colors:
        red, green, yellow, black = (
            "",
            "",
            "",
            "",
        )

    parse_args(args)

import os
import time
import shlex
import random
import argparse

VERSION = "v0.1"

BASE_IMAGES = {
    "base": "Python-3.6.7",
    "tf_1.14_cpu": "Python-3.6.8 | Tensorflow 1.14 | CPU",
    "pytorch_1.5_cpu": "Python-3.6.7 | Pytorch 1.5 | CPU",
}


def _run_cmd(cmd, log=False):
    if log:
        print(os.linesep, cmd)

    res = os.system(cmd)

    if res:
        return False
    else:
        return True


def _get_docker_command(log=False):
    docker = "docker"

    if not _run_cmd("which docker > /dev/null"):
        print(os.linesep, "Docker not found.")

    if _run_cmd("docker -v > /dev/null", log):
        print(os.linesep, "Docker installation found")
    else:
        print(os.linesep, "Install docker from https://docs.docker.com/install/")
        return False

    if not _run_cmd("docker ps > /dev/null", log):
        if _run_cmd("sudo docker ps > /dev/null"):
            print(os.linesep, "Using sudo to run docker.")
            docker = "sudo docker"
        else:
            print(os.linesep, "Error in running docker")
            return False

    return docker


def _docker_build(docker, name, code_dir, port, base_image, log):
    name = shlex.quote(name)
    code_dir = shlex.quote(code_dir)
    cmd = (
        docker
        + " run --name "
        + name
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


def _build(args, docker="docker", log=False):
    code_dir = os.path.abspath(args.source_dir)

    base_image = f"notaitech/fastdeploy:{args.base}-{VERSION}"

    _docker_rm(docker, args.build)

    _docker_build(docker, args.build, code_dir, args.port, base_image, log)


def parse_args(args):
    docker = _get_docker_command()
    
    if os.getenv('VERBOSE'):
        args.verbose = True

    if not docker:
        print(os.linesep, "Error in running docker.")
        exit()

    if len([v for v in (args.build, args.run) if v]) != 1:
        print(os.linesep, "One of --build --run must be specified.")
        exit()

    if args.build:
        if not args.source_dir or not os.path.exists(args.source_dir):
            print("--source_dir must be supplied and must exist for building")
            exit()

        if not args.base:
            print(os.linesep, "List of available base images.")
            for k, v in BASE_IMAGES.items():
                print(os.linesep, "NAME:", k, "  Description:", v)

            print(os.linesep, "Enter the name of the base you want to use")
            while True:
                args.base = input()
                if args.base not in BASE_IMAGES:
                    print(
                        os.linesep,
                        "input must be on of the above list. ctrl/cmd + c to quit.",
                    )
                    continue
                break

        if not args.port:
            print(os.linesep, "--port defaults to 8080")
            args.port = "8080"

        _build(args, docker, log=args.verbose)
    
    if args.run:
        if not args.port:
            print(os.linesep, "--port defaults to 8080")
            args.port = "8080"

        if not args.name:
            print(os.linesep, "You can also use --name along with run for giving your container a memorable name.")
            args.name = 'fastDeploy' + '.' + str(random.randint(0, 9)) + '.' + str(time.time())
            print(os.linesep, "Attempting to start a container with the name", args.name, os.linesep)

        cmd = (
                docker
                + " run --name "
                + args.name
                + " --tmpfs /ramdisk -p"
                + args.port
                + ":8080 "
                + args.run
            )
        
        if _run_cmd(cmd, args.verbose):
            print(os.linesep, 'Succesfully started the container', args.name)
        else:
            _docker_rm(docker, args.name)
            print(os.linesep, 'Unsuccesfull attempt to start container with name', args.name)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="CLI for fastDeploy. https://fastDeploy.notAI.tech/cli"
    )
    # parser.add_argument('--gpu', type=str, help='Id(s) of the gpu to run on.')
    parser.add_argument("--build", type=str, help="Name of the build eg: resnet_v1")
    parser.add_argument(
        "--source_dir",
        type=str,
        help="Path to your recipie directory. eg: ./resnet_dir",
    )
    parser.add_argument(
        "--run",
        type=str,
        help="local or cloud name of build to run. eg: resnet_v1 or notaitech/craft_text_detection-v0.1",
    )
    parser.add_argument(
        "--name",
        type=str,
        help="To be used along with run. Sets a name for the container.",
    )
    parser.add_argument("--port", type=str, help="Port to run on. eg: 8080")
    parser.add_argument(
        "--base", type=str, help="Optionsl base image name for the build."
    )
    parser.add_argument(
        "--extra_config",
        type=str,
        help='a json with variable name and value as key value pairs. eg: --extra_config \'{"ENV_1": "VAL"}\'',
    )
    parser.add_argument(
        "--verbose", action="store_true", help="displays the docker commands used."
    )

    args = parser.parse_args()

    parse_args(args)

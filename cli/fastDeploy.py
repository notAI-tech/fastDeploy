import os
import shlex
import argparse

def _run_cmd(cmd, log=False):
    if log:
        print('\n', cmd, '\n')
    
    res = os.system(cmd)

    if res:
        return False
    else:
        return True

def _get_docker_command(log=False):
    docker = 'docker'

    if _run_cmd('docker -v > /dev/null', log):
        print('docker installation found')
    else:
        print('Install docker from https://docs.docker.com/install/')
        return False

    if not _run_cmd('docker ps > /dev/null', log):
        if _run_cmd('sudo docker ps > /dev/null'):
            print('\nUsing sudo to run docker\n')
            docker = 'sudo docker'
        else:
            print('\nError in running docker\n')
            return False

    return docker


def _build(args, docker='docker', log=False):
    code_dir = os.path.abspath(args.build)

    if not os.path.exists(code_dir):
        print('{code_dir} does not exist')
        return False

    base_image = f'notaitech/fastdeploy-core:{args.base}'

    _run_cmd(f'{docker} rm {args.name}')
    
    _run_cmd(f'{docker} run --name {args.name} -v {shlex.quote(code_dir)}:/to_setup_data --tmpfs /ramdisk -p{args.port}:8080 -it {base_image}', log)

def _save(args, docker='docker'):
    res = _run_cmd(f'{docker} commit {args.name} {args.save}')
    if not res:
        print('\n Could not save the image. Please make sure the build is still running. \n')
        return False

    print('\n The build will be stopped now. \n')
    _run_cmd(f'{docker} kill {args.name}')

    _run_cmd(f'{docker} rm {args.name}')

    print('Attempting to push the image to docker hub.')
    _run_cmd(f'{docker} push {args.save}')

def _run(args, docker='docker'):
    _run_cmd(f'{docker} run --name {args.name} --tmpfs /ramdisk -p{args.port}:8080 -d {args.run}')



if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='CLI for fastDeploy. https://fastDeploy.notAI.tech/cli')

    parser.add_argument('--name', type=str, help='Name of the build', )
    parser.add_argument('--build', type=str, help='Path to your recipie.')
    parser.add_argument('--save', type=str, help='Pass the version of a build name.')
    parser.add_argument('--run', type=str, help='Pass the version of a build name.')
    parser.add_argument('--args', type=str, help='optional arguments for run')
    parser.add_argument('--port',type=str, help='Port to run on.')
    parser.add_argument('--gpu', type=str, help='Id(s) of the gpu to run on.')
    parser.add_argument('--base', type=str, help='Version of fastServe-core to use')
    parser.add_argument('--verbose', action='store_true', help='display docker commands used internally.')

    args = parser.parse_args()

    log = False
    if args.verbose:
        log = True

    try:
        args.port = int(args.port)
    except:
        print('\n port defaulting to 8080 \n')
        args.port = 8080

    if not args.base:
        args.base = 'latest-base'

    
    docker = _get_docker_command()
    
    if not docker:
        exit()

    if args.build and args.name:
        _build(args, docker, log)
    
    if args.save and args.name:
        _save(args, docker, log)
    
    if args.run and args.name:
        _run(args, docker, log)
    
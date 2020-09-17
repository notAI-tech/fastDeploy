import logging

logging.basicConfig(
    format="%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s",
    datefmt="%Y-%m-%d:%H:%M:%S",
    level=logging.DEBUG,
)

logger = logging.getLogger(__name__)


import os
import uuid
import glob
import json
import time
import shlex
import shutil
import pickle
from datetime import datetime

example = pickle.load(open("example.pkl", "rb"))

FILE_MODE = False

if isinstance(example, dict):
    FILE_MODE = True

    import base64

    write_dir = "./example_test"
    try:
        os.mkdir(write_dir)
    except:
        pass

    for i, (file_name, b64_string) in enumerate(example.items()):
        file_extension = file_name.split(".")[-1]
        file_path = os.path.join(
            write_dir, f"{str(i).zfill(len(example) + 1)}.{file_extension}"
        )
        open(file_path, "wb").write(base64.b64decode(b64_string.encode("utf-8")))

    example = glob.glob(write_dir + "/*")


SYNC_RESULT_POLING_SLEEP = float(os.getenv("SYNC_RESULT_POLING_SLEEP", "0.06"))
PREDICTION_LOOP_SLEEP = float(os.getenv("PREDICTION_LOOP_SLEEP", "0.06"))
MANAGER_LOOP_SLEEP = float(os.getenv("MANAGER_LOOP_SLEEP", "8"))


# No real use in making these configurable.
batch_size_file_path = ".batch_size"
# Delete batch_size_file is exists

RAM_DIR = "/ramdisk/"

if not os.path.exists(RAM_DIR):
    RAM_DIR = "./ramdisk/"
    if not os.path.exists(RAM_DIR):
        os.mkdir(RAM_DIR)

DISK_DIR = "./diskdisk/"

if not os.path.exists(DISK_DIR):
    os.mkdir(DISK_DIR)

DISK_DIR = os.path.abspath(DISK_DIR)

# TIMEOUT for Sync api in seconds.
TIMEOUT = float(os.getenv("TIMEOUT", "120"))

# DELETE_OLDER_THAN files older than this will be deleted (in seconds)
DELETE_OLDER_THAN = int(os.getenv("DELETE_OLDER_THAN", "21600"))

# if USE_PRIORITY: priority will be used if provided in request
# By default, this is enabled.
USE_PRIORITY = os.getenv("USE_PRIORITY", "True")

# Number of gunicorn workers to use
# Keep 0 for auto selection
WORKERS = int(os.getenv("WORKERS", "0"))

# Maximum amount of ram than can be used as temp storage.
# if CACHE < 1, CACHE = CACHE * free ram
# if CACHE >= 1, CACHE = CACHE in Mega Bytes
CACHE = float(os.getenv("CACHE", "0.05"))

# Maximum size of a file in MB allowed to be in ram disk.
MAX_RAM_FILE_SIZE = float(os.getenv("MAX_RAM_FILE_SIZE", "2")) * 1024 * 1024

# if BATCH_SIZE is not 0, will be used as default batch size.
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "0"))

# Maximum examples allowed in client batch.
# 0 means unlimited
MAX_PER_CLIENT_BATCH = int(os.getenv("MAX_PER_CLIENT_BATCH", "0"))

# The loop will wait for time_per_example * MAX_WAIT for batching.
MAX_WAIT = float(os.getenv("MAX_WAIT", 0.2))

# number of hash to prediction mapping to keep in cache
MAX_WAIT = float(os.getenv("MAX_WAIT", 0.2))


# reading the availbale storage (ram) on RAM_DIR
_, used, free = shutil.disk_usage(RAM_DIR)

MB = 1024 * 1024

# if CACHE >= 1, it's assumed to in Mega Bytes
if CACHE >= 1:
    CACHE = CACHE * MB

# if set CACHE value is lower than available memory, set cache to default value
if CACHE >= free:
    logger.error(
        f"\n AVAILABLE FREE MEMORY: {free/MB}; CACHE: {CACHE/MB} NOT POSSIBLE. USING DEFAULT."
    )
    CACHE = 0.05

# if CACHE < 1, it's taken as a fraction of available free memory
if CACHE < 1:
    if CACHE > 0.3:
        logger.warn(f"\n {CACHE} might be too high than required for CACHE.")

    CACHE = CACHE * free

    logger.info(f"AVAILABLE FREE MEMORY: {free/MB}; CACHE: {CACHE/MB} MB")

# keeping track of amount of original free mmeory available
o_used = used


def get_write_dir(file_size_in_bytes=0):
    """
        Check the size limits to determine if a file should be written to RAM_DIR or DISK_DIR

        :param file_size_in_bytes: file size in bytes. defaults to zero

        :return: RAM_DIR or DISK_DIR
    """
    if file_size_in_bytes > MAX_RAM_FILE_SIZE:
        return DISK_DIR

    _, used, _ = shutil.disk_usage(RAM_DIR)

    if used + file_size_in_bytes - o_used < CACHE:
        return RAM_DIR

    return DISK_DIR


def get_uuid(priority=9):
    """
        Generate a unique id.

        :return: unique id generated using uuid4 and current time.
    """
    if not USE_PRIORITY:
        priority = 9

    try:
        priority = int(priority)
    except:
        priority = 8

    priority = min(priority, 9)
    priority = max(priority, 0)

    return (
        str(priority)
        + "_"
        + datetime.utcnow().strftime("%Y-%m-%d-%H-%M-%S-%f")[:-3]
        + "_"
        + str(uuid.uuid4())
    )


def warmup(predictor, example_input, n=3):
    """
        Run warmup prediction on the model.

        :param n: number of warmup predictions to be run. defaults to 3
    """
    logger.info("Warming up .. ")
    for _ in range(n):
        predictor(example_input)


def find_optimum_batch_sizes(predictor, example_input):
    """
        Finds the optimum batch size for a predictor function with the given example input.

        :param predictor: predictor function. Should have two inputs, a list of examples and batch size.
        :param example_input: example input for the predictor.

        :return batch_size: optimal batch size to be used
        :return time_per_example: approx time taken per example.
    """
    time_per_example = None
    previous_time_per_example = pow(2, 64)

    possible_batch_sizes = range(16)
    if BATCH_SIZE:
        possible_batch_sizes = [BATCH_SIZE]

    if len(possible_batch_sizes) > 1:
        possible_batch_sizes = [
            pow(2, batch_size) for batch_size in possible_batch_sizes
        ]

    for batch_size in possible_batch_sizes:
        start = time.time()
        try:
            for _ in range(3):
                predictor(example_input * batch_size, batch_size=batch_size)
        except Exception as ex:
            logger.exception(ex, exc_info=True)
            logger.warn("Batch size set to 1 because of above exception")
            break

        time_per_example = (time.time() - start) / (3 * batch_size)

        logger.info(
            f"Time per sample for batch_size: {batch_size} is {time_per_example}"
        )

        # determine which batch size yields the least time per example.

        if time_per_example > previous_time_per_example * 0.95:
            break
        else:
            previous_time_per_example = time_per_example

    if not BATCH_SIZE:
        batch_size = int(max(1, batch_size / 2))
    else:
        batch_size = BATCH_SIZE

    logger.info(f"optimum batch size is {batch_size}")

    return batch_size, time_per_example


def get_to_process_list(FILE_MODE):
    """
        Returns reaming inputs as a list, sorted by their creation time.

        :param FILE_MODE: if operating in file mode or json mode.
    """
    if not FILE_MODE:
        return sorted(glob.glob(os.path.join(RAM_DIR, "*.inp")))
    else:
        return sorted(glob.glob(os.path.join(RAM_DIR, "*.dir")))


def get_batch(iterable, n):
    """
        Yields a batch of size n from iterable
    """
    l = len(iterable)
    for ndx in range(0, l, n):
        yield iterable[ndx : min(ndx + n, l)]


def create_symlink_in_ram(f):
    """
        Given a file path f, creates symlink in RAM_DIR with the same basename as f.
    """
    sym_link_path = os.path.join(RAM_DIR, os.path.basename(f))
    if not os.path.exists(sym_link_path):
        logger.info(f"actual path: {f}, linked as {sym_link_path}")
        os.system(f"ln -s {shlex.quote(f)} {shlex.quote(sym_link_path)}")


def cleanup(unique_id):
    """
        Delete all files or folders of the format unique_id* from RAM_DIR and DISK_DIR

        :param unique_id: unique_id
    """
    for _dir in (RAM_DIR, DISK_DIR):
        os.system(f"rm -rf {shlex.quote(os.path.join(_dir, unique_id))}*")


def in_path_to_res_path(in_path):
    """
        converts in_path to res_path

        :param in_path: in_path

        :return: res_path
    """
    return in_path[:-3] + "res"


def write_webhook(unique_id, webhook):
    """
        writes webhook string (url) to corresponding file.

        :param unique_id: unique_id
        :param webhook: webhook string
    """
    if webhook and isinstance(webhook, str):
        open(os.path.join(RAM_DIR, unique_id + ".webhook"), "w").write(webhook)
    else:
        if webhook is not None:
            logger.warn(f"id: {unique_id}, webhook: {webhook} is not valid.")

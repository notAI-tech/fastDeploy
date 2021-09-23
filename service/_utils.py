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
from diskcache import Deque, Index

example = pickle.load(open("example.pkl", "rb"))

FILE_MODE = False

# En variable to configure allowed origins
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")

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


REQUEST_QUEUE = Deque(".request_queue")
RESULTS_INDEX = Index(".results_index")


# No real use in making these configurable.
batch_size_file_path = ".batch_size"
# Delete batch_size_file is exists

# Number of gunicorn workers to use
# Keep 0 for auto selection
WORKERS = int(os.getenv("WORKERS", "0"))

# if BATCH_SIZE is not 0, will be used as default batch size.
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "0"))

# Maximum examples allowed in client batch.
# 0 means unlimited
MAX_PER_CLIENT_BATCH = int(os.getenv("MAX_PER_CLIENT_BATCH", "0"))

# The loop will wait for time_per_example * MAX_WAIT for batching.
MAX_WAIT = float(os.getenv("MAX_WAIT", 0.2))

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

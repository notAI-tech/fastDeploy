import logging

logging.basicConfig(
    format="%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s",
    datefmt="%Y-%m-%d:%H:%M:%S",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


import os
import uuid
import glob
import json
import time
import shlex
import shutil
from datetime import datetime
from diskcache import Deque, Index

import sys
from example import example

IS_FILE_INPUT = False
try:
    IS_FILE_INPUT = os.path.exists(example[0])
except:
    pass

from . import QUEUE_DIR, QUEUE_NAME

# En variable to configure allowed origins
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")

PREDICTION_LOOP_SLEEP = float(os.getenv("PREDICTION_LOOP_SLEEP", "0.06"))
MANAGER_LOOP_SLEEP = float(os.getenv("MANAGER_LOOP_SLEEP", "8"))

_request_index = os.path.join(QUEUE_DIR, f"{QUEUE_NAME}.request_index")
_results_index = os.path.join(QUEUE_DIR, f"{QUEUE_NAME}.results_index")
_log_index = os.path.join(QUEUE_DIR, f"{QUEUE_NAME}.log_index")
_htmls_dir = os.path.join(QUEUE_DIR, ".htmls")

REQUEST_INDEX = Index(_request_index)
RESULTS_INDEX = Index(_results_index)
LOG_INDEX = Index(_log_index)

LOG_INDEX["META.IS_FILE_INPUT"] = IS_FILE_INPUT

logger.info(
    f"REQUEST_INDEX: {_request_index} RESULTS_INDEX: {_results_index} LOG_INDEX: {_log_index} _htmls_dir: {_htmls_dir} IS_FILE_INPUT: {IS_FILE_INPUT}"
)

# clear if not
# No real use in making these configurable.

# Number of gunicorn workers to use
# Keep 0 for auto selection
WORKERS = int(os.getenv("WORKERS", "0"))

TIMEOUT = int(os.getenv("TIMEOUT", "120"))

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


def find_optimum_batch_sizes(
    predictor,
    example_input,
    max_batch_search_sec=int(os.getenv("MAX_BATCH_SEARCH_SEC", "240")),
):
    """
    Finds the optimum batch size for a predictor function with the given example input.

    :param predictor: predictor function. Should have two inputs, a list of examples and batch size.
    :param example_input: example input for the predictor.
    :param max_batch_search_sec: max time to spend on batch size search in seconds.

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

    search_start_time = time.time()
    batch_size_to_time_per_example = {}
    for b_i, batch_size in enumerate(possible_batch_sizes):
        start = time.time()
        if start - search_start_time >= max_batch_search_sec:
            batch_size = possible_batch_sizes[b_i - 1]
            logger.warn(
                f"Batch size set to {batch_size} because of MAX_BATCH_SEARCH_SEC: {max_batch_search_sec}"
            )
            break
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

        batch_size_to_time_per_example[batch_size] = time_per_example

        LOG_INDEX[
            f"META.batch_size_to_time_per_example"
        ] = batch_size_to_time_per_example

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

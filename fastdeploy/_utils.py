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
from diskcache import Index

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
BATCH_COLLECTION_SLEEP_IF_EMPTY_FOR = float(
    os.getenv("BATCH_COLLECTION_SLEEP_IF_EMPTY_FOR", "60")
)
BATCH_COLLECTION_SLEEP_FOR_IF_EMPTY = float(
    os.getenv("BATCH_COLLECTION_SLEEP_FOR_IF_EMPTY", "1")
)
MANAGER_LOOP_SLEEP = float(os.getenv("MANAGER_LOOP_SLEEP", "8"))

RUNNING_TIME_PER_EXAMPLE_AVERAGE_OVER = int(
    os.getenv("RUNNING_TIME_PER_EXAMPLE_AVERAGE_OVER", "100")
)

_meta_index = os.path.join(QUEUE_DIR, f"common.META_INDEX")
META_INDEX = Index(_meta_index)
META_INDEX["IS_FILE_INPUT"] = IS_FILE_INPUT
META_INDEX["PREDICTION_LOOP_SLEEP"] = PREDICTION_LOOP_SLEEP
META_INDEX["BATCH_COLLECTION_SLEEP_IF_EMPTY_FOR"] = BATCH_COLLECTION_SLEEP_IF_EMPTY_FOR
META_INDEX["BATCH_COLLECTION_SLEEP_FOR_IF_EMPTY"] = BATCH_COLLECTION_SLEEP_FOR_IF_EMPTY
META_INDEX["MANAGER_LOOP_SLEEP"] = MANAGER_LOOP_SLEEP
try:
    META_INDEX["TO_PROCESS_COUNT"]
except:
    META_INDEX["TO_PROCESS_COUNT"] = 0

"""
METRICS_INDEX[unique_id] = {
    "extras": [],
    "prediction_start": {0: time.time()},
    "prediction_end": {0: time.time()},
    "predicted_in_batch": {0: len(unique_ids)},
    "result": [],
    "received": time.time(),
    "in_data": [],
    "responded": time.time()
}
"""

METRICS_INDEX = Index(os.path.join(QUEUE_DIR, "metrics_index"))

REQUEST_INDEX = Index(os.path.join(QUEUE_DIR, f"main.request_index"))
RESULTS_INDEX = Index(os.path.join(QUEUE_DIR, f"main.results_index"))


def get_request_index_results_index(predictor_id, is_first=False, is_last=False):
    if is_first and is_last:
        logger.info(
            f"predictor_{predictor_id}: is_first: {is_first} is_last: {is_last}, request_index, results_index"
        )
        return REQUEST_INDEX, RESULTS_INDEX

    elif is_first:
        logger.info(
            f"predictor_{predictor_id}: is_first: {is_first} is_last: {is_last}, request_index, {predictor_id}.intermediate_index"
        )
        return REQUEST_INDEX, Index(
            os.path.join(QUEUE_DIR, f"{predictor_id}.intermediate_index")
        )

    elif is_last:
        logger.info(
            f"predictor_{predictor_id}: is_first: {is_first} is_last: {is_last}, {predictor_id - 1}.intermediate_index, results_index"
        )
        return (
            Index(os.path.join(QUEUE_DIR, f"{predictor_id - 1}.intermediate_index")),
            RESULTS_INDEX,
        )

    else:
        logger.info(
            f"predictor_{predictor_id}: is_first: {is_first} is_last: {is_last}, {predictor_id - 1}.intermediate_index, {predictor_id - 1}.intermediate_index"
        )
        return Index(
            os.path.join(QUEUE_DIR, f"{predictor_id - 1}.intermediate_index")
        ), Index(os.path.join(QUEUE_DIR, f"{predictor_id}.intermediate_index"))


FASTDEPLOY_UI_PATH = os.getenv(
    "FASTDEPLOYUI",
    os.path.join(os.path.split(os.path.abspath(__file__))[0], "fastdeploy-ui"),
)

# No real use in making these configurable.

# Number of gunicorn workers to use
# Keep 0 for auto selection
WORKERS = int(os.getenv("WORKERS", "0"))

TIMEOUT = int(os.getenv("TIMEOUT", "120"))

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
    predictor_sequence,
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

    if predictor_sequence == 0:
        BATCH_SIZE = int(os.getenv("BATCH_SIZE", os.getenv("BATCH_SIZE_1", 0)))
    else:
        BATCH_SIZE = int(os.getenv(f"BATCH_SIZE_{predictor_sequence + 1}", 0))

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
                inputs = example_input * batch_size
                inputs = inputs[:batch_size]

                preds = predictor(inputs, batch_size=batch_size)
                if not isinstance(preds, list) or len(preds) != batch_size:
                    logger.error(
                        "Something is seriously wrong! len(inputs) != len(outputs) from predictor.py. Check your recipe"
                    )
                    logger.error(f"Inputs: {inputs} length: {batch_size}")
                    logger.error(
                        f"Preds: {preds} length: {len(preds) if isinstance(preds, list) else 'N/A'}"
                    )
                    exit()
        except Exception as ex:
            logger.exception(ex, exc_info=True)
            logger.warn("Batch size set to 1 because of above exception")
            break

        time_per_example = (time.time() - start) / (3 * batch_size)

        logger.info(
            f"Time per sample for batch_size: {batch_size} is {time_per_example}"
        )

        batch_size_to_time_per_example[batch_size] = time_per_example

        _ = META_INDEX.get("batch_size_to_time_per_example", {})
        _[predictor_sequence] = batch_size_to_time_per_example
        META_INDEX["batch_size_to_time_per_example"] = _

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

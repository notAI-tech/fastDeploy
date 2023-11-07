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
from liteindex import DefinedIndex

import sys

try:
    from example import example
except:
    raise Exception("example.py not found. Please follow the instructions in README.md")

from . import QUEUE_DIR, QUEUE_NAME

ONLY_ASYNC = bool(os.getenv("ONLY_ASYNC", False))

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

PREDICTOR_SEQUENCE_TO_FILES = {}

predictor_files = [
    _
    for _ in glob.glob("predictor*.py")
    if _ == "predictor.py" or _.split("predictor_")[1].split(".")[0].isdigit()
]

for f in sorted(
    predictor_files,
    key=lambda x: int(
        x.split("predictor_")[1].split(".")[0] if x != "predictor.py" else 0
    ),
):
    if f == "predictor.py":
        PREDICTOR_SEQUENCE_TO_FILES[0] = f
    else:
        PREDICTOR_SEQUENCE_TO_FILES[len(PREDICTOR_SEQUENCE_TO_FILES)] = f

PREDICTOR_FILE_TO_SEQUENCE = {v: k for k, v in PREDICTOR_SEQUENCE_TO_FILES.items()}

LAST_PREDICTOR_SEQUENCE = max(PREDICTOR_SEQUENCE_TO_FILES.keys())

PREDICTOR_META_INDEX = DefinedIndex(
    "predictor_meta_index",
    schema={
        # sleep times, warmup and batch sizes
        "prediction_loop_sleep": "number",
        "batch_collection_sleep_if_empty_for": "number",
        "batch_collection_sleep_for_if_empty": "number",
        "manager_loop_sleep": "number",
        "batch_size_to_time_per_example": "json",
        "max_wait": "number",
        "optimum_batch_size": "number",
        "optimium_time_per_example": "number",
        "warmup_done": "boolean",
        # predictor meta info
        "is_first_predictor": "boolean",
        "is_last_predictor": "boolean",
        "predictor_name": "string",
        "predictor_sequence": "number",
    },
    db_path=os.path.join(QUEUE_DIR, f"meta_index.db"),
)

MAIN_INDEX = DefinedIndex(
    "main_index",
    schema={
        **{
            "is_async_request": "boolean",
            "last_predictor_sequence": "number",
            "last_predictor_success": "boolean",
            "-1.outputs": "other",
            "-1.predicted_at": "number",
            "-1.received_at": "number",
            "-1.predicted_in_batch_of": "number",
        },
        **{f"{_}.outputs": "other" for _ in PREDICTOR_SEQUENCE_TO_FILES},
        **{f"{_}.predicted_at": "number" for _ in PREDICTOR_SEQUENCE_TO_FILES},
        **{f"{_}.received_at": "number" for _ in PREDICTOR_SEQUENCE_TO_FILES},
        **{f"{_}.predicted_in_batch_of": "number" for _ in PREDICTOR_SEQUENCE_TO_FILES},
    },
    db_path=os.path.join(QUEUE_DIR, f"main_index.db"),
)

BLOB_INDEX = DefinedIndex(
    "blob_index",
    schema={"blob": "blob", "type": "string"},
    db_path=os.path.join(QUEUE_DIR, f"blob_index.db"),
)


# Number of gunicorn workers to use
# Keep 0 for auto selection
WORKERS = int(os.getenv("WORKERS", "0"))

TIMEOUT = int(os.getenv("TIMEOUT", "0"))

# Maximum examples allowed in client batch.
# 0 means unlimited
MAX_PER_CLIENT_BATCH = int(os.getenv("MAX_PER_CLIENT_BATCH", "0"))


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
    max_batch_search_sec=int(os.getenv("MAX_BATCH_SEARCH_SEC", "30")),
):
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

import logging

logging.basicConfig(
    format="%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s",
    datefmt="%Y-%m-%d:%H:%M:%S",
    level=logging.INFO,
)

logger = logging.getLogger(__name__)


import os
import glob
import json
import time
from datetime import datetime
from liteindex import DefinedIndex

try:
    from example import example
except:
    raise Exception("example.py not found. Please follow the instructions in README.md")

try:
    from example import name as recipe_name
except:
    recipe_name = os.path.basename(os.getcwd()).strip('/')


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
        break
    else:
        PREDICTOR_SEQUENCE_TO_FILES[len(PREDICTOR_SEQUENCE_TO_FILES)] = f

PREDICTOR_FILE_TO_SEQUENCE = {v: k for k, v in PREDICTOR_SEQUENCE_TO_FILES.items()}

LAST_PREDICTOR_SEQUENCE = max(PREDICTOR_SEQUENCE_TO_FILES.keys())
FIRST_PREDICTOR_SEQUENCE = min(PREDICTOR_SEQUENCE_TO_FILES.keys())

META_INDEX = DefinedIndex(
    "meta_index",
    schema={
        "optimal_batch_size": "number",
        "time_per_example": "number",
        "predictor_name": "string",
        "predictor_sequence": "number",
        "request_poll_time": "number",
        "example_output": "other",
        "status": "string",
    },
    db_path=os.path.join("fastdeploy_dbs", f"main_index.db"),
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
    db_path=os.path.join("fastdeploy_dbs", f"main_index.db"),
)


def warmup(predictor, example_input, n=3):
    """
    Run warmup prediction on the model.

    :param n: number of warmup predictions to be run. defaults to 3
    """
    logger.info("Warming up .. ")
    for _ in range(n):
        predictor(example_input)


def calculate_optimum_batch_sizes(
    predictor,
    predictor_sequence,
    example_input,
    max_batch_size,
    max_batch_search_sec=10,
):
    search_over_batch_sizes = (
        [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
        if max_batch_size == 0
        else [max_batch_size]
    )

    time_per_example = 0
    max_batch_size = 0

    for batch_size in search_over_batch_sizes:
        logger.info(f"Trying batch size: {batch_size}")
        start = time.time()
        predictor((example_input * batch_size)[:batch_size], batch_size=batch_size)
        end = time.time()

        _time_per_example = (end - start) / batch_size

        logger.info(f"batch_size: {batch_size}, time_per_example: {_time_per_example}")

        if time_per_example == 0:
            time_per_example = _time_per_example
            max_batch_size = batch_size
        elif _time_per_example < time_per_example:
            time_per_example = _time_per_example
            max_batch_size = batch_size
        else:
            break

    logger.info(
        f"{PREDICTOR_SEQUENCE_TO_FILES[predictor_sequence]}: Optimum batch size: {max_batch_size}, time_per_example: {time_per_example}"
    )

    return max_batch_size, time_per_example

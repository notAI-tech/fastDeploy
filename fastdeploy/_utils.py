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
from liteindex import DefinedIndex, KVIndex

try:
    from example import example
except:
    raise Exception("example.py not found. Please follow the instructions in README.md")

try:
    from example import name as recipe_name
except:
    recipe_name = os.path.basename(os.getcwd()).strip("/")


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
        "optimal_batch_size": DefinedIndex.Type.number,
        "time_per_example": DefinedIndex.Type.number,
        "predictor_name": DefinedIndex.Type.string,
        "predictor_sequence": DefinedIndex.Type.number,
        "request_poll_time": DefinedIndex.Type.number,
        "example_output": DefinedIndex.Type.other,
        "status": DefinedIndex.Type.string,
    },
    db_path=os.path.join("fastdeploy_dbs", f"main_index.db"),
)

KV_STORE = KVIndex(os.path.join("fastdeploy_dbs", f"kv_store.db"))
KV_STORE.clear()


MAIN_INDEX = DefinedIndex(
    "main_index",
    schema={
        **{
            "last_predictor_sequence": DefinedIndex.Type.number,
            "last_predictor_success": DefinedIndex.Type.boolean,
            "-1.outputs": DefinedIndex.Type.other,
            "-1.predicted_at": DefinedIndex.Type.number,
            "-1.received_at": DefinedIndex.Type.number,
            "-1.predicted_in_batch_of": DefinedIndex.Type.number,
            "timedout_in_queue": DefinedIndex.Type.boolean,
        },
        **{f"{_}.outputs": "other" for _ in PREDICTOR_SEQUENCE_TO_FILES},
        **{f"{_}.predicted_at": "number" for _ in PREDICTOR_SEQUENCE_TO_FILES},
        **{f"{_}.received_at": "number" for _ in PREDICTOR_SEQUENCE_TO_FILES},
        **{f"{_}.predicted_in_batch_of": "number" for _ in PREDICTOR_SEQUENCE_TO_FILES},
    },
    db_path=os.path.join("fastdeploy_dbs", f"main_index.db"),
    auto_vacuum=False,
)

# for setting timedout_in_queue
# used in _loop.py start_loop to set timedout_in_queue to True for all the predictions that have been in the queue for more than timeout_time seconds
MAIN_INDEX.optimize_for_query(
    ["-1.predicted_at", "-1.received_at", "timedout_in_queue"]
)

# for getting next batch to process
# used in _loop.py fetch_batch function
MAIN_INDEX.optimize_for_query(
    [
        "-1.predicted_at",
        "last_predictor_success",
        "last_predictor_sequence",
        "timedout_in_queue",
    ]
)

# in general queries
MAIN_INDEX.optimize_for_query(["-1.received_at"])
MAIN_INDEX.optimize_for_query(["last_predictor_success"])
MAIN_INDEX.optimize_for_query(["last_predictor_sequence"])
MAIN_INDEX.optimize_for_query(["timedout_in_queue"])


GLOBAL_METRICS_INDEX = KVIndex(
    os.path.join("fastdeploy_dbs", f"global_metrics_index.db")
)
GLOBAL_METRICS_INDEX["total_predictor_run_for_hours"] = 0
GLOBAL_METRICS_INDEX["total_predictor_up_for_hours"] = 0


def warmup(predictor, example_input, n=3):
    """
    Run warmup prediction on the model.

    :param n: number of warmup predictions to be run. defaults to 3
    """
    logger.info("Warming up .. ")
    for _ in range(n - 1):
        predictor(example_input)

    return predictor(example_input)


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


def check_if_requests_timedout_in_last_x_seconds_is_more_than_y(
    last_x_seconds, max_percentage_of_timedout_requests
):
    time_before_x_seconds = time.time() - last_x_seconds
    requests_received_in_last_x_seconds = MAIN_INDEX.count(
        query={"-1.received_at": {"$gte": time_before_x_seconds}}
    )

    requests_timedout_in_last_x_seconds = MAIN_INDEX.count(
        query={
            "-1.received_at": {"$gte": time_before_x_seconds},
            "timedout_in_queue": True,
        }
    )

    if requests_received_in_last_x_seconds == 0:
        return False

    logger.warning(
        f"Requests timedout in last {last_x_seconds} seconds: {requests_timedout_in_last_x_seconds}/{requests_received_in_last_x_seconds}"
    )

    if (
        requests_timedout_in_last_x_seconds / requests_received_in_last_x_seconds
    ) * 100 >= max_percentage_of_timedout_requests:
        return True
    return False


def check_if_percentage_of_requests_failed_in_last_x_seconds_is_more_than_y(
    last_x_seconds, max_percentage_of_failed_requests
):
    time_before_x_seconds = time.time() - last_x_seconds
    requests_received_in_last_x_seconds = MAIN_INDEX.count(
        query={"-1.received_at": {"$gte": time_before_x_seconds}}
    )

    if requests_received_in_last_x_seconds == 0:
        return False

    requests_received_in_last_x_seconds_that_failed = MAIN_INDEX.count(
        query={
            "-1.received_at": {"$gte": time_before_x_seconds},
            "last_predictor_success": False,
        }
    )

    if (
        requests_received_in_last_x_seconds_that_failed
        / requests_received_in_last_x_seconds
    ) * 100 >= max_percentage_of_failed_requests:
        return True

    return False


def check_if_requests_older_than_x_seconds_pending(x):
    time_before_x_seconds = time.time() - x

    requests_older_than_x_seconds_pending = MAIN_INDEX.count(
        query={
            "-1.received_at": {"$lte": time_before_x_seconds},
            "-1.predicted_at": 0,
            "last_predictor_success": {"$ne": False},
        }
    )

    if requests_older_than_x_seconds_pending > 0:
        return True
    return False

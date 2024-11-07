import os
import time
import importlib

from . import _utils


def load_predictor(predictor_name):
    predictor = importlib.import_module(os.path.splitext(predictor_name)[0]).predictor
    predictor_sequence = _utils.PREDICTOR_FILE_TO_SEQUENCE[predictor_name]
    _utils.logger.debug(
        f"{predictor_name}: predictor loaded with predictor_sequence {predictor_sequence}"
    )
    return predictor, predictor_sequence


def get_example(predictor_sequence):
    if predictor_sequence == 0:
        return _utils.example

    while True:
        _utils.logger.debug(f"Waiting for previous predictor to finish warmup")
        try:
            example = _utils.META_INDEX.get(
                f"{predictor_sequence - 1}", select_keys=["example_output"]
            )[f"{predictor_sequence - 1}"]["example_output"]
            if example is not None:
                return example
        except:
            time.sleep(1)


def initialize_predictor(
    predictor,
    predictor_name,
    predictor_sequence,
    example,
    optimal_batch_size,
):
    example_output = _utils.warmup(predictor, example)
    _utils.logger.info(f"{predictor_name}: warmup done")

    optimal_batch_size, time_per_example = _utils.calculate_optimum_batch_sizes(
        predictor, predictor_sequence, example, optimal_batch_size
    )

    return {
        "optimal_batch_size": optimal_batch_size,
        "time_per_example": time_per_example,
        "predictor_name": predictor_name,
        "predictor_sequence": predictor_sequence,
        "request_poll_time": 0.01,
        "example_output": example_output,
        "status": "running",
    }


def process_batch(predictor, input_batch, optimal_batch_size):
    last_predictor_success = False
    received_at = time.time()
    try:
        results = predictor(input_batch, batch_size=optimal_batch_size)
        last_predictor_success = True
    except Exception as ex:
        _utils.logger.exception(ex, exc_info=True)
        results = [None] * len(input_batch)

    predicted_at = time.time()

    if len(results) != len(input_batch):
        raise Exception(
            f"Predictor returned {len(results)} results for {len(input_batch)} inputs"
        )

    return results, last_predictor_success, received_at, predicted_at


def fetch_batch(
    main_index,
    predictor_sequence,
    optimal_batch_size,
    max_wait_time_for_batch_collection,
):
    unique_id_wise_input_count = {}
    input_batch = []
    current_batch_length = 0
    batch_collection_started_at = time.time()
    last_input_received_at = time.time()

    while current_batch_length < optimal_batch_size:
        to_process = main_index.search(
            query={
                "-1.predicted_at": 0,  # prediction not yet done
                "last_predictor_success": True,  # last predictor success
                "last_predictor_sequence": predictor_sequence
                - 1,  # last predictor sequence
                "timedout_in_queue": {"$ne": True},  # not timedout in queue
            },
            n=optimal_batch_size,
            select_keys=[f"{predictor_sequence - 1}.outputs"],
            update={
                "last_predictor_sequence": predictor_sequence,  # set last predictor sequence to current predictor sequence
                "last_predictor_success": None,  # reset last predictor success
                f"{predictor_sequence}.received_at": time.time(),  # set received at to current time
            },
        )

        for unique_id, data in to_process.items():
            outputs = data[f"{predictor_sequence - 1}.outputs"]
            input_count = len(outputs)
            unique_id_wise_input_count[unique_id] = input_count
            input_batch.extend(outputs)
            current_batch_length += input_count
            last_input_received_at = time.time()

        if current_batch_length == 0:
            if time.time() - last_input_received_at > 5:
                time.sleep(0.05)
            else:
                time.sleep(max_wait_time_for_batch_collection / 2)
            continue

        elif (
            time.time() - batch_collection_started_at
            < max_wait_time_for_batch_collection
            and current_batch_length / optimal_batch_size < 0.9
        ):
            time.sleep(max_wait_time_for_batch_collection / 2)
            continue

        else:
            # finished collecting batch
            break

    _utils.logger.info(
        f"Fetched batch {[v for v in unique_id_wise_input_count.values()]}"
    )
    return unique_id_wise_input_count, input_batch


def prepare_results(
    unique_id_wise_input_count,
    results,
    predictor_sequence,
    last_predictor_success,
    received_at,
    predicted_at,
    current_batch_length,
):
    """Prepare results for updating the main index."""
    unique_id_wise_results = {}
    total_input_count_till_now = 0

    for unique_id, input_count in unique_id_wise_input_count.items():
        unique_id_wise_results[unique_id] = {
            f"{predictor_sequence}.outputs": results[
                total_input_count_till_now : total_input_count_till_now + input_count
            ],
            f"{predictor_sequence}.predicted_at": predicted_at,
            "last_predictor_success": last_predictor_success,
            f"{predictor_sequence}.received_at": received_at,
            f"{predictor_sequence}.predicted_in_batch_of": current_batch_length,
        }
        total_input_count_till_now += input_count

    return unique_id_wise_results


def start_loop(
    predictor_name=os.getenv("PREDICTOR_NAME"),
    optimal_batch_size=int(os.getenv("OPTIMAL_BATCH_SIZE")),
):
    """Main loop for processing predictions."""
    timeout_time = float(os.getenv("TIMEOUT", 0))
    predictor, predictor_sequence = load_predictor(predictor_name)
    example = get_example(predictor_sequence)
    predictor_info = initialize_predictor(
        predictor, predictor_name, predictor_sequence, example, optimal_batch_size
    )
    _utils.META_INDEX.update({f"{predictor_sequence}": predictor_info})

    optimal_batch_size = predictor_info["optimal_batch_size"]
    time_per_example = predictor_info["time_per_example"]
    max_wait_time_for_batch_collection = max(0.003, time_per_example * 0.51)

    _utils.logger.info(
        f"""{predictor_name}
    optimal_batch_size: {optimal_batch_size}
    time_per_example: {time_per_example}
    predictor_sequence: {predictor_sequence}
    max_wait_time_for_batch_collection: {max_wait_time_for_batch_collection}
    """
    )

    prediction_loop_started_at = time.time()

    while True:
        """
        Set timedout_in_queue to True for all the predictions that have been in the queue for more than timeout_time seconds
        and delete older than 30 seconds predictions that have finished prediction
        """

        timedout_in_queue_unique_ids = _utils.MAIN_INDEX.search(
            query={
                "-1.predicted_at": 0,
                "-1.received_at": {"$lt": time.time() - timeout_time},
                "timedout_in_queue": {"$ne": True},
                "last_predictor_sequence": {"$ne": _utils.LAST_PREDICTOR_SEQUENCE},
            },
            update={"timedout_in_queue": True},
            select_keys=[],
        )

        if timedout_in_queue_unique_ids:
            _utils.logger.warning(
                f"{_utils.MAIN_INDEX.count()} in queue, set timedout_in_queue to True for {list(timedout_in_queue_unique_ids)} unique_ids"
            )

        _utils.MAIN_INDEX.delete(
            query={
                "$and": [
                    {"-1.predicted_at": {"$gt": 0}},
                    {"-1.predicted_at": {"$lt": time.time() - 40}},
                ]
            },
        )

        unique_id_wise_input_count, input_batch = fetch_batch(
            _utils.MAIN_INDEX,
            predictor_sequence,
            optimal_batch_size,
            max_wait_time_for_batch_collection,
        )

        _utils.logger.debug(f"Processing batch {unique_id_wise_input_count}")

        process_batch_started_at = time.time()
        results, last_predictor_success, received_at, predicted_at = process_batch(
            predictor, input_batch, optimal_batch_size
        )
        process_batch_ended_at = time.time()

        unique_id_wise_results = prepare_results(
            unique_id_wise_input_count,
            results,
            predictor_sequence,
            last_predictor_success,
            received_at,
            predicted_at,
            len(input_batch),
        )
        _utils.MAIN_INDEX.update(unique_id_wise_results)

        _utils.logger.debug(
            f"Updated results predictor {predictor_sequence}: {list(unique_id_wise_results)}"
        )

        _utils.GLOBAL_METRICS_INDEX.math(
            "total_predictor_run_for_hours",
            (process_batch_ended_at - process_batch_started_at) / 3600,
            "+=",
        )

        _utils.GLOBAL_METRICS_INDEX["total_predictor_up_for_hours"] = (
            time.time() - prediction_loop_started_at
        ) / 3600


if __name__ == "__main__":
    import sys

    start_loop(sys.argv[1])

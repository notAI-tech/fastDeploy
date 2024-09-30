import os
import time
import importlib
from typing import Any, Dict, List, Tuple

from . import _utils


def load_predictor(predictor_name: str) -> Tuple[Any, int]:
    """Load the predictor module and get the predictor sequence."""
    predictor = importlib.import_module(os.path.splitext(predictor_name)[0]).predictor
    predictor_sequence = _utils.PREDICTOR_FILE_TO_SEQUENCE[predictor_name]
    _utils.logger.debug(
        f"{predictor_name}: predictor loaded with predictor_sequence {predictor_sequence}"
    )
    return predictor, predictor_sequence


def get_example(predictor_sequence: int) -> Any:
    """Get the example for the current predictor."""
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
    predictor: Any,
    predictor_name: str,
    predictor_sequence: int,
    example: Any,
    optimal_batch_size: int,
) -> Dict[str, Any]:
    """Initialize the predictor and calculate optimal parameters."""
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


def update_meta_index(predictor_sequence: int, predictor_info: Dict[str, Any]):
    """Update the META_INDEX with predictor information."""
    _utils.META_INDEX.update({f"{predictor_sequence}": predictor_info})


def process_batch(
    predictor: Any, input_batch: List[Any], optimal_batch_size: int
) -> Tuple[List[Any], bool, float, float]:
    """Process a batch of inputs using the predictor."""
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


def update_main_index(unique_id_wise_results: Dict[str, Dict[str, Any]]):
    """Update the MAIN_INDEX with processed results."""
    _utils.MAIN_INDEX.update(unique_id_wise_results)


def perform_maintenance(main_index: Any):
    """Perform maintenance tasks on the main index."""
    # Delete older than 15 min, all successful and returned predictions from main index
    main_index.delete(
        query={
            f"-1.predicted_at": {
                "$ne": 0,
                "$lt": time.time() - 15 * 60,
            },
            "last_predictor_success": True,
        }
    )
    main_index.vaccum()


def handle_timeouts(main_index: Any, timeout_time: float):
    """Handle timeouts for items in the main index."""
    main_index.search(
        query={
            "-1.predicted_at": 0,
            "-1.received_at": {"$lt": time.time() - timeout_time},
        },
        update={"timedout_in_queue": True},
    )


def fetch_batch(
    main_index: Any, predictor_sequence: int, optimal_batch_size: int
) -> Tuple[Dict[str, int], List[Any]]:
    """Fetch a batch of inputs to process, ensuring total input length doesn't exceed optimal_batch_size."""
    unique_id_wise_input_count = {}
    input_batch = []
    current_batch_length = 0

    while current_batch_length < optimal_batch_size:
        results = main_index.search(
            query={
                "last_predictor_success": True,
                "last_predictor_sequence": predictor_sequence - 1,
                "timedout_in_queue": {"$ne": True},
            },
            n=1,  # Fetch one item at a time
            select_keys=[f"{predictor_sequence - 1}.outputs"],
            update={
                "last_predictor_sequence": predictor_sequence,
                "last_predictor_success": None,
                f"{predictor_sequence}.received_at": time.time(),
            },
        )

        if not results:  # No more items to process
            break

        for unique_id, data in results.items():
            outputs = data[f"{predictor_sequence - 1}.outputs"]
            input_count = len(outputs)

            if current_batch_length + input_count > optimal_batch_size:
                # If adding this item would exceed the optimal batch size, don't add it and stop the loop
                main_index.update(
                    {unique_id: {"last_predictor_sequence": predictor_sequence - 1}}
                )  # Revert the update
                return unique_id_wise_input_count, input_batch

            unique_id_wise_input_count[unique_id] = input_count
            input_batch.extend(outputs)
            current_batch_length += input_count

    return unique_id_wise_input_count, input_batch


def prepare_results(
    unique_id_wise_input_count: Dict[str, int],
    results: List[Any],
    predictor_sequence: int,
    last_predictor_success: bool,
    received_at: float,
    predicted_at: float,
    current_batch_length: int,
) -> Dict[str, Dict[str, Any]]:
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
    predictor_name: str = os.getenv("PREDICTOR_NAME"),
    optimal_batch_size: int = int(os.getenv("OPTIMAL_BATCH_SIZE")),
):
    """Main loop for processing predictions."""
    timeout_time = float(os.getenv("TIMEOUT", 0))
    predictor, predictor_sequence = load_predictor(predictor_name)
    example = get_example(predictor_sequence)
    predictor_info = initialize_predictor(
        predictor, predictor_name, predictor_sequence, example, optimal_batch_size
    )
    update_meta_index(predictor_sequence, predictor_info)

    optimal_batch_size = predictor_info["optimal_batch_size"]
    time_per_example = predictor_info["time_per_example"]
    max_wait_time_for_batch_collection = max(0.003, time_per_example * 0.25)

    _utils.logger.info(
        f"""{predictor_name}
    optimal_batch_size: {optimal_batch_size}
    time_per_example: {time_per_example}
    predictor_sequence: {predictor_sequence}
    max_wait_time_for_batch_collection: {max_wait_time_for_batch_collection}
    """
    )

    last_batch_collection_started_at = 0
    last_maintenance_run_at = time.time()

    while True:
        if time.time() - last_maintenance_run_at >= 60:
            perform_maintenance(_utils.MAIN_INDEX)
            last_maintenance_run_at = time.time()

        handle_timeouts(_utils.MAIN_INDEX, timeout_time)

        unique_id_wise_input_count, input_batch = fetch_batch(
            _utils.MAIN_INDEX, predictor_sequence, optimal_batch_size
        )
        current_batch_length = len(input_batch)

        if current_batch_length == 0:
            time.sleep(max_wait_time_for_batch_collection)
            continue

        _utils.logger.info(
            f"{predictor_name}: current_batch_length: {current_batch_length}"
        )

        if (
            time.time() - last_batch_collection_started_at
            < max_wait_time_for_batch_collection
            and current_batch_length / optimal_batch_size < 0.5
        ):
            time.sleep(max_wait_time_for_batch_collection / 2)
            continue

        results, last_predictor_success, received_at, predicted_at = process_batch(
            predictor, input_batch, optimal_batch_size
        )
        unique_id_wise_results = prepare_results(
            unique_id_wise_input_count,
            results,
            predictor_sequence,
            last_predictor_success,
            received_at,
            predicted_at,
            current_batch_length,
        )
        update_main_index(unique_id_wise_results)

        last_batch_collection_started_at = time.time()


if __name__ == "__main__":
    import sys

    start_loop(sys.argv[1])

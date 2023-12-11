import os
import glob
import json
import time
import shutil

from . import _utils
import importlib


def start_loop(
    predictor_name=os.getenv("PREDICTOR_NAME"),
    optimal_batch_size=int(os.getenv("OPTIMAL_BATCH_SIZE")),
):
    predictor = importlib.import_module(os.path.splitext(predictor_name)[0]).predictor
    predictor_sequence = _utils.PREDICTOR_FILE_TO_SEQUENCE[predictor_name]

    if predictor_sequence == 0:
        example = _utils.example
    else:
        while True:
            try:
                example = _utils.META_INDEX.get(
                    f"{predictor_sequence - 1}", select_keys=["example_output"]
                )[f"{predictor_sequence - 1}"]["example_output"]
                if example is not None:
                    break
            except:
                time.sleep(1)

    _utils.warmup(predictor, example)

    optimal_batch_size, time_per_example = _utils.calculate_optimum_batch_sizes(
        predictor, predictor_sequence, example, optimal_batch_size
    )

    _utils.META_INDEX.update(
        {
            f"{predictor_sequence}": {
                "optimal_batch_size": optimal_batch_size,
                "time_per_example": time_per_example,
                "predictor_name": predictor_name,
                "predictor_sequence": predictor_sequence,
                "request_poll_time": 0.01,
                "example_output": example,
                "status": "running",
            }
        }
    )

    last_batch_collection_started_at = 0

    # max_wait_time_for_batch_collection
    # is the time after which the loop will start processing the batch even if the batch is not full
    max_wait_time_for_batch_collection = max(0.003, time_per_example * 0.25)

    _utils.logger.info(
        f"Imported predictor: {predictor_name} predictor_sequence: {predictor_sequence}, optimal_batch_size: {optimal_batch_size}, time_per_example: {time_per_example}"
    )

    input_batch = []
    unique_id_wise_input_count = {}

    __last_deletion_run_at = time.time()

    while True:
        if time.time() - __last_deletion_run_at >= 60:
            # delete older than 15 min, all successful and returned predictions from main index
            _utils.MAIN_INDEX.delete(
                query={
                    "last_predictor_success": True,
                    "-1.predicted_at": {"$lt": time.time() - 900},
                }
            )
            __last_deletion_run_at = time.time()

        for unique_id, data in _utils.MAIN_INDEX.search(
            query={
                "last_predictor_sequence": predictor_sequence - 1,
                "last_predictor_success": True,
            },
            n=optimal_batch_size,
            select_keys=[
                f"{predictor_sequence - 1}.outputs",
            ],
            update={
                "last_predictor_sequence": predictor_sequence,
                "last_predictor_success": None,
                f"{predictor_sequence}.received_at": time.time(),
            },
        ).items():
            unique_id_wise_input_count[unique_id] = len(
                data[f"{predictor_sequence - 1}.outputs"]
            )
            input_batch += data[f"{predictor_sequence - 1}.outputs"]

        current_batch_length = len(input_batch)

        if current_batch_length == 0:
            time.sleep(max_wait_time_for_batch_collection)
            continue

        if (
            time.time() - last_batch_collection_started_at
            < max_wait_time_for_batch_collection
        ):
            if current_batch_length / optimal_batch_size < 0.5:
                time.sleep(max_wait_time_for_batch_collection / 2)
                continue

        last_predictor_success = False
        received_at = time.time()
        try:
            results = predictor(input_batch, batch_size=optimal_batch_size)
            last_predictor_success = True
        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            results = [None] * current_batch_length

        predicted_at = time.time()

        unique_id_wise_results = {}

        for unique_id, input_count in unique_id_wise_input_count.items():
            unique_id_wise_results[unique_id] = {
                f"{predictor_sequence}.outputs": results[:input_count],
                f"{predictor_sequence}.predicted_at": predicted_at,
                "last_predictor_success": last_predictor_success,
                f"{predictor_sequence}.received_at": received_at,
                f"{predictor_sequence}.predicted_in_batch_of": current_batch_length,
            }

            results = results[input_count:]

        _utils.MAIN_INDEX.update(unique_id_wise_results)

        input_batch = []
        unique_id_wise_input_count = {}


if __name__ == "__main__":
    import sys

    start_loop(sys.argv[1])

import os
import glob
import json
import time
import shutil

from . import _utils
import importlib


def start_loop(predictor_name):
    predictor = importlib.import_module(os.path.splitext(predictor_name)[0]).predictor
    predictor_sequence = _utils.PREDICTOR_FILE_TO_SEQUENCE[predictor_name]

    optimal_batch_size = 8

    last_batch_collection_started_at = 0
    max_wait_time_for_batch_collection = 0.1

    _utils.logger.info(
        f"Imported predictor: {predictor_name} predictor_sequence: {predictor_sequence}, optimal_batch_size: {optimal_batch_size}, max_wait_time_for_batch_collection: {max_wait_time_for_batch_collection}"
    )

    input_batch = []
    unique_id_wise_input_count = {}

    while True:
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

        if (
            time.time() - last_batch_collection_started_at
            < max_wait_time_for_batch_collection
        ):
            if current_batch_length / optimal_batch_size < 0.5:
                time.sleep(0.05)
                continue

        last_predictor_success = False
        received_at = time.time()
        try:
            results = predictor(input_batch)
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

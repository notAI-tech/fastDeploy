import os
import glob
import json
import time
import shutil

from . import _utils


def start_loop():
    from predictor import predictor

    """
    The Prediction loop. This is where the logic happens.

    This function starts a loop. Does not return anything.
    """

    # warmup
    _utils.warmup(predictor, _utils.example)

    # find optimal batch size and get_time_per _utils.example
    batch_size, time_per_example = _utils.find_optimum_batch_sizes(
        predictor, _utils.example
    )

    max_wait_time = time_per_example * _utils.MAX_WAIT
    _utils.logger.info(f"max_wait_time: {max_wait_time}")

    # write batch size to temp file for use in generating _run.sh
    _utils.RESULTS_INDEX["META.batch_size"] = batch_size

    # list of files/data to be processed is tracked here.
    to_process = None

    _utils.logger.info("Starting prediction loop")

    while True:
        # Get the latest list of to process data
        batch = []
        unique_ids = []
        batch_collection_start_time = 0
        while True:
            if len(_utils.REQUEST_QUEUE):
                unique_id, in_data = _utils.REQUEST_QUEUE.pop()
                batch_collection_start_time = time.time()
                for _ in in_data:
                    unique_ids.append(unique_id)
                    batch.append(_)

            if len(batch) >= batch_size:
                unique_id_count = len(set(unique_ids))
                if unique_id_count > 1:
                    _utils.logger.debug(
                        f"Batch of size: {len(batch)}, max_batch_size: {batch_size}, unique_ids: {unique_id_count} collected."
                    )
                batch_collection_start_time = 0
                break

            if batch_collection_start_time != 0 and (
                time.time() - batch_collection_start_time >= max_wait_time
            ):
                unique_id_count = len(set(unique_ids))
                if unique_id_count > 1:
                    _utils.logger.debug(
                        f"Batch of size: {len(batch)}, max_batch_size: {batch_size}, unique_ids: {unique_id_count} collected."
                    )
                batch_collection_start_time = 0
                break

            time.sleep(time_per_example * 0.001)

        try:
            preds = predictor(batch, batch_size=batch_size)
            _utils.logger.debug(
                f"Batch of size: {len(batch)}, max_batch_size: {batch_size} predicted."
            )
        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            preds = [{"success": False, "reason": str(ex)} for _ in range(len(batch))]

        unique_id_wise_results = {}
        for unique_id, pred in zip(unique_ids, preds):
            if unique_id not in unique_id_wise_results:
                unique_id_wise_results[unique_id] = []

            unique_id_wise_results[unique_id].append(pred)

        for unique_id, _preds in unique_id_wise_results.items():
            _utils.RESULTS_INDEX[unique_id] = _preds

        time.sleep(_utils.PREDICTION_LOOP_SLEEP)


if __name__ == "__main__":
    start_loop()

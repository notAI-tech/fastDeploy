import os
import glob
import json
import time
import shutil
import pickle

import _utils


def start_loop(predictor, example):
    """
    The Prediction loop. This is where the logic happens.

    :input predictor: the predictor function. def predictor(inputs=[], batch_size=8)
    :input example: a pickled json of the example input.

    This function starts a loop. Does not return anything.
    """

    # warmup
    _utils.warmup(predictor, example)

    # find optimal batch size and get_time_per example
    batch_size, time_per_example = _utils.find_optimum_batch_sizes(predictor, example)

    max_wait_time = time_per_example * _utils.MAX_WAIT

    # write batch size to temp file for use in generating _run.sh
    _utils.REQUEST_QUEUE["META.batch_size"] = batch_size

    # list of files/data to be processed is tracked here.
    to_process = None

    _utils.logger.info("Starting prediction loop")

    while True:
        time.sleep(_utils.PREDICTION_LOOP_SLEEP)
        # Get the latest list of to process data

        batch = []
        unique_ids = []
        batch_collection_start_time = 0
        while True:
            try:
                unique_id, in_data = _utils.REQUEST_QUEUE.pop()
                batch_collection_start_time = time.time()
                for _ in in_data:
                    unique_ids.append(unique_id)
                    batch.append(_)

                if len(batch) >= batch_size:
                    _utils.logger.debug(
                        f"Batch of size: {len(batch)}, batch_size: {batch_size} collected."
                    )
                    batch_collection_start_time = 0
                    break

                if batch_collection_start_time != 0 and (
                    time.time() - batch_collection_start_time >= max_wait_time
                ):
                    _utils.logger.debug(
                        f"Batch of size: {len(batch)}, batch_size: {batch_size} collected."
                    )
                    batch_collection_start_time = 0
                    break

                time.sleep(max_wait_time * 0.1)
            except:
                pass

        try:
            preds = predictor(batch, batch_size=batch_size)
            _utils.logger.debug(
                f"Batch of size: {len(batch)}, batch_size: {batch_size} predicted."
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


if __name__ == "__main__":
    from predictor import predictor

    start_loop(predictor, _utils.example)

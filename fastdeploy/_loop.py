import os
import glob
import json
import time
import shutil

from . import _utils

IS_FILE_INPUT = _utils.LOG_INDEX["META.IS_FILE_INPUT"]


def start_loop():
    ACCEPTS_EXTRAS = False
    try:
        from predictor import predictor

        try:
            predictor([], extras=[])
            ACCEPTS_EXTRAS = True
        except:
            pass

        _utils.LOG_INDEX["ACCEPTS_EXTRAS"] = ACCEPTS_EXTRAS

        _utils.logger.info(f'ACCEPTS_EXTRAS: {_utils.LOG_INDEX["ACCEPTS_EXTRAS"]}')
    except Exception as ex:
        _utils.logger.exception(ex, exc_info=True)

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

    # write batch size to temp file for use in generating _run.sh
    _utils.LOG_INDEX["META.batch_size"] = batch_size
    _utils.LOG_INDEX["META.time_per_example"] = time_per_example
    _utils.logger.info(f"max_wait_time: {max_wait_time}, batch_size: {batch_size}")

    # list of files/data to be processed is tracked here.
    to_process = None

    _utils.logger.info("Starting prediction loop")

    while True:
        # Get the latest list of to process data
        batch = []

        batch_extra_options = []

        unique_ids = []
        unique_id_to_metrics = {}
        batch_collection_start_time = time.time()
        first_sleep_start_time = 0
        while True:
            if len(_utils.REQUEST_INDEX):
                (
                    unique_id,
                    (in_data, unique_id_to_metrics[unique_id], _batch_extra_options),
                ) = _utils.REQUEST_INDEX.popitem(last=False)
                batch_collection_start_time = time.time()

                for __i, _ in enumerate(in_data):
                    unique_ids.append(unique_id)
                    batch.append(_)
                    batch_extra_options += _batch_extra_options

            if len(unique_ids) == 0:
                if first_sleep_start_time == 0:
                    first_sleep_start_time = time.time()
                else:
                    if time.time() - first_sleep_start_time >= _utils.BATCH_COLLECTION_SLEEP_IF_EMPTY_FOR:
                        _utils.logger.info(f"Empty for {_utils.BATCH_COLLECTION_SLEEP_IF_EMPTY_FOR} sec sleeping for {_utils.BATCH_COLLECTION_SLEEP_FOR_IF_EMPTY} sec")
                        time.sleep(_utils.BATCH_COLLECTION_SLEEP_FOR_IF_EMPTY)
                        continue
                
                time.sleep(_utils.PREDICTION_LOOP_SLEEP)
                continue
            
            first_sleep_start_time = 0

            if len(batch) >= batch_size:
                unique_id_count = len(set(unique_ids))
                if unique_id_count > 1:
                    _utils.logger.info(
                        f"Batch of size: {len(batch)}, max_batch_size: {batch_size}, unique_ids: {unique_id_count} collected."
                    )
                batch_collection_start_time = 0
                break

            if batch_collection_start_time != 0 and (
                time.time() - batch_collection_start_time >= max_wait_time
            ):
                unique_id_count = len(set(unique_ids))
                if unique_id_count > 1:
                    _utils.logger.info(
                        f"Batch of size: {len(batch)}, max_batch_size: {batch_size}, unique_ids: {unique_id_count} collected."
                    )
                batch_collection_start_time = 0
                break

            time.sleep(time_per_example * 0.004)

        try:
            pred_start_time = time.time()

            if ACCEPTS_EXTRAS:
                preds = predictor(
                    batch, batch_size=batch_size, extras=batch_extra_options
                )
            else:
                preds = predictor(batch, batch_size=batch_size)

            pred_end_time = time.time()

            for unique_id in unique_id_to_metrics:
                unique_id_to_metrics[unique_id]["prediction_start"] = pred_start_time
                unique_id_to_metrics[unique_id]["prediction_end"] = pred_end_time
                unique_id_to_metrics[unique_id]["predicted_in_batch"] = len(unique_ids)

            _utils.logger.info(
                f"Batch of size: {len(batch)}, max_batch_size: {batch_size} predicted."
            )
        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            preds = [{"success": False, "reason": str(ex)} for _ in range(len(batch))]

        if IS_FILE_INPUT:
            for _ in batch:
                try:
                    os.remove(_)
                except Exception as ex:
                    _utils.logger.warning(ex, exc_info=True)

        unique_id_wise_results = {}
        for unique_id, pred in zip(unique_ids, preds):
            if unique_id not in unique_id_wise_results:
                unique_id_wise_results[unique_id] = []

            unique_id_wise_results[unique_id].append(pred)

        for unique_id, _preds in unique_id_wise_results.items():
            _utils.RESULTS_INDEX[unique_id] = (_preds, unique_id_to_metrics[unique_id])

        time.sleep(_utils.PREDICTION_LOOP_SLEEP)


if __name__ == "__main__":
    start_loop()

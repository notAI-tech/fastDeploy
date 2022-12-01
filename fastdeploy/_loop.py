import os
import glob
import json
import time
import shutil

from . import _utils
import importlib


def get_predictor_and_info(predictor_name):
    predictor = importlib.import_module(os.path.splitext(predictor_name)[0]).predictor
    predictor_sequence = 0
    if predictor_name == "predictor.py":
        is_first = True
        is_last = True
    else:
        predictor_sequence = int(predictor_name.split("predictor_")[1].split(".")[0])

        is_first = not os.path.exists(
            f"predictor_{predictor_sequence - 1}.py",
        )
        is_last = not os.path.exists(
            f"predictor_{predictor_sequence + 1}.py",
        )

        predictor_sequence = predictor_sequence - 1

    if is_last:
        _utils.META_INDEX["LAST_PREDICTOR_SEQUENCE"] = predictor_sequence

    if is_first:
        _utils.META_INDEX["FIRST_PREDICTOR_SEQUENCE"] = predictor_sequence

    return (predictor, predictor_sequence, is_first, is_last)


def start_loop(predictor_name):
    IS_FILE_INPUT = _utils.META_INDEX.get("IS_FILE_INPUT")
    ACCEPTS_EXTRAS = _utils.META_INDEX.get("ACCEPTS_EXTRAS")

    (predictor, predictor_sequence, is_first, is_last) = get_predictor_and_info(
        predictor_name
    )

    REQUEST_INDEX, RESULTS_INDEX = _utils.get_request_index_results_index(
        predictor_sequence, is_first, is_last
    )

    try:
        _utils.META_INDEX[f"last_prediction_loop_start_time_{predictor_sequence}"] = 0
        if predictor_sequence == 0:
            _utils.META_INDEX["example_0"] = _utils.example

            if isinstance(_utils.example[0], str) and os.path.exists(_utils.example[0]):
                _utils.META_INDEX["IS_FILE_INPUT"] = True
            else:
                _utils.META_INDEX["IS_FILE_INPUT"] = False

        IS_FILE_INPUT = _utils.META_INDEX["IS_FILE_INPUT"]

        if predictor_sequence > 0:
            _utils.logger.info(
                f"predictor_{predictor_sequence}: waiting for predictor_{predictor_sequence - 1} to start."
            )

        while True:
            try:
                _utils.META_INDEX[f"example_{predictor_sequence}"]
                break
            except:
                try:
                    if _utils.META_INDEX[f"failed_predictor_{predictor_sequence - 1}"]:
                        _utils.logger.error(
                            f"Previous predictor, predictor_{predictor_sequence + 1}.py failed at initialization."
                        )
                        exit()
                except:
                    time.sleep(2)

        try:
            predictor(
                _utils.META_INDEX[f"example_{predictor_sequence}"][:1],
                extras=[None],
            )
            ACCEPTS_EXTRAS = True
        except:
            try:
                predictor(_utils.META_INDEX[f"example_{predictor_sequence}"][:1])
                ACCEPTS_EXTRAS = False
            except:
                _utils.META_INDEX[f"failed_predictor_{predictor_sequence}"] = True

        _utils.META_INDEX["ACCEPTS_EXTRAS"] = ACCEPTS_EXTRAS

        if ACCEPTS_EXTRAS:
            _utils.META_INDEX[f"example_{predictor_sequence + 1}"], extras = predictor(
                _utils.META_INDEX[f"example_{predictor_sequence}"][:1], extras=[None]
            )
        else:
            _utils.META_INDEX[f"example_{predictor_sequence + 1}"] = predictor(
                _utils.META_INDEX[f"example_{predictor_sequence}"][:1]
            )

        _utils.logger.info(f'ACCEPTS_EXTRAS: {_utils.META_INDEX["ACCEPTS_EXTRAS"]}')
    except Exception as ex:
        _utils.logger.exception(ex, exc_info=True)

    """
    The Prediction loop. This is where the logic happens.

    This function starts a loop. Does not return anything.
    """

    # warmup
    _utils.warmup(predictor, _utils.META_INDEX[f"example_{predictor_sequence}"])

    # find optimal batch size and get_time_per _utils.META_INDEX[f"example_{predictor_sequence}"]
    batch_size, time_per_example = _utils.find_optimum_batch_sizes(
        predictor,
        predictor_sequence,
        _utils.META_INDEX[f"example_{predictor_sequence}"],
    )

    max_wait_time = time_per_example * _utils.MAX_WAIT

    # write batch size to temp file for use in generating _run.sh
    _utils.META_INDEX[f"batch_size_{predictor_sequence}"] = batch_size
    _utils.META_INDEX[f"time_per_example_{predictor_sequence}"] = time_per_example

    _utils.logger.info(
        f"predictor_{predictor_sequence}: Predictor loop started batch_size_{predictor_sequence}: {batch_size}"
    )

    LAST_N_PREDICTED_EXAMPLES = []
    LAST_N_PREDICTION_TIMES = []

    while True:
        # Get the latest list of to process data
        batch = []

        batch_extra_options = []

        unique_ids = []
        batch_collection_start_time = time.time()
        first_sleep_start_time = 0
        __loop_is_sleeping = False
        unique_id_wise_batch_extra_options = {}

        while True:
            _utils.META_INDEX[
                f"last_prediction_loop_start_time_{predictor_sequence}"
            ] = time.time()

            try:
                unique_id, (in_data, _batch_extra_options) = REQUEST_INDEX.popitem(
                    last=False
                )
                unique_id_wise_batch_extra_options[unique_id] = _batch_extra_options
                batch_collection_start_time = time.time()

                for __i, _ in enumerate(in_data):
                    unique_ids.append(unique_id)
                    batch.append(_)

                batch_extra_options += _batch_extra_options
            except:
                pass

            if len(unique_ids) == 0:
                if first_sleep_start_time == 0:
                    first_sleep_start_time = time.time()
                else:
                    if (
                        time.time() - first_sleep_start_time
                        >= _utils.BATCH_COLLECTION_SLEEP_IF_EMPTY_FOR
                    ):
                        if not __loop_is_sleeping:
                            _utils.logger.info(
                                f"predictor_{predictor_sequence}: Empty for {_utils.BATCH_COLLECTION_SLEEP_IF_EMPTY_FOR} sec, loop sleep started. wakeup_interval: {_utils.BATCH_COLLECTION_SLEEP_FOR_IF_EMPTY}"
                            )
                        __loop_is_sleeping = True
                        time.sleep(_utils.BATCH_COLLECTION_SLEEP_FOR_IF_EMPTY)
                        continue

                time.sleep(_utils.PREDICTION_LOOP_SLEEP)
                continue

            first_sleep_start_time = 0
            __loop_is_sleeping = False

            if len(batch) >= batch_size:
                unique_id_count = len(set(unique_ids))
                if unique_id_count > 1:
                    _utils.logger.info(
                        f"predictor_{predictor_sequence}: Batch of size: {len(batch)}, max_batch_size: {batch_size}, unique_ids: {unique_id_count} collected."
                    )
                batch_collection_start_time = 0
                break

            if batch_collection_start_time != 0 and (
                time.time() - batch_collection_start_time >= max_wait_time
            ):
                unique_id_count = len(set(unique_ids))
                if unique_id_count > 1:
                    _utils.logger.info(
                        f"predictor_{predictor_sequence}: Batch of size: {len(batch)}, max_batch_size: {batch_size}, unique_ids: {unique_id_count} collected."
                    )
                batch_collection_start_time = 0
                break

            time.sleep(time_per_example * 0.004)

        try:
            pred_start_time = time.time()
            __in_batch_length = len(batch)

            if ACCEPTS_EXTRAS:
                preds = predictor(
                    batch, batch_size=batch_size, extras=batch_extra_options
                )
            else:
                preds = predictor(batch, batch_size=batch_size)

            if not isinstance(preds, list) or len(preds) != __in_batch_length:
                _utils.logger.error(
                    f"predictor_{predictor_sequence}: Something is seriously wrong! len(inputs) != len(outputs) from predictor_{predictor_sequence + 1}.py. Check your recipe"
                )
                _utils.logger.error(
                    f"predictor_{predictor_sequence}: Inputs: {batch} length: {__in_batch_length, len(batch)}"
                )
                _utils.logger.error(
                    f"predictor_{predictor_sequence}: Preds: {preds} length: {len(preds) if isinstance(preds, list) else 'N/A'}"
                )
                exit()

            pred_end_time = time.time()

            LAST_N_PREDICTED_EXAMPLES.append(__in_batch_length)
            LAST_N_PREDICTION_TIMES.append(pred_end_time - pred_start_time)

            LAST_N_PREDICTED_EXAMPLES = LAST_N_PREDICTED_EXAMPLES[
                -1 * _utils.RUNNING_TIME_PER_EXAMPLE_AVERAGE_OVER :
            ]
            LAST_N_PREDICTION_TIMES = LAST_N_PREDICTION_TIMES[
                -1 * _utils.RUNNING_TIME_PER_EXAMPLE_AVERAGE_OVER :
            ]

            _utils.META_INDEX[f"running_time_per_example_{predictor_sequence}"] = sum(
                LAST_N_PREDICTED_EXAMPLES
            ) / sum(LAST_N_PREDICTION_TIMES)

            _utils.logger.info(
                f"predictor_{predictor_sequence}: Batch of size: {len(batch)}, max_batch_size: {batch_size} predicted."
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
            if not is_last:
                RESULTS_INDEX[unique_id] = (
                    _preds,
                    unique_id_wise_batch_extra_options[unique_id],
                )
            else:
                RESULTS_INDEX[unique_id] = _preds

            _ = _utils.METRICS_INDEX[unique_id]
            _["extras"] = unique_id_wise_batch_extra_options[unique_id]
            _["prediction_start"] = _.get("prediction_start", {})
            _["prediction_start"][predictor_sequence] = pred_start_time

            _["prediction_end"] = _.get("prediction_end", {})
            _["prediction_end"][predictor_sequence] = pred_end_time

            _["predicted_in_batch"] = _.get("predicted_in_batch", {})
            _["predicted_in_batch"][predictor_sequence] = len(unique_ids)

            if is_last:
                _["result"] = _preds

            _utils.METRICS_INDEX[unique_id] = _

        if is_last:
            _utils.META_INDEX["TO_PROCESS_COUNT"] -= len(preds)

        time.sleep(_utils.PREDICTION_LOOP_SLEEP)


if __name__ == "__main__":
    import sys

    start_loop(sys.argv[1])

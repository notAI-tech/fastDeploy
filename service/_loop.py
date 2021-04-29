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
    os.system(f"echo {batch_size} > {_utils.batch_size_file_path}")

    # list of files/data to be processed is tracked here.
    to_process = None

    _utils.logger.info("Starting prediction loop")

    last_paused_time = 0
    while True:
        time.sleep(_utils.PREDICTION_LOOP_SLEEP)
        # Get the latest list of to process data
        to_process = _utils.get_to_process_list(_utils.FILE_MODE)

        if not to_process:
            continue

        _utils.logger.info(f"{len(to_process)} inputs left in queue.")

        if len(to_process) < batch_size - 1:
            # start the wait
            if not last_paused_time:
                last_paused_time = time.time()
                _utils.logger.info(f"Waiting for more inputs for batching.")
                continue
            # if waiting for less than max_wait_time, continue waiting
            if time.time() - last_paused_time < max_wait_time:
                _utils.logger.info(f"Waiting for more inputs for batching.")
                continue

        # waiting completed
        last_paused_time = 0

        # The "batch" here is a batch of inputs.
        # since, each input might contain more than one example (client side batching)
        # we pass the batch_size paramter to predictor
        # this is especially helpfull for most of the major deep learning libraries
        # that accept batch_size as a parameter to predict call
        # TLDR; predictor function should respect a parameter named batch_size
        for batch in _utils.get_batch(to_process, batch_size):
            _utils.logger.info(f"Processing batch with unique_ids: {batch}")

            # in_data will contain flattened list of user inputs.
            # batch = [['1', '2'], ['3'], ['4,5,6']] will result in
            # in_data = [1, 2, 3, 4, 5, 6]
            # number_of_examples_per_req = [2, 1, 3]
            # This way, we can pass the in_data to predictor function with above calculated batch_size
            # later, we can use number_of_examples_per_req to re-order preds in to batches.
            in_data = []
            number_of_examples_per_req = []
            for i, in_path in enumerate(batch):
                try:
                    if _utils.FILE_MODE:
                        in_list = glob.glob(in_path + "/*")
                    else:
                        in_list = pickle.load(open(in_path, "rb"))

                    in_data += in_list
                    number_of_examples_per_req.append(len(in_list))

                except Exception as ex:
                    batch[i] = None

            batch = [example for example in batch if example is not None]

            if len(in_data) == 0:
                continue

            try:
                results = predictor(in_data, batch_size=batch_size)
            except Exception as ex:
                _utils.logger.exception(ex, exc_info=True)
                results = [str(ex) for _ in in_data]

            for i, in_path in enumerate(batch):
                # we use number_of_examples_per_req to re-order preds in to batches.
                # result is the list of preds for the current batch
                result = results[: number_of_examples_per_req[i]]
                # remove current batch from list of all predictions
                results = results[number_of_examples_per_req[i] :]

                _in_data = in_data[: number_of_examples_per_req[i]]
                in_data = in_data[number_of_examples_per_req[i] :]

                if _utils.FILE_MODE:
                    _in_data = [os.path.basename(j) for j in _in_data]
                    remove_till = _in_data[0].index(".") + 1
                    _in_data = [j[remove_till:] for j in _in_data]

                    result = {
                        in_sub_path: sub_result
                        for in_sub_path, sub_result in zip(_in_data, result)
                    }
                    os.system(f"rm -rf {in_path}")

                    in_path = in_path[:-4]
                else:
                    os.system(f"rm -rf {in_path}")

                res_path = _utils.in_path_to_res_path(in_path)

                pickle.dump(result, open(res_path, "wb"), protocol=2)

                _utils.logger.info(f"result written for {res_path}")
                _utils.create_symlink_in_ram(res_path)


if __name__ == "__main__":
    from predictor import predictor

    start_loop(predictor, _utils.example)

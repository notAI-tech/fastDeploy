import os
import glob
import json
import time
import shutil
import pickle

import _utils

FILE_MODE = False


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

    time_per_batch = batch_size * time_per_example
    max_wait_time = time_per_batch * _utils.MAX_WAIT

    # write batch size to temp file for use in generating _run.sh
    os.system(f"echo {batch_size} > {_utils.batch_size_file_path}")

    # list of files/data to be processed is tracked here.
    to_process = None

    _utils.logger.info("Starting prediction loop")

    last_paused_time = -1
    while True:
        # Get the latest list of to process data
        to_process = _utils.get_to_process_list(FILE_MODE)

        if not to_process:
            continue

        if len(to_process) < batch_size - 1:
            # start the wait
            if not last_paused_time:
                last_paused_time = time.time()
                continue
            # if waiting for less than max_wait_time, continue waiting
            if time.time() - last_paused_time < max_wait_time:
                continue

        # waiting completed
        last_paused_time = -1

        # The "batch" here is a batch of inputs.
        # since, each input might contain more than one example (client side batching)
        # we pass the batch_size paramter to predictor
        # this is especially helpfull for most of the major deep learning libraries
        # that accept batch_size as a parameter to predict call
        # TLDR; predictor function should respect a parameter named batch_size
        for batch in _utils.get_batch(to_process, batch_size):
            # in_data will contain flattened list of user inputs.
            # batch = [['1', '2'], ['3'], ['4,5,6']] will result in
            # in_data = [1, 2, 3, 4, 5, 6]
            # n_per_file = [2, 1, 3]
            # This way, we can pass the in_data to predictor function with above calculated batch_size
            # later, we can use n_per_file to re-order preds in to batches.
            in_data = []
            n_per_file = []
            for i, in_path in enumerate(batch):
                try:
                    if FILE_MODE:
                        in_list = glob.glob(in_path + "/*")
                    else:
                        in_list = pickle.load(open(in_path, "rb"))

                    in_data += in_list
                    n_per_file.append(len(in_list))

                except Exception as ex:
                    batch[i] = None

            batch = [example for example in batch if example is not None]

            if len(in_data) == 0:
                continue

            try:
                results = predictor(in_data, batch_size=batch_size)
            except Exception as ex:
                results = [str(ex) for _ in in_data]

            for i, in_path in enumerate(batch):
                # we use n_per_file to re-order preds in to batches.
                result = results[: n_per_file[i]]
                results = results[n_per_file[i] :]

                _in_data = in_data[: n_per_file[i]]
                in_data = in_data[n_per_file[i] :]

                if FILE_MODE:
                    _in_data = [os.path.basename(j) for j in _in_data]
                    remove_till = _in_data[0].index(".") + 1
                    _in_data = [j[remove_till:] for j in _in_data]

                    result = {
                        in_sub_path: sub_result
                        for in_sub_path, sub_result in zip(_in_data, result)
                    }
                    shutil.rmtree(in_path)
                    in_path = in_path[:-4]
                else:
                    os.remove(in_path)

                res_path = _utils.in_path_to_res_path(in_path)

                pickle.dump(result, open(res_path, "wb"), protocol=2)

                _utils.create_symlink_in_ram(res_path)


if __name__ == "__main__":
    from predictor import predictor

    example = pickle.load(open("example.pkl", "rb"))

    if isinstance(example, dict):
        FILE_MODE = True

        import base64

        write_dir = "./example_test"
        try:
            os.mkdir(write_dir)
        except:
            pass

        for i, (file_name, b64_string) in enumerate(example.items()):
            file_extension = file_name.split(".")[-1]
            file_path = os.path.join(
                write_dir, f"{str(i).zfill(len(example) + 1)}.{file_extension}"
            )
            open(file_path, "wb").write(base64.b64decode(b64_string.encode("utf-8")))

        example = glob.glob(write_dir + "/*")

    start_loop(predictor, example)

import os
import time
import json
import pickle

import msgpack
import zstandard

import threading

from . import _utils

started_at_time = time.time()

# make sure all predictors are running before starting the inference server
# if any are not yet started/ still loading then wait for them to start
for predictor_file, predictor_sequence in _utils.PREDICTOR_FILE_TO_SEQUENCE.items():
    log_printed = False
    while True:
        try:
            time_per_example = _utils.META_INDEX.get(
                f"{predictor_sequence}", select_keys=["time_per_example"]
            )[f"{predictor_sequence}"]["time_per_example"]
            started_at_time = time.time()
            break
        except:
            if not log_printed:
                _utils.logger.info(f"Waiting for {predictor_file} to start")
            log_printed = True
            time.sleep(1)


class Infer:
    started_at_time = started_at_time

    def __init__(
        self,
        allow_pickle=os.getenv("ALLOW_PICKLE", "true").lower() == "true",
    ):
        self.local_storage = threading.local()
        self.allow_pickle = allow_pickle

    @property
    def _compressor(self):
        if (
            not hasattr(self.local_storage, "compressor")
            or self.local_storage.compressor is None
        ):
            self.local_storage.compressor = zstandard.ZstdCompressor(level=-1)
        return self.local_storage.compressor

    @property
    def _decompressor(self):
        if (
            not hasattr(self.local_storage, "decompressor")
            or self.local_storage.decompressor is None
        ):
            self.local_storage.decompressor = zstandard.ZstdDecompressor()
        return self.local_storage.decompressor

    def read_inputs(self, unique_id, inputs, input_type, is_compressed):
        if input_type == "pickle":
            if not self.allow_pickle:
                _utils.logger.warning(
                    f"{unique_id}: tried to use pickle input, but pickle is disallowed"
                )
                raise Exception("pickle input disallowed, use msgpack or json")

            inputs = pickle.loads(
                inputs if not is_compressed else self._decompressor.decompress(inputs)
            )
            _utils.logger.debug(f"pickle input read")

        elif input_type == "msgpack":
            inputs = msgpack.unpackb(
                inputs if not is_compressed else self._decompressor.decompress(inputs),
                use_list=False,
                raw=False,
            )

            _utils.logger.debug(f"{unique_id}: msgpack input read")

        elif input_type == "json":
            inputs = json.loads(
                inputs if not is_compressed else self._decompressor.decompress(inputs)
            )

            # for backward compatibility
            try:
                inputs = inputs["data"]
            except:
                pass

            _utils.logger.debug(f"{unique_id}: json input read")

        else:
            _utils.logger.warning(f"{unique_id}: input_type {input_type} not supported")
            raise Exception(f"input_type {input_type} not supported")

        return inputs

    def create_response(self, unique_id, response, is_compressed, input_type):
        success = response["success"]
        if input_type == "pickle":
            response = pickle.dumps(response)
        elif input_type == "msgpack":
            response = msgpack.packb(response, use_bin_type=True)
        elif input_type == "json":
            pass

        if is_compressed:
            response = self._compressor.compress(response)
            _utils.logger.debug(f"{unique_id}: response compressed")

        return success, response

    def get_timeout_response(
        self, unique_id, is_compressed, input_type, is_client_timeout=False
    ):
        if is_client_timeout:
            _utils.MAIN_INDEX.update(
                {
                    unique_id: {
                        "-1.predicted_at": time.time(),
                        "timedout_in_queue": True,
                    }
                }
            )
            _utils.logger.warning(f"{unique_id}: client timeout")

        return self.create_response(
            unique_id,
            {
                "success": False,
                "reason": "timeout" if not is_client_timeout else "client_timeout",
                "unique_id": unique_id,
                "prediction": None,
            },
            is_compressed,
            input_type,
        )

    def add_to_infer_queue(
        self, inputs: bytes, unique_id: str, input_type: str, is_compressed: bool
    ):
        try:
            request_received_at = time.time()
            _utils.logger.debug(f"{unique_id}: reading inputs")

            inputs = self.read_inputs(unique_id, inputs, input_type, is_compressed)

            if inputs is None:
                _utils.logger.warning(f"{unique_id}: inputs are None")
                return self.create_response(
                    unique_id,
                    {
                        "success": False,
                        "reason": f"inputs have to be {'pickle,' if self.allow_pickle else ''} msgpack or json",
                        "unique_id": unique_id,
                        "prediction": None,
                    },
                    is_compressed,
                    input_type,
                )

            if not isinstance(inputs, (list, tuple)):
                _utils.logger.warning(f"{unique_id}: inputs have to be a list or tuple")
                return self.create_response(
                    unique_id,
                    {
                        "success": False,
                        "reason": "inputs have to be a list or tuple",
                        "unique_id": unique_id,
                        "prediction": None,
                    },
                    is_compressed,
                    input_type,
                )

            if not inputs:
                _utils.logger.debug(f"{unique_id}: empty inputs")
                return self.create_response(
                    unique_id,
                    {
                        "success": True,
                        "reason": "empty inputs",
                        "unique_id": unique_id,
                        "prediction": [],
                    },
                    is_compressed,
                    input_type,
                )

            else:
                # -1 is the predictor sequence for the rest server, basically where the request originates
                _utils.MAIN_INDEX.update(
                    {
                        unique_id: {
                            "-1.outputs": inputs,
                            "-1.received_at": request_received_at,
                            "-1.predicted_in_batch_of": len(inputs),
                            "-1.predicted_at": 0,
                            "last_predictor_sequence": -1,
                            "last_predictor_success": True,
                            "timedout_in_queue": None,
                        }
                    }
                )

                _utils.logger.debug(f"{unique_id}: added to request queue")

                return True, None
        except Exception as ex:
            _utils.logger.exception(ex, exc_info=True)
            return self.create_response(
                unique_id,
                {
                    "success": False,
                    "reason": str(ex),
                    "unique_id": unique_id,
                    "prediction": None,
                },
                is_compressed,
                input_type,
            )

    def get_responses_for_unique_ids(self, unique_ids, is_compresseds, input_types):
        all_current_results = _utils.MAIN_INDEX.get(
            unique_ids,
            select_keys=[
                f"{_utils.LAST_PREDICTOR_SEQUENCE}.outputs",
                "last_predictor_success",
                "last_predictor_sequence",
                "timedout_in_queue",
            ],
        )

        all_responses = {}

        updations = {}
        still_processing = []

        for unique_id, is_compressed, input_type in zip(
            unique_ids, is_compresseds, input_types
        ):
            current_results = all_current_results[unique_id]

            if current_results["timedout_in_queue"]:
                _utils.logger.warning(f"{unique_id}: timedout in queue")
                updations[unique_id] = {
                    "-1.predicted_at": time.time(),
                }
                all_responses[unique_id] = self.get_timeout_response(
                    unique_id, is_compressed, input_type
                )
                _utils.logger.debug(f"{unique_id}: timedout in queue response created")

            elif (
                current_results["last_predictor_success"] is True
                and current_results["last_predictor_sequence"]
                == _utils.LAST_PREDICTOR_SEQUENCE
            ):
                updations[unique_id] = {
                    "-1.predicted_at": time.time(),
                }

                all_responses[unique_id] = self.create_response(
                    unique_id,
                    {
                        "success": True,
                        "unique_id": unique_id,
                        "prediction": current_results[
                            f"{_utils.LAST_PREDICTOR_SEQUENCE}.outputs"
                        ],
                        "reason": None,
                    },
                    is_compressed,
                    input_type,
                )
                _utils.logger.debug(f"{unique_id}: response created")
            elif current_results["last_predictor_success"] is False:
                _utils.logger.warning(
                    f"{unique_id}: predictor failed at {current_results['last_predictor_sequence']}"
                )
                updations[unique_id] = {
                    "-1.predicted_at": time.time(),
                }
                all_responses[unique_id] = self.create_response(
                    unique_id,
                    {
                        "success": False,
                        "reason": f"prediction failed predictor {current_results['last_predictor_sequence']}",
                        "unique_id": unique_id,
                        "prediction": None,
                    },
                    is_compressed,
                    input_type,
                )
                _utils.logger.debug(f"{unique_id}: failed response created")

            else:
                still_processing.append(unique_id)

        if updations:
            _utils.MAIN_INDEX.update(updations)

        if still_processing:
            _utils.logger.debug(f"Still processing: {still_processing}")

        return all_responses

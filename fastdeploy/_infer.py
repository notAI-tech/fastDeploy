import os
import time
import json
import pickle
import msgpack
import zstandard
import threading

from . import _utils

for predictor_file, predictor_sequence in _utils.PREDICTOR_FILE_TO_SEQUENCE.items():
    log_printed = False
    while True:
        try:
            time_per_example = _utils.META_INDEX.get(
                f"{predictor_sequence}", select_keys=["time_per_example"]
            )[f"{predictor_sequence}"]["time_per_example"]
            break
        except:
            if not log_printed:
                _utils.logger.info(f"Waiting for {predictor_file} to start")
            log_printed = True
            time.sleep(1)


class Infer:
    def __init__(
        self,
        timeout=float(os.getenv("TIMEOUT", 0)),
        allow_pickle=os.getenv("ALLOW_PICKLE", "true").lower() == "true",
    ):
        self.local_storage = threading.local()
        self.result_polling_interval = max(
            0.0001, _utils.META_INDEX.math("time_per_example", "sum") * 0.2
        )
        self.timeout = timeout
        self.allow_pickle = allow_pickle
        _utils.logger.info(
            f"result_polling_interval: {self.result_polling_interval} timeout: {self.timeout}"
        )

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

    def read_inputs(self, inputs, input_type, is_compressed):
        if self.allow_pickle is False and input_type == "pickle":
            return None

        if input_type == "pickle":
            inputs = pickle.loads(
                inputs if not is_compressed else self._decompressor.decompress(inputs)
            )
        elif input_type == "msgpack":
            inputs = msgpack.unpackb(
                inputs if not is_compressed else self._decompressor.decompress(inputs),
                use_list=False,
                raw=False,
            )
        elif input_type == "json":
            inputs = json.loads(
                inputs if not is_compressed else self._decompressor.decompress(inputs)
            )
        else:
            inputs = None

        return inputs

    def create_response(self, response, is_compressed, input_type):
        success = response["success"]
        if input_type == "pickle":
            response = pickle.dumps(response)
        elif input_type == "msgpack":
            response = msgpack.packb(response, use_bin_type=True)
        elif input_type == "json":
            pass

        if is_compressed:
            response = self._compressor.compress(response)

        return success, response

    def infer(
        self,
        inputs: bytes,
        unique_id: str,
        input_type: str,
        is_compressed: bool,
        is_async_request: bool,
    ):
        try:
            request_received_at = time.time()

            inputs = self.read_inputs(inputs, input_type, is_compressed)

            if inputs is None:
                return self.create_response(
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
                return self.create_response(
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
                return self.create_response(
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
                _utils.MAIN_INDEX.update(
                    {
                        unique_id: {
                            "-1.outputs": inputs,
                            "-1.received_at": request_received_at,
                            "-1.predicted_in_batch_of": len(inputs),
                            "-1.predicted_at": 0,
                            "is_async_request": is_async_request,
                            "last_predictor_sequence": -1,
                            "last_predictor_success": True,
                        }
                    }
                )

                while True:
                    current_results = _utils.MAIN_INDEX.get(
                        unique_id,
                        select_keys=[
                            f"{_utils.LAST_PREDICTOR_SEQUENCE}.outputs",
                            "last_predictor_success",
                            "last_predictor_sequence",
                        ],
                    )[unique_id]

                    if (
                        current_results["last_predictor_success"] is True
                        and current_results["last_predictor_sequence"]
                        == _utils.LAST_PREDICTOR_SEQUENCE
                    ):
                        _utils.MAIN_INDEX.update(
                            {unique_id: {"-1.predicted_at": time.time()}}
                        )
                        return self.create_response(
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
                    elif current_results["last_predictor_success"] is False:
                        return self.create_response(
                            {
                                "success": False,
                                "reason": f"prediction failed predictor {current_results['last_predictor_sequence']}",
                                "unique_id": unique_id,
                                "prediction": None,
                            },
                            is_compressed,
                            input_type,
                        )
                    else:
                        if (
                            self.timeout > 0
                            and self.timeout
                            and time.time() - request_received_at >= self.timeout
                        ):
                            return self.create_response(
                                {
                                    "success": False,
                                    "reason": "timeout",
                                    "unique_id": unique_id,
                                    "prediction": None,
                                },
                                is_compressed,
                                input_type,
                            )

                    time.sleep(self.result_polling_interval)

        except Exception as ex:
            return self.create_response(
                {
                    "success": False,
                    "reason": str(ex),
                    "unique_id": unique_id,
                    "prediction": None,
                },
                is_compressed,
                input_type,
            )

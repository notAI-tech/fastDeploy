import os
import time
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
    def __init__(self, timeout=float(os.getenv("TIMEOUT", 0))):
        self.local_storage = threading.local()
        self.result_polling_interval = max(
            0.0001, _utils.META_INDEX.math("time_per_example", "sum") * 0.2
        )
        self.timeout = timeout

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

    def infer(
        self,
        inputs: bytes,
        unique_id: str,
        is_pickled_input: bool,
        is_compressed: bool,
        is_async_request: bool,
    ):
        request_received_at = time.time()

        if is_pickled_input:
            inputs = pickle.loads(
                inputs if not is_compressed else self._decompressor.decompress(inputs)
            )
        else:
            inputs = msgpack.unpackb(
                inputs if not is_compressed else self._decompressor.decompress(inputs),
                use_list=False,
                raw=False,
            )

        if not isinstance(inputs, (list, tuple)):
            response = {
                "success": False,
                "reason": "inputs have to be a list or tuple",
                "unique_id": unique_id,
                "prediction": None,
            }

        if not inputs:
            response = {
                "success": True,
                "reason": "empty request",
                "prediction": [],
                "unique_id": unique_id,
            }

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
                    response = {
                        "success": True,
                        "unique_id": unique_id,
                        "prediction": current_results[
                            f"{_utils.LAST_PREDICTOR_SEQUENCE}.outputs"
                        ],
                        "reason": None,
                    }

                    _utils.MAIN_INDEX.update(
                        {unique_id: {"-1.predicted_at": time.time()}}
                    )
                    break
                elif current_results["last_predictor_success"] is False:
                    response = {
                        "success": False,
                        "reason": f"prediction failed predictor {current_results['last_predictor_sequence']}",
                        "unique_id": unique_id,
                        "prediction": None,
                    }
                    break
                else:
                    if (
                        self.timeout > 0
                        and self.timeout
                        and time.time() - request_received_at >= self.timeout
                    ):
                        response = {
                            "success": False,
                            "reason": "timeout",
                            "unique_id": unique_id,
                            "prediction": None,
                        }
                        break

                    time.sleep(self.result_polling_interval)

        return response["success"], msgpack.packb(
            response, use_bin_type=True
        ) if not is_compressed else self._compressor.compress(
            msgpack.packb(response, use_bin_type=True)
        ) if not is_pickled_input else pickle.dumps(
            response
        ) if not is_compressed else self._compressor.compress(
            pickle.dumps(response)
        )

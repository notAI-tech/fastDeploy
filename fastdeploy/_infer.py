import time
import pickle
import msgpack
import zstandard
import threading

from . import _utils


class Infer:
    def __init__(self):
        self.local_storage = threading.local()
        self.result_polling_interval = 0.01
        self.max_batch_size = _utils.MAX_PER_CLIENT_BATCH

    @property
    def _compressor(self):
        if (
            not hasattr(self.local_storage, "compressor")
            or self.local_storage.compressor is None
        ):
            self.local_storage.compressor = zstandard.ZstdCompressor(level=3)
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

        elif self.max_batch_size and len(inputs) > self.max_batch_size:
            response = {
                "success": False,
                "reason": f"input size exceded {self.max_batch_size}",
                "unique_id": unique_id,
                "prediction": None,
            }

        else:
            _utils.MAIN_INDEX.update(
                {
                    unique_id: {
                        "-1.outputs": inputs,
                        "-1.received_at": request_received_at,
                        "-1.predicted_in_batch_of": len(inputs),
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
                        _utils.TIMEOUT > 0
                        and _utils.TIMEOUT
                        and time.time() - request_received_at >= _utils.TIMEOUT
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
        )

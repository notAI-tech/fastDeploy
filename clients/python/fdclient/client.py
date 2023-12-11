try:
    import zstandard
except:
    zstandard = None

try:
    import msgpack
except:
    msgpack = None

import threading
import requests
import pickle
import uuid
import time
import json

import concurrent.futures as futures


class FDClient:
    def __init__(self, server_url, compression=True):
        self.server_url = server_url
        self.local_storage = threading.local()
        self.requests_session = requests.Session()
        self.compression = compression if zstandard is not None else False
        self.input_type = (
            "pickle"
            if self.requests_session.get(
                f"{self.server_url}/meta", params={"is_pickle_allowed": ""}
            ).json()["is_pickle_allowed"]
            else "msgpack"
            if msgpack is not None
            else "json"
        )

    @property
    def _compressor(self):
        if self.compression is False:
            return None

        if (
            not hasattr(self.local_storage, "compressor")
            or self.local_storage.compressor is None
        ):
            self.local_storage.compressor = zstandard.ZstdCompressor(level=-1)
        return self.local_storage.compressor

    @property
    def _decompressor(self):
        if self.compression is False:
            return None

        if (
            not hasattr(self.local_storage, "decompressor")
            or self.local_storage.decompressor is None
        ):
            self.local_storage.decompressor = zstandard.ZstdDecompressor()
        return self.local_storage.decompressor

    @property
    def _thread_pool_executor(self):
        if (
            not hasattr(self.local_storage, "thread_pool_executor")
            or self.local_storage.thread_pool_executor is None
        ):
            self.local_storage.thread_pool_executor = futures.ThreadPoolExecutor(32)
        return self.local_storage.thread_pool_executor

    @property
    def _decompressor(self):
        if self.compression is False:
            return None

        if (
            not hasattr(self.local_storage, "decompressor")
            or self.local_storage.decompressor is None
        ):
            self.local_storage.decompressor = zstandard.ZstdDecompressor()
        return self.local_storage.decompressor

    def infer(self, data, unique_id=None, is_async=False):
        assert isinstance(data, (list, tuple)), "Data must be of type list or tuple"

        unique_id = str(uuid.uuid4()) if not unique_id else unique_id

        if self.input_type == "pickle":
            data = pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
        elif self.input_type == "msgpack":
            data = msgpack.packb(data, use_bin_type=True)
        else:
            data = json.dumps(data)

        response = self.requests_session.post(
            f"{self.server_url}/infer",
            params={
                "unique_id": unique_id,
                "async": is_async,
                "input_type": self.input_type,
                "compressed": True if zstandard is not None else False,
            },
            data=self._compressor.compress(data) if zstandard is not None else data,
            headers={"Content-Type": "application/octet-stream"},
        )

        if self.input_type == "pickle":
            return pickle.loads(
                self._decompressor.decompress(response.content)
                if zstandard is not None
                else response.content
            )
        elif self.input_type == "msgpack":
            return msgpack.unpackb(
                self._decompressor.decompress(response.content)
                if zstandard is not None
                else response.content,
                raw=False,
                use_list=False,
            )
        else:
            return json.loads(
                self._decompressor.decompress(response.content)
                if zstandard is not None
                else response.content
            )

    def infer_async(self, data, unique_id=None):
        return self.infer(data, unique_id, is_async=True)

    def infer_background(self, data, unique_id=None):
        return self._thread_pool_executor.submit(self.infer, data, unique_id)

    def infer_background_multiple(self, data_list, unique_ids=None):
        return [
            self.infer_background(data, unique_ids[i] if unique_ids else None)
            for i, data in enumerate(data_list)
        ]

    def __close__(self):
        self._thread_pool_executor.shutdown(wait=False, cancel_futures=True)

    def __del__(self):
        self.__close__()


if __name__ == "__main__":
    client = FDClient("http://localhost:8080")

    print(client.input_type)

    s = time.time()
    print("infer", client.infer(["this", "is", "some", b"data"]), time.time() - s)

    s = time.time()
    x = client.infer_background(["this", "is", b"some", "data"])
    print("infer_background", x.result(), time.time() - s)

    s = time.time()

    print(
        "infer_background_multiple 40",
        len(
            [
                _.result()
                for _ in client.infer_background_multiple(
                    [["this", b"is", "some", "data"]] * 40
                )
            ]
        ),
        time.time() - s,
    )

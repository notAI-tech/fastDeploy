try:
    import zstandard
except:
    zstandard = None
import threading
import requests
import pickle
import uuid
import time

import concurrent.futures as futures


class FDClient:
    def __init__(self, server_url):
        self.server_url = server_url
        self.local_storage = threading.local()
        self.request_session = requests.Session()

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

    def infer(self, data, unique_id=None, is_async=False):
        assert isinstance(data, (list, tuple)), "Data must be of type list or tuple"

        unique_id = str(uuid.uuid4()) if not unique_id else unique_id

        data = pickle.dumps(data, protocol=5)

        response = self.request_session.post(
            f"{self.server_url}/infer",
            params={
                "unique_id": unique_id,
                "async": is_async,
                "pickled": True,
                "compressed": True if zstandard is not None else False,
            },
            data=self._compressor.compress(data) if zstandard is not None else data,
            headers={"Content-Type": "application/octet-stream"},
        )

        return pickle.loads(
            self._decompressor.decompress(response.content)
            if zstandard is not None
            else response.content
        )

    def infer_async(self, data, unique_id=None):
        return self.infer(data, unique_id, is_async=True)

    def infer_background(self, data, unique_id=None):
        with futures.ThreadPoolExecutor() as executor:
            future = executor.submit(self.infer, data)
        return future

    def infer_background_multiple(self, data_list, unique_ids=None):
        with futures.ThreadPoolExecutor() as executor:
            futures_list = []
            for data in data_list:
                futures_list.append(executor.submit(self.infer, data))
        return futures_list


if __name__ == "__main__":
    client = FDClient("http://localhost:8080")
    x = client.infer_background(["this", "is", "some", "data"])

    print(x.result())

    for _ in range(10):
        s = time.time()
        client.infer(["this", "is", "some", "data"])
        print(time.time() - s)

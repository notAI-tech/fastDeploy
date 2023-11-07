try:
    import zstandard
except:
    zstandard = None
import threading
import requests
import msgpack
import pickle
import uuid

import concurrent.futures as futures


class FDClient:
    def __init__(self, server_url):
        self.server_url = server_url
        self.local_storage = threading.local()

    @property
    def _compressor(self):
        if (
            not hasattr(self.local_storage, "compressor")
            or self.local_storage.compressor is None
        ):
            self.local_storage.compressor = (
                zstandard.ZstdCompressor(level=3)
            )
        return self.local_storage.compressor

    @property
    def _decompressor(self):
        if (
            not hasattr(self.local_storage, "decompressor")
            or self.local_storage.decompressor is None
        ):
            self.local_storage.decompressor = (
                zstandard.ZstdDecompressor()
            )
        return self.local_storage.decompressor

    def infer(self, data, unique_id=None):
        assert isinstance(data, (list, tuple)), "Data must be of type list or tuple"

        unique_id = str(uuid.uuid4()) if not unique_id else unique_id
        is_pickled = False
        try:
            data = msgpack.packb(data, use_bin_type=True)
        except:
            data = pickle.dumps(data, protocol=5)
            is_pickled = True

        response = requests.post(
            f"{self.server_url}/infer",
            params={"unique_id": unique_id, "async": True, "pickled": is_pickled, "compressed": "1" if zstandard is not None else "0"},
            data= self._compressor.compress(data) if zstandard is not None else data,
            headers={"Content-Type": "application/msgpack"},
        )

        if is_pickled:
            return pickle.loads(self._decompressor.decompress(response.content) if zstandard is not None else response.content)
        else:
            return msgpack.unpackb(self._decompressor.decompress(response.content) if zstandard is not None else response.content, raw=False)

    def infer_background(self, data, unique_id=None):
        with futures.ThreadPoolExecutor() as executor:
            future = executor.submit(self.infer, data)
        return future


if __name__ == "__main__":
    client = FDClient("http://localhost:8080")
    x = client.infer_background(["this", "is", "some", "data"])

    print(x.result())

    print(client.infer(["this", "is", "some", "data"]))

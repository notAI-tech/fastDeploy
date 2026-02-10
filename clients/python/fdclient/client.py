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
import httpx
import pickle
import uuid
import time
import json


class FDClient:
    def __init__(self, server_url, request_timeout, compression=True, use_requests_session=False):
        assert server_url.startswith("http://") or server_url.startswith(
            "https://"
        ), "Server URL must start with http:// or https://"

        self.server_url = server_url
        self.local_storage = threading.local()
        self.requests_session = requests.Session() if use_requests_session else requests
        self.compression = compression if zstandard is not None else False
        self.input_type = None
        self._set_input_type()
            
        self.request_timeout = request_timeout

    def _set_input_type(self):
        if self.input_type is None:
            try:
                self.input_type = (
                    "pickle"
                    if self.requests_session.get(
                        f"{self.server_url}/meta", params={"is_pickle_allowed": ""}
                    ).json()["is_pickle_allowed"]
                    else "msgpack"
                    if msgpack is not None
                    else "json"
                )
            except Exception as e:
                self.input_type = None

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
        if self.input_type is None:
            self._set_input_type()
            if self.input_type is None:
                raise ValueError("Could not connect to server")
        
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
                "timeout": self.request_timeout,
            },
            data=self._compressor.compress(data) if zstandard is not None else data,
            headers={"Content-Type": "application/octet-stream"},
            timeout=self.request_timeout * 1.1,
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


class FDClientAsync:
    def __init__(self, server_url, request_timeout, compression=True):
        assert server_url.startswith("http://") or server_url.startswith(
            "https://"
        ), "Server URL must start with http:// or https://"

        self.server_url = server_url
        self.compression = compression if zstandard is not None else False
        self.input_type = None
        self.request_timeout = request_timeout
        self._client = httpx.AsyncClient(timeout=request_timeout * 1.1)
        self._compressor_instance = None
        self._decompressor_instance = None

    async def _set_input_type(self):
        if self.input_type is None:
            try:
                response = await self._client.get(
                    f"{self.server_url}/meta", params={"is_pickle_allowed": ""}
                )
                self.input_type = (
                    "pickle"
                    if response.json()["is_pickle_allowed"]
                    else "msgpack"
                    if msgpack is not None
                    else "json"
                )
            except Exception as e:
                self.input_type = None

    @property
    def _compressor(self):
        if self.compression is False:
            return None
        if self._compressor_instance is None:
            self._compressor_instance = zstandard.ZstdCompressor(level=-1)
        return self._compressor_instance

    @property
    def _decompressor(self):
        if self.compression is False:
            return None
        if self._decompressor_instance is None:
            self._decompressor_instance = zstandard.ZstdDecompressor()
        return self._decompressor_instance

    async def infer(self, data, unique_id=None, is_async=False):
        if self.input_type is None:
            await self._set_input_type()
            if self.input_type is None:
                raise ValueError("Could not connect to server")

        assert isinstance(data, (list, tuple)), "Data must be of type list or tuple"

        unique_id = str(uuid.uuid4()) if not unique_id else unique_id

        if self.input_type == "pickle":
            data = pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
        elif self.input_type == "msgpack":
            data = msgpack.packb(data, use_bin_type=True)
        else:
            data = json.dumps(data)

        response = await self._client.post(
            f"{self.server_url}/infer",
            params={
                "unique_id": unique_id,
                "async": is_async,
                "input_type": self.input_type,
                "compressed": True if zstandard is not None else False,
                "timeout": self.request_timeout,
            },
            content=self._compressor.compress(data) if zstandard is not None else data,
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

    async def infer_async(self, data, unique_id=None):
        return await self.infer(data, unique_id, is_async=True)

    async def close(self):
        await self._client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


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
        [
            _.result()["success"]
            for _ in client.infer_background_multiple(
                [["this", b"is", "some", "data"]] * 40
            )
        ],
        time.time() - s,
    )

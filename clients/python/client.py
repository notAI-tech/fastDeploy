import requests
import msgpack
import uuid

import concurrent.futures as futures

class FDClient:
    def __init__(self, server_url):
        self.server_url = server_url

    def infer(self, data, unique_id=None):
        assert isinstance(data, (list, tuple)), "Data must be of type list or tuple"
        
        unique_id = str(uuid.uuid4()) if not unique_id else unique_id
        
        response = requests.post(
            self.server_url, 
            params = {'unique_id': unique_id, 'async': True},
            data = msgpack.packb(data, use_bin_type=True), 
            headers = {'Content-Type': 'application/msgpack'}
        )
        
        print("Status Code: ", response.status_code)
        print("Response: ", msgpack.unpackb(response.content, raw=False))

    def infer_background(self, data, unique_id=None):
        with futures.ThreadPoolExecutor() as executor:
            future = executor.submit(self.infer, data)
        return future

if __name__ == "__main__":
    client = FDClient('http://localhost:8080/infer')
    x = client.infer_background(["this", "is", "some", "data"])

    x.result()

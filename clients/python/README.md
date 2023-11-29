## fastDeploy python client

```python
from fdclient import FDClient

client = FDClient('http://localhost:8080') # optional compression=False to disable zstd compression

# infer
response = client.infer([obj_1, obj_2, ...]) # optional unique_id='some_id' to specify a unique id for the request

# infer in background
response_future = client.infer_background([obj_1, obj_2, ...]) # optional unique_id='some_id' to specify a unique id for the request
response = response_future.result() # wait for the response and get it
```

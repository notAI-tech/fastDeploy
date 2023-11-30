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

- By default fdclient communicates with fastDeploy server via pickles
- pickle is very useful and makes sense when using fastDeploy server as a micro service internally i.e: all requests to fastDeploy originate from code you have writtem
- ***PICKLE is secure if all the inputs to fastDeploy are originating from your code and not direct external user's pickles***
- ***PICKLE is unsecure if you are passing external user inputs to fastDeploy directly without validation in between***
- start fastDeploy serve with `--config "allow_pickle=false"` if the fastDeploy APIs are exposed to outside
- `allow_pickle=false` config on server side makes fdclient use `msgpack` if available or `json` if msgpack not available.

#### If pickle is unsecure, why use it at all?

- pickle is great to send or receive arbitary inputs and outputs
- if `allow_pickle=true` (default) your inputs and outputs can be any python objects, eg: np arrays, pd dataframes, float32 anything ....
- pickle is only unsecure if you are unpickling objects pickled by others (since they can insert malicious code)
- If fastDeploy is being used only for internal microservices, pickle is the best way so enabled by default

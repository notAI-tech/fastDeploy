
### fastDeploy CLI usage explained


- invoking the CLI
```python
fastDeploy --help
# or
python -m fastDeploy --help
```


#### Prediction loop
- Start prediction loop on your recipe
```python
fastdeploy --loop --recipe ./recipes/echo
```

- Optional config can be passed with `--config` flag

```python
fastdeploy --loop --recipe ./recipes/echo --config "predictor_name=predictor.py;optimal_batch_size=0"
```

| Config | Description | Default |
| --- | --- | --- |
| predictor_name | predictor.py or predictor_N.py, name of the predictor run in the loop | predictor.py |
| optimal_batch_size | integer max batch size for the predictor | 0 (auto determine) |

- Same config can also be passed as env variables
```python
export PREDICTOR_NAME=predictor.py
export OPTIMAL_BATCH_SIZE=0
fastdeploy --loop --recipe ./recipes/echo
```



#### Start API server
- Start API server on your recipe
```python
fastdeploy --rest --recipe ./recipes/echo
```

- Optional config can be passed with `--config` flag

```python
fastdeploy --rest --recipe ./recipes/echo --config "max_request_batch_size=0;workers=3;timeout=480;host=0.0.0.0;port=8080;only_async=false;allow_pickle=true;keep_alive=60"
```

- Same config can also be passed as env variables
```python
export MAX_REQUEST_BATCH_SIZE=0
export WORKERS=3
export TIMEOUT=480
export HOST=0.0.0.0
export PORT=8080
export ONLY_ASYNC=false
export ALLOW_PICKLE=true
export KEEP_ALIVE=60
fastdeploy --rest --recipe ./recipes/echo
```

| Config | Description | Default |
| --- | --- | --- |
| max_request_batch_size | integer max number of inputs in a batch | 0 (None) |
| workers | integer number of workers | 3 |
| timeout | seconds after which request will fail | 480 |
| host | host for the REST server | 0.0.0.0 |
| port | port for the REST server | 8080 |
| only_async | true/false | false |
| allow_pickle | true/false - use for disallowing pickle protocol when expecting external inputs | true |
| keep_alive | gunicorn gevent keep alive | 60 |


#### Build docker image

- Build generate docker image for your recipe
```python
fastdeploy --build --recipe ./recipes/echo
```

- also supports optional config via `--config` flag
- both rest and loop config options can be passed here in the same config string



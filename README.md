## fastDeploy

- Deploy any python inference pipeline with minimal extra code
- Auto batching of concurrent inputs is enabled out of the box
- Promethues metrics (open metrics) are exposed for monitoring
- helpful TUI for building optimal docker image
- pre-built recipes for popular pipelines (huggingface, fastai, pytorch, tensorflow, etc)
- chained inference pipelines are supported out of the box
- optimized REST, websocket and rpc apis are exposed for inference


**Installation:** 
```bash
pip install --upgrade fastdeploy
```

**Usage:**
```bash
# Invoke fastdeploy 
fastdeploy --help
# or
python -m fastdeploy --help

# Start prediction "loop" for recipe "echo_json"
fastdeploy --loop --recipe recipes/echo_json

# Start rest apis for recipe "echo_json"
fastdeploy --rest --recipe recipes/echo_json

# Writes the dockerfile for recipe "echo_json"
# and builds the docker image if docker is installed
fastdeploy --build --recipe recipes/echo_json

# Run docker image
docker run -it -p8080:8080 fastdeploy_echo_json
```

#### Serving your pipeline with fastdeploy
- Create a recipe folder with the following structure:
```
recipe_folder/
├── example.py
├── predictor.py
├── requirements.txt (optional)
└── extras.sh (optional)
```

- `example.py`

```python
name = "your_app_or_model_name"

example = [
    example_object_1,
    example_object_2,
]
```

- `predictor.py`

```python
# Whatever code and imports you need to load your model and make predictions

# predictor function must be defined exactly as below
# batch_size is the optimal batch size for your model
# inputs length may or may not be equal to batch_size
# len(outputs) == len(inputs)
def predictor(inputs, batch_size=1):
    return outputs
```

- `requirements.txt` (optional): all python dependencies for your pipeline

- `extras.sh` (optional): any bash commands to run before installing requirements.txt

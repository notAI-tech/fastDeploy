<p align="center">
    <h1 align="center">fastDeploy</h1>
    <p align="center">Deploy DL/ ML inference pipelines with minimal extra code.</p>
</p>

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
fastdeploy --recipe ./echo_json --mode loop

# Start rest apis for recipe "echo_json"
fastdeploy --recipe ./echo_json --mode rest

# Auto genereate dockerfile and build docker image. --base is docker base
fastdeploy --recipe ./recipes/echo_json/ \
 --mode build_rest --base python:3.6-slim
# fastdeploy_echo_json built!

# Run docker image
docker run -it -p8080:8080 fastdeploy_echo_json
```

- [serving your model with fastDeploy](https://github.com/notAI-tech/fastDeploy/blob/master/recipe.md)
- [cURL and Python inference examples](https://github.com/notAI-tech/fastDeploy/blob/master/inference.md)

**fastDeploy monitor**
- available on localhost:8080 (or --port)

![](https://raw.githubusercontent.com/notAI-tech/fastDeploy/master/fastDeploy_monitor.png)

## fastDeploy

- Deploy any python inference pipeline with minimal extra code
- Auto batching of concurrent inputs is enabled out of the box
- Promethues metrics (open metrics) are exposed for monitoring
- Auto generates clean kubernetes friendly dockerfiles and apis
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

- [Writing your model/pipeline's recipe](https://github.com/notAI-tech/fastDeploy/blob/master/recipe.md)


### Where to use fastDeploy?

- to deploy any non ultra light weight models i.e: most DL models, >50ms inference time per example
- if you are going to have individual inputs (example, user's search input which needs to be vectorized or image to be classified)
- in the case of individual inputs, requests coming in at close intervals will be batched together and sent to the model as a batch
- perfect for creating internal micro services separating your model, pre and post processing from business logic
- since prediction loop and inference endpoints are separated and are connected via sqlite backed queue, can be scaled independently


### Where not to use fastDeploy?
- non cpu/gpu heavy models that are better of running parallely rather than in batch
- if your predictor calls some external API or db etc
- io heavy non batching use cases (eg: query ES or db for each input)
- for these cases better to directly do from rest api code so that high concurrency can be achieved

## fastDeploy
#### easy and performant micro-services for Python Deep Learning inference pipelines

- Deploy any python inference pipeline with minimal extra code
- Auto batching of concurrent inputs is enabled out of the box
- no changes to inference code (unlike tf-serving etc), entire pipeline is run as is
- Promethues metrics (open metrics) are exposed for monitoring
- Auto generates clean dockerfiles and kubernetes health check, scaling friendly APIs
- sequentially chained inference pipelines are supported out of the box
- can be queried from any language via easy to use rest apis
- easy to understand (simple consumer producer arch) and simple code base


#### Installation:
```bash
pip install --upgrade fastdeploy fdclient
# fdclient is optional, only needed if you want to use python client
```

#### [CLI explained](https://github.com/notAI-tech/fastDeploy/blob/master/cli.md)

#### Start fastDeploy server on a recipe: 
```bash
# Invoke fastdeploy 
python -m fastdeploy --help
# or
fastdeploy --help

# Start prediction "loop" for recipe "echo"
fastdeploy --loop --recipe recipes/echo

# Start rest apis for recipe "echo"
fastdeploy --rest --recipe recipes/echo
```

#### Send a request and get predictions:

- [Python client usage](https://github.com/notAI-tech/fastDeploy/blob/master/clients/python/README.md)

- [curl usage]()

- [Nodejs client usage]()

#### auto generate dockerfile and build docker image:
```bash
# Write the dockerfile for recipe "echo"
# and builds the docker image if docker is installed
# base defaults to python:3.8-slim
fastdeploy --build --recipe recipes/echo

# Run docker image
docker run -it -p8080:8080 fastdeploy_echo
```

#### Serving your model (recipe):

- [Writing your model/pipeline's recipe](https://github.com/notAI-tech/fastDeploy/blob/master/recipe.md)


### Where to use fastDeploy?

- to deploy any non ultra light weight models i.e: most DL models, >50ms inference time per example
- if the model/pipeline benefits from batch inference, fastDeploy is perfect for your use-case
- if you are going to have individual inputs (example, user's search input which needs to be vectorized or image to be classified)
- in the case of individual inputs, requests coming in at close intervals will be batched together and sent to the model as a batch
- perfect for creating internal micro services separating your model, pre and post processing from business logic
- since prediction loop and inference endpoints are separated and are connected via sqlite backed queue, can be scaled independently


### Where not to use fastDeploy?
- non cpu/gpu heavy models that are better of running parallely rather than in batch
- if your predictor calls some external API or uploads to s3 etc in a blocking way
- io heavy non batching use cases (eg: query ES or db for each input)
- for these cases better to directly do from rest api code (instead of consumer producer mechanism) so that high concurrency can be achieved

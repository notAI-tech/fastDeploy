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

# Start prediction "loop" for recipe "deepsegment"
fastdeploy --recipe ./deepsegment --mode loop

# Start rest apis for recipe "deepsegment"
fastdeploy --recipe ./deepsegment --mode rest

# Run prediction using curl
curl -d '{"data": ["I was hungry i ordered a pizza"]}'\
-H "Content-Type: application/json" -X POST http://localhost:8080/infer

# Run prediction using python
python -c 'import requests; print(requests.post("http://localhost:8080/infer",\
json={"data": ["I was hungry i ordered a pizza"]}).json())'

# Response
{'prediction': [['I was hungry', 'i ordered a pizza']], 'success': True}

# Auto genereate dockerfile and build docker image. --base is docker base
fastdeploy --recipe ./recipes/deepsegment/ \
 --mode build_rest --base tensorflow/tensorflow:1.14.0-py3
# fastdeploy_deepsegment built!

# Run docker image
docker run -it -p8080:8080 fastdeploy_deepsegment

```

**Features:**

1. ***Minimal extra code:*** No model exporting/ conversion/ freezing required. fastDeploy is the easiest way to serve and/or dockerize your existing inference code with minimal work. 
2. ***Fully configurable dynamic batching:*** fastDeploy dynamically batches concurrent requests for optimal resource usage.
3. ***Containerization with no extra code:*** fastDeploy auto generates optimal dockerfiles and builds the image with no extra code.
4. ***One consumer, multiple producers:*** (Coming soon) Single fastDeploy loop (consumer) can simultaneously be connected to multiple (types of) producers (rest, websocket, file).
5. ***One producer, multiple consumers:*** Distribute one producer's work load to multiple consumers running on multiple nodes (assuming common storage is available for queues)

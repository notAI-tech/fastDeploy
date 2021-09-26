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
[{'prediction': [['I was hungry', 'i ordered a pizza']], 'success': True}, '200 OK']
```

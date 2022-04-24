# Inference
- if your predictor takes files as input see File, otherwise see JSON
- List of inputs needs to be sent as JSON
- The batch of inputs sent here (even if a batch of 1) are dynamically batched with inputs from concurrent requests top achieve optimal performance.
- For async request, append `?async=true` to the url

# cURL JSON
```bash
curl -d [input1, input2] -H "Content-Type: application/json" -X POST "http://localhost:8080/infer"
```


# Python JSON

```python
requests.post("http://localhost:8080/infer", json=[input1, input2]).json()
```


# cURL File

```bash
curl -F f1=@"PATH_TO_FILE1" -F f2=@"PATH_TO_FILE2" "http://localhost:8080/infer"
```


# Python File

```python
requests.post("http://localhost:8080/sync", files={"f1": open("PATH_TO_FILE1", "rb"), "f2": open("PATH_TO_FILE2", "rb")}).json()
```


### Serving your pipeline with fastdeploy

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

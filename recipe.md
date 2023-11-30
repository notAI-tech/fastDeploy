### Serving your pipeline with fastdeploy [example](https://github.com/notAI-tech/fastDeploy/tree/master/recipes/echo)

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

- #### start the loop

```bash
fastdeploy --loop --recipe recipes/echo_chained
```

- #### start the server

```bash
fastdeploy --rest --recipe recipes/echo_chained
```


### Chained recipe [example](https://github.com/notAI-tech/fastDeploy/tree/master/recipes/echo_chained)
- Chained recipe means you have multiple predictor_X.py which are chained sequentially
- `predictor_1.py` will be called first, then `predictor_2.py` and so on
- Each predictor_X.py must have a predictor function defined as above
- Each predictor_X.py is run separately i.e: can be in different virtualenvs

- #### start all the loops

```bash
fastdeploy --loop --recipe recipes/echo_chained --config "predictor_name:predictor_1.py"

fastdeploy --loop --recipe recipes/echo_chained --config "predictor_name:predictor_2.py"
```

- #### start the server

```bash
fastdeploy --rest --recipe recipes/echo_chained
```

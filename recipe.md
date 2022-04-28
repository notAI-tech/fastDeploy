# What is a Recipe?

- TO serve your model via fastDeploy, a folder with files `example.py`, `predictor.py` and optional `requirements.txt`, `extras.sh` needs to be added to your existing scripts.
- These files make up `recipe` for fastDeploy

# predictor.py

```python
# YOUR MODEL LOADING CODE HERE

def predictor.py(list_of_inputs, batch_size=1):
    # inputs can be python objects (string/list/dict..) (text models) or file_paths (image/speech models)
    # run prediction on list of inputs here
    # batch_size is the optional batch_size param you can pass to your keras/tensorflow/pytorch model
    # You can ignore batch_size and loop over list_of_inputs and and predict one by one too
    # output shoud be JSON serializable (strings/lists/dicts/ints/floats ..)
    
    return list_of_outputs
    
```


# example.py

```python
example = [INPUT]
# INPUT can be string/lsit/dict anything your scripts need.
# INPUT can also be file path, in which case you can keep example file next to example.py and INPUT = example file name
```

# requirements.txt 
- optional. Needed only for building a docker image with fastdeploy
- Python requirements for containerizing your recipe using docker.

# extras.sh
- optional
- If you have requirements like opencv which require some apt-get or any commands to be run to correctly work, list all those commands in extras.sh


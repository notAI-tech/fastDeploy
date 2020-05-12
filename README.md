<p align="center">
    <h1 align="center">fastDeploy</h1>
    <p align="center">fastDeploy provides a convenient way to serve DL/ ML models with minimal extra code.</p>
</p>

**CLI Usage:** [https://fastdeploy.notai.tech/cli](https://fastdeploy.notai.tech/cli)

**API interface:** [https://fastdeploy.notai.tech/api](https://fastdeploy.notai.tech/api)

**Recipies:** [https://fastdeploy.notai.tech/recipes](https://fastdeploy.notai.tech/recipes)


# Download CLI
```bash
wget https://raw.githubusercontent.com/notAI-tech/fastDeploy/master/cli/fastDeploy.py

chmod +x fastDeploy.py
```

# Quick Start
```python
# See all the arguments supported.
./fastDeploy.py --help

# Print list of available recipes with descriptions.
./fastDeploy.py --list_recipes

# Run a recipe (eg: craft_text_detection).
./fastDeploy.py --run craft_text_detection --name craft_text_detection_test_run
```

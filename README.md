<p align="center">
    <h1 align="center">fastDeploy</h1>
    <p align="center">Deploy DL/ ML inference pipelines with minimal extra code.</p>
</p>

**CLI Usage:** [https://fastdeploy.notai.tech/cli](https://fastdeploy.notai.tech/cli)

**API interface:** [https://fastdeploy.notai.tech/api](https://fastdeploy.notai.tech/api)

**pre-built Recipies:** [https://fastdeploy.notai.tech/recipes](https://fastdeploy.notai.tech/recipes)

**Deploying your code:** [https://fastdeploy.notai.tech/recipes#building-your-own-recipe-deployment](https://fastdeploy.notai.tech/recipes#building-your-own-recipe-deployment)

We provide **free to use APIs** for some recipes. Documentation: [**https://fastdeploy.notai.tech/free_apis**](https://fastdeploy.notai.tech/free_apis)

# Download CLI
```bash
wget https://raw.githubusercontent.com/notAI-tech/fastDeploy/master/cli/fastDeploy.py

chmod +x fastDeploy.py
```

# Quick Start
```bash
# See all the arguments supported.
./fastDeploy.py --help

# Print list of available recipes with descriptions.
./fastDeploy.py --list_recipes

# Run a recipe (eg: craft_text_detection).
./fastDeploy.py --run craft_text_detection --name craft_text_detection_test_run
```


# Feature Requests and Bug Reports
Please raise a github issue for any feature requests or bug reports.

- Use issue label **`fastDeploy Bug`** for issues with core fastDeploy.
- Use issue label **`Recipe Bug`** for issues with any recipes we provide.
- Use issue label **`Request Base`** for requesting a new base image.
- Use issue label **`Request Recipe`** for requesting a recipe for useful public repos.

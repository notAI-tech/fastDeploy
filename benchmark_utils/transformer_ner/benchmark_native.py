import os
from transformers import pipeline

from time import time

pipeline_name = os.getenv("PIPELINE", "ner")

MAX_LEN = int(os.getenv('MAX_LEN', '0'))

nlp = pipeline(pipeline_name)


def predictor(in_lines, batch_size=4):
    
    if MAX_LEN:
        in_lines = [l[:MAX_LEN] for l in in_lines]
    
    preds = []
    total_time = 0

    while in_lines:
        start = time()
        pred = nlp(in_lines[:batch_size])
        total_time = total_time + time() - start

        if len(in_lines[:batch_size]) == 1 and pipeline_name in {"ner"}:
            pred = [pred]

        preds += pred

        in_lines = in_lines[batch_size:]

    if pipeline_name == "sentiment-analysis":
        for i, pred in enumerate(preds):
            preds[i]["score"] = float(pred["score"])

    elif pipeline_name == "ner":
        if isinstance(preds[0], dict):
            preds = [preds]

        for i, pred in enumerate(preds):
            for j, ent in enumerate(pred):
                preds[i][j]["score"] = float(ent["score"])

    return total_time


if __name__ == "__main__":
    example = [
        "We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith."
    ]

    # Warmup
    for _ in range(3):
        predictor(example)

    import json

    in_data = example * 1024

    f = open('benchmark_fastDeploy.sh', 'w')

    for batch_size in [1, 2, 4, 8, 16]:
        json.dump({'data': example * batch_size, open(f'{batch_size}.json', 'w'))

        for c in [1, 8, 16, 64, 128]:
            f.write(f"autocannon -c {c} -t 1000 -a {512//batch_size}  -m POST -i {batch_size}.json -H 'Content-Type: application/json' http://localhost:{PORT}/sync\n")


        print(f'batch_size: {batch_size}, total_time: {predictor(in_images, batch_size)} for 512 examples.')

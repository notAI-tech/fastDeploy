import os
from transformers import pipeline

pipeline_name = os.getenv("PIPELINE", "sentiment-analysis")

MAX_LEN = int(os.getenv('MAX_LEN', '0'))

nlp = pipeline(pipeline_name)


def predictor(in_lines, batch_size=4):
    if MAX_LEN:
        in_lines = [l[:MAX_LEN] for l in in_lines]
    
    preds = []
    while in_lines:
        pred = nlp(in_lines[:batch_size])

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

    return preds


if __name__ == "__main__":
    example = [
        "We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith. We are very happy to include pipeline into the transformers repository. My name is John Smith."
    ]

    import json
    import pickle

    print(json.dumps(predictor(example)))

    pickle.dump(example, open("example.pkl", "wb"), protocol=2)

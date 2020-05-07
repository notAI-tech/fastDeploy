import os
from transformers import pipeline

pipeline_name = os.getenv('PIPELINE', 'sentiment-analysis')

nlp = pipeline(pipeline_name)

def predictor(in_lines, batch_size=4):
    preds = []
    while in_lines:
        preds += nlp(in_lines[:batch_size], pad_to_max_length=True)
        in_lines = in_lines[batch_size:]
    
    return preds

if __name__ == '__main__':
    example = ['We are very happy to include pipeline into the transformers repository. We are very happy to include pipeline into the transformers repository.']

    import json
    import pickle

    print(json.dumps(predictor(example)))

    pickle.dump(example, open('example.pkl', 'wb'), protocol=2)
    
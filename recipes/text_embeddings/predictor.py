from sentence_transformers import SentenceTransformer

sentences = ['That is a happy person', 'That is a very happy person']

model = SentenceTransformer('Alibaba-NLP/gte-base-en-v1.5', trust_remote_code=True)

from time import time

def predictor(input_list, batch_size=16):
    return model.encode(input_list, convert_to_numpy=True, normalize_embeddings=True, show_progress_bar=False, batch_size=batch_size)


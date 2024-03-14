import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel
from operator import itemgetter

def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

sentences = ['search_query: What is TSNE?', 'search_query: Who is Laurens van der Maaten?']

tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased', model_max_length=8192)
model = AutoModel.from_pretrained('nomic-ai/nomic-embed-text-v1.5', trust_remote_code=True, safe_serialization=True, rotary_scaling_factor=2)
model.eval()


def predictor(sentences, batch_size=16):
    embeds = []

    for i in range(0, len(sentences), batch_size):
        batch = itemgetter(*range(i, min(i + batch_size, len(sentences))))(sentences)

        encoded_input = tokenizer(batch, padding=True, truncation=True, return_tensors='pt')

        with torch.no_grad():
            model_output = model(**encoded_input)

        embeddings = mean_pooling(model_output, encoded_input['attention_mask'])
        embeddings = F.layer_norm(embeddings, normalized_shape=(embeddings.shape[1],))
        embeddings = F.normalize(embeddings, p=2, dim=1).numpy()
        embeds.extend(embeddings)

    return embeds
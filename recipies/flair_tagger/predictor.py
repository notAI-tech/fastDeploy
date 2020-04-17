import os
from flair.data import Sentence
from flair.models import SequenceTagger

tagger_name = os.getenv('TAGGER_NAME', 'ner')

tag_type = tagger_name.split('-')[0].strip()

tagger = SequenceTagger.load(tagger_name)


def predictor(in_sents=[], batch_size=4):
    preds = []
    while in_sents:
        batch = [Sentence(s, use_tokenizer=True) for s in in_sents[:batch_size]]

        tagger.predict(batch)

        [s.to_dict(tag_type=tag_type) for s in batch]
        preds += batch

        in_sents = in_sents[batch_size:]

    return preds

if __name__ == '__main__':
    import pickle
    example = [
        'I am Batman. I live in Gotham. I was hungry. i ordered a pizza. demons run when a good man goes to war'
    ]

    # protocol is optional
    pickle.dump(example, open('example.pkl', 'wb'), protocol=2)

    example = pickle.load(open('example.pkl', 'rb'))

    print(predictor(example))

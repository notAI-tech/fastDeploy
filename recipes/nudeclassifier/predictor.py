from nudenet import NudeClassifier

m = NudeClassifier()


def predictor(x, batch_size=2):
    preds = m.classify(x, batch_size=batch_size)
    return [preds.get(_) for _ in x]

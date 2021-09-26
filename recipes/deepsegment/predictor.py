from deepsegment import DeepSegment

m = DeepSegment()


def predictor(x, batch_size=32):
    return m.segment(x, batch_size=batch_size)

from deepsegment import DeepSegment

import os

seg = DeepSegment(os.getenv("LANG", "en"))


"""

Your function should take list of items as input
This makes batching possible

"""


def predictor(in_texts=[], batch_size=32):
    if not in_texts:
        return []

    return seg.segment(in_texts)


if __name__ == "__main__":
    import json
    import pickle

    example = [
        "The climate of Andhra Pradesh varies considerably, depending on the geographical region. Summers last from March to June. In the coastal plain, the summer temperatures are generally higher than the rest of the state, with temperature ranging between 20 °C and 41 °C. July to September is the season for tropical rains. About one-third of the total rainfall is brought by the northeast monsoon. October and November see low-pressure systems and tropical cyclones form in the Bay of Bengal which, along with the northeast monsoon, bring rains to the southern and coastal regions of the state."
    ]

    print(json.dumps(predictor(example)))

    pickle.dump(example, open("example.pkl", "wb"), protocol=2)

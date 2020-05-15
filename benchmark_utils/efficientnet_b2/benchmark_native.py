from json import dump
from time import time
from deepsegment import DeepSegment
import base64

model = DeepSegment("en")

import numpy as np
import efficientnet.keras as efn

from skimage.io import imread
from efficientnet.keras import center_crop_and_resize, preprocess_input
from keras.applications.imagenet_utils import decode_predictions

model = efn.EfficientNetB2(weights='noisy-student')

example = "example.jpg"

b64_example = base64.b64encode(open(example, "rb").read()).decode("utf-8")

def read_image(path):
    try:
        return preprocess_input(
            center_crop_and_resize(imread(path)[:, :, :3], image_size=image_size)
        )
    except:
        return None


example = read_image(example)
model_in_data = np.asarray([example for _ in range(8192)])


for batch_size in [1, 4, 16]:
    data = {}
    for i in range(batch_size):
        data[f'{i}.jpg'] = b64_example

    dump({'data': data}, open(f"{batch_size}.json", "w"))


    start = time()
    results = model.predict(model_in_data, batch_size=batch_size)
    end = time()
    print(
        f"\nBatch Size:{batch_size}  Total Time:{end - start} per 8192 examples."
    )

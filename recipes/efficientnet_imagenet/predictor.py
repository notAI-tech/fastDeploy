import os
import numpy as np
import efficientnet.keras as efn 

from skimage.io import imread
from efficientnet.keras import center_crop_and_resize, preprocess_input
from keras.applications.imagenet_utils import decode_predictions

import multiprocessing

weights = os.getenv('WEIGHTS', 'noisy-student')

b_name = os.getenv('B', '2')

model = None

if b_name == '0':
    model = efn.EfficientNetB0(weights=weights)

if b_name == '1':
    model = efn.EfficientNetB1(weights=weights)

if b_name == '2':
    model = efn.EfficientNetB2(weights=weights)

if b_name == '3':
    model = efn.EfficientNetB3(weights=weights)

if b_name == '4':
    model = efn.EfficientNetB4(weights=weights)

if b_name == '5':
    model = efn.EfficientNetB5(weights=weights)

if b_name == '6':
    model = efn.EfficientNetB6(weights=weights)

if b_name == '7':
    model = efn.EfficientNetB7(weights=weights)

image_size = model.input_shape[1]

def read_image(path):
    try:
        return preprocess_input(center_crop_and_resize(imread(path)[:,:,:3], image_size=image_size))
    except:
        return None
        
def predictor(in_paths=[], batch_size=2):
    with multiprocessing.Pool(batch_size) as pool:
        in_images = pool.map(read_image, in_paths)
        pool.close()
    
    bad_indices = {i for i, in_image in enumerate(in_images) if in_image is None}
    in_images = [in_image for in_image in in_images if in_image is not None]

    preds = []

    while len(in_images):
        batch = np.asarray(in_images[:batch_size])
        in_images = in_images[batch_size:]
        try:
            batch_preds = model.predict(batch, batch_size=batch_size)
            batch_preds = decode_predictions(batch_preds)
            batch_preds = [[{'pred': i[1], 'prob': float(i[2])} for i in pred] for pred in batch_preds]
        except Exception as ex:
            batch_preds = [str(ex) for _ in batch]

        while batch_preds:
            if len(preds) in bad_indices:
                preds.append('Failed to read image')
            else:
                preds.append(batch_preds[0])
                batch_preds = batch_preds[1:]
    
    return preds

if __name__ == '__main__':
    import json
    import pickle
    import base64

    example = ['example.jpg']

    print(json.dumps(predictor(example)))

    example = {
        file_name: base64.b64encode(open(file_name, 'rb').read()).decode('utf-8') for file_name in example
    }

    pickle.dump(example, open('example.pkl', 'wb'), protocol=2)

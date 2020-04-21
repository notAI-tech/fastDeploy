import keras_craft


detector = keras_craft.Detector('generic-english')


def predictor(image_paths, batch_size=2):
    all_boxes = detector.detect(image_paths, batch_size=batch_size)

    all_boxes = [[box.tolist() for box in boxes] for boxes in all_boxes]
    
    return all_boxes


if __name__ == '__main__':
    import json
    import pickle
    import base64

    example = ['example.png']

    print(json.dumps(predictor(example)))

    example = {
        file_name: base64.b64encode(open(file_name, 'rb').read()).decode('utf-8') for file_name in example
    }

    pickle.dump(example, open('example.pkl', 'wb'), protocol=2)
    
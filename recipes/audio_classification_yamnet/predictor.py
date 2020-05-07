import os
import pydload

if not os.path.exists('checkpoint'):
    pydload.dload('https://storage.googleapis.com/audioset/yamnet.h5', save_to_path='checkpoint', max_time=None)

import numpy as np
import resampy
import soundfile as sf
import tensorflow as tf

import params
import yamnet as yamnet_model

graph = tf.Graph()
with graph.as_default():
    yamnet = yamnet_model.yamnet_frames_model(params)
    yamnet.load_weights('./checkpoint')

yamnet_classes = yamnet_model.class_names('yamnet_class_map.csv')

def read_wav(w, max_audio_time=30):
    wav_data, sr = sf.read(w, dtype=np.int16)
    waveform = wav_data / 32768.0

    if len(waveform.shape) > 1:
        waveform = np.mean(waveform, axis=1)
    
    waveform = waveform[:max_audio_time * params.SAMPLE_RATE * 1000]

    if sr != params.SAMPLE_RATE:
        waveform = resampy.resample(waveform, sr, params.SAMPLE_RATE)
    
    return waveform

def predict(in_path, max_audio_time=30):
    try:
        waveform = read_wav(in_path, max_audio_time=max_audio_time)

        with graph.as_default():
            scores, mel_spec = yamnet.predict(np.reshape(waveform, [1, -1]), steps=1)

        prediction = np.mean(scores, axis=0)
        # Report the highest-scoring classes and their scores.
        top5_i = np.argsort(prediction)[::-1][:5]

        pred = [{'class': yamnet_classes[i], 'score': float(prediction[i])} for i in top5_i]
    except Exception as ex:
        pred = [{'class': None, 'score': None, 'reason': str(ex)}]

    return pred

def predictor(in_paths, batch_size=2, max_audio_time=10):
    preds = [predict(in_path) for in_path in in_paths]
    return preds

if __name__ == '__main__':
    import json
    import pickle
    import base64

    example = ['example.wav']

    print(json.dumps(predictor(example)))

    example = {
        file_name: base64.b64encode(open(file_name, 'rb').read()).decode('utf-8') for file_name in example
    }

    pickle.dump(example, open('example.pkl', 'wb'), protocol=2)

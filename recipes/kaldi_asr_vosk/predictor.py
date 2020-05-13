import os
import wave
import json
import uuid
import glob
import shlex
import zipfile
import pydload
import multiprocessing

from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(0)

MAX_WAV_LEN = int(os.getenv('MAX_WAV_LEN', '0'))

SAMPLE_RATE = int(os.getenv('SAMPLE_RATE', '0'))

model_zip_url = os.getenv('MODEL_ZIP_URL', 'http://alphacephei.com/kaldi/models/vosk-model-en-us-aspire-0.2.zip')

pydload.dload(model_zip_url, save_to_path='./model.zip', max_time=None)

with zipfile.ZipFile('./model.zip', 'r') as zip_ref:
    zip_ref.extractall('./model')

os.remove('./model.zip')

files_in_model_dir = glob.glob('./model/*')

if len(files_in_model_dir) == 1:
    model = Model(files_in_model_dir[0])

else:
    model = Model("./model")

if not SAMPLE_RATE:
    for mfcc_conf_f in glob.glob('./model/mfcc.conf') + glob.glob('./model/*/mfcc.conf') + glob.glob('./model/*/*/mfcc.conf'):
        sample_rates = [int(l.split('=')[1].strip()) for l in open(mfcc_conf_f).readlines() if '--sample-frequency=' in l]
        if sample_rates:
            if sample_rates[0] in {16000, 8000}:
                SAMPLE_RATE = sample_rates[0]

if not SAMPLE_RATE:
    print('SAMPLE_RATE should be specified.')
    exit()

def run_asr(f):
    try:
        wf = f + str(uuid.uuid4()) + '.wav'
        if MAX_WAV_LEN:
            os.system(f'ffmpeg -hide_banner -loglevel panic -n -i {shlex.quote(f)} -ss 0 -t {MAX_WAV_LEN}  -ar {SAMPLE_RATE} -ac 1 {shlex.quote(wf)}')
        else:
            os.system(f'ffmpeg -hide_banner -loglevel panic -n -i {shlex.quote(f)} -ar {SAMPLE_RATE} -ac 1 {shlex.quote(wf)}')
        
        o_wf = wave.open(wf, "rb")
        data = o_wf.readframes(o_wf.getnframes())
        o_wf.close()
        os.remove(wf)
        
        rec = KaldiRecognizer(model, SAMPLE_RATE)

        rec.AcceptWaveform(data)

        return json.loads(rec.FinalResult())
    except Exception as ex:
        return {'error': str(ex)}


def predictor(in_audios=[], batch_size=2):
    if not in_audios:
        return []
    
    with multiprocessing.Pool(batch_size) as pool:
        transcripts = pool.map(run_asr, in_audios)
    
    return transcripts


if __name__ == "__main__":
    import json
    import pickle
    import base64

    example = ["example.wav"]

    print(json.dumps(predictor(example)))

    example = {
        file_name: base64.b64encode(open(file_name, "rb").read()).decode("utf-8")
        for file_name in example
    }

    pickle.dump(example, open("example.pkl", "wb"), protocol=2)

import os
import torch
import torchaudio
import numpy as np

torchaudio.set_audio_backend("soundfile")

vad_model, vad_utils = torch.hub.load(
    repo_or_dir="snakers4/silero-vad", model="silero_vad", force_reload=False
)


def validate(vad_model, inputs: torch.Tensor):
    with torch.no_grad():
        outs = vad_model(inputs)
    return outs


def int2float(sound):
    abs_max = np.abs(sound).max()
    sound = sound.astype("float32")

    if abs_max > 0:
        sound *= 1 / abs_max

    sound = sound.squeeze()

    return sound


def predictor(in_data, batch_size=4):
    results = []

    while in_data:
        batch = in_data[:batch_size]
        in_data = in_data[batch_size:]

        batch = [int2float(np.frombuffer(_, np.int16)) for _ in batch]
        max_len_in_batch = max(len(max(batch, key=len)), 4000)

        batch = [np.pad(_, (0, max_len_in_batch - len(_))) for _ in batch]
        batch = np.asarray(batch)

        vad_outs = validate(vad_model, torch.from_numpy(batch))

        results += vad_outs.tolist()

    return [_[0] for _ in results]


if __name__ == "__main__":
    import sys
    import wave

    wfs = [wave.open(f, "rb") for f in sys.argv[1:]]

    frame_rate = wfs[0].getframerate()
    chunk_size = 0.25  # seconds
    i = 0
    while True:
        i += 1
        data = [wf.readframes(int(chunk_size * frame_rate)) for wf in wfs]
        data = [_ for _ in data if _ is not None and len(_)]
        if not data:
            break

        print(i * 0.25, len(data), predictor(data))

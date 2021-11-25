import wave

wf = wave.open("test_16k.wav")

frame_rate = wf.getframerate()
chunk_size = 0.25  # seconds
example = [wf.readframes(int(chunk_size * frame_rate))]

from json import dump
from time import time
from deepsegment import DeepSegment

model = DeepSegment("en")

example = [
    "I was hungry i ordered a pizza and i went to the movies which movie did you go to i watched dark knight rises oh how was it it was a good movie yeah thought so"
]

# Warmup
for _ in range(3):
    print("Expected result:", model.segment(example, batch_size=1))

# Expected result is [['I was hungry', 'i ordered a pizza and i went to the movies', 'which movie did you go to', 'i watched dark knight rises', 'oh how was it', 'it was a good movie', 'yeah thought so']]

in_data = list(example * 10000)

for batch_size in [1, 32, 128, 512, 1024]:

    dump(in_data[:batch_size], open(f"{batch_size}.json", "w"))

    start = time()
    results = model.segment(in_data, batch_size)
    end = time()
    print(
        f"\nBatch Size:{batch_size}  Total Time:{end - start} per {len(in_data)} examples."
    )

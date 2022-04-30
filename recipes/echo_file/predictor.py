# Do the required imports
import os
import time

# Any code can be here
# Load your models, import your local scripts
# modify the code inside predictor function.

SLEEP_TIME = float(os.getenv("SLEEP_TIME", "0.2"))

def predictor(input_list, batch_size=1):
    output_list = []
    while input_list:
        input_batch = input_list[:batch_size]
        input_list = input_list[batch_size:]
        output_list += input_batch
        time.sleep(SLEEP_TIME)
    
    return output_list

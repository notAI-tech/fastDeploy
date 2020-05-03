import os
import time
'''

Your function should take list of items as input
This makes batching possible

'''

SLEEP_TIME = float(os.getenv('SLEEP_TIME', '0.01'))

def predictor(in_sents=[], batch_size=32):
    time.sleep(SLEEP_TIME)
    return ['sucess' for _ in in_sents]


if __name__ == '__main__':
    import pickle
    example = [
        'I am Batman I live in Gotham I was hungry i ordered a pizza demons run when a good man goes to war'
    ]

    # protocol is optional
    pickle.dump(example, open('example.pkl', 'wb'), protocol=2)

    example = pickle.load(open('example.pkl', 'rb'))

    print(predictor(example))    

    
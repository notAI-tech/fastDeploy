# generate random sentence with words of size 1-10 characters and total 5-100 words

import random
import string

words = open("words.txt", "r").read().split()

def generate_random_sentence():
    # Generate random number of words between 5-100
    num_words = random.randint(3, 100)
    
    sentence = []
    for _ in range(num_words):
        word = random.choice(words)
        sentence.append(word)
        
    return ' '.join(sentence)


def example_function():
    return [generate_random_sentence() for _ in range(random.randint(1, 10))]

example = example_function()
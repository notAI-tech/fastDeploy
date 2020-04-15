from requests import post
from pickle import load

b64_image = load(open('example.pkl', 'rb'))['example.jpg']

for n in range(1, 4):
    print(f'n:{n}', post('http://localhost:8080/sync', json={'data': {str(i): b64_image for i in range(n)}}).json())

for n in range(1, 4):
    uid = post('http://localhost:8080/async', json={'data': {str(i): b64_image for i in range(n)}, 'webhook': 'https://webhook.site/d1702b5c-bf4f-4e78-91d3-0118467fe0c7'}).json()['unique_id']
    print(uid)

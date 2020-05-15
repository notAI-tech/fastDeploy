autocannon -c 1 -t 1000 -a 8192  -m POST -i 1.json -H 'Content-Type: application/json' http://localhost:6788/sync

autocannon -c 16 -t 1000 -a 8192  -m POST -i 1.json -H 'Content-Type: application/json' http://localhost:6788/sync

autocannon -c 256 -t 1000 -a 8192  -m POST -i 1.json -H 'Content-Type: application/json' http://localhost:6788/sync

autocannon -c 2048 -t 1000 -a 8192  -m POST -i 1.json -H 'Content-Type: application/json' http://localhost:6788/sync




autocannon -c 1 -t 1000 -a 256  -m POST -i 32.json -H 'Content-Type: application/json' http://localhost:6788/sync

autocannon -c 16 -t 1000 -a 256  -m POST -i 32.json -H 'Content-Type: application/json' http://localhost:6788/sync

autocannon -c 64 -t 1000 -a 256  -m POST -i 32.json -H 'Content-Type: application/json' http://localhost:6788/sync

autocannon -c 256 -t 1000 -a 256  -m POST -i 32.json -H 'Content-Type: application/json' http://localhost:6788/sync



autocannon -c 1 -t 1000 -a 64  -m POST -i 128.json -H 'Content-Type: application/json' http://localhost:6788/sync

autocannon -c 16 -t 1000 -a 64  -m POST -i 128.json -H 'Content-Type: application/json' http://localhost:6788/sync

autocannon -c 64 -t 1000 -a 64  -m POST -i 128.json -H 'Content-Type: application/json' http://localhost:6788/sync

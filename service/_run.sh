if [ ! -f "_success" ]; then
	python3 -u _setup.py
fi

if [ ! -f "_success" ]; then
	exit 1
fi

if [ -f  ".batch_size" ]; then 
    rm ".batch_size"
fi

python3 -u _loop.py&
python3 -u _manager_loop.py&

until [ -f ".batch_size" ]
do
     sleep 5
     echo 'Waiting for prediction loop to begin.'
done

python3 -u _generate_run_sh.py
chmod +x _run_utils.sh

bash _run_utils.sh

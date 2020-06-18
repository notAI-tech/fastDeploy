if [ "$UPDATE" = "true" ]; then
    python3 -m pip install pydload

    echo 'Updating _app.py'
    rm _app.py
    python3 -m pydload https://raw.githubusercontent.com/notAI-tech/fastDeploy/master/service/_app.py _app.py

    echo 'Updating _generate_run_sh.py'
    rm _generate_run_sh.py
    python3 -m pydload https://raw.githubusercontent.com/notAI-tech/fastDeploy/master/service/_generate_run_sh.py _generate_run_sh.py

    echo 'Updating _loop.py'
    rm _loop.py
    python3 -m pydload https://raw.githubusercontent.com/notAI-tech/fastDeploy/master/service/_loop.py _loop.py

    echo 'Updating _manager_loop.py'
    rm _manager_loop.py
    python3 -m pydload https://raw.githubusercontent.com/notAI-tech/fastDeploy/master/service/_manager_loop.py _manager_loop.py

    echo 'Updating _utils.py'
    rm _utils.py
    python3 -m pydload https://raw.githubusercontent.com/notAI-tech/fastDeploy/master/service/_utils.py _utils.py

fi

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

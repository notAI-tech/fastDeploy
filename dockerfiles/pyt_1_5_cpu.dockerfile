FROM python:3.6.7-slim
LABEL maintainer="Bedapudi Praneeth <praneeth@notai.tech>"
RUN apt-get update && apt-get install -y build-essential gcc
RUN python3 -m pip install --no-cache-dir --upgrade pip
RUN python3 -m pip install --no-cache-dir Cython requests gevent gunicorn
RUN python3 -m pip install --no-cache-dir --no-binary :all: falcon
RUN python3 -m pip install --no-cache-dir torch==1.5.0+cpu torchvision==0.6.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN python3 -m pip install --no-cache-dir --global-option="--pyprof" --global-option="--cpp_ext" https://github.com/NVIDIA/apex/archive/master.zip
WORKDIR /app
ADD . /app
CMD ["bash", "_run.sh"]

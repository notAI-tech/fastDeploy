FROM python:3.6.7-slim
LABEL maintainer="Bedapudi Praneeth <praneeth@notai.tech>"
RUN apt-get update && apt-get install -y build-essential gcc
RUN pip3 install Cython requests gevent gunicorn
RUN pip3 install --no-binary :all: falcon
RUN pip3 install torch==1.5.0+cpu torchvision==0.6.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN pip3 install --global-option="--pyprof" --global-option="--cpp_ext" https://github.com/NVIDIA/apex/archive/master.zip
WORKDIR /app
ADD . /app
CMD ["bash", "_run.sh"]

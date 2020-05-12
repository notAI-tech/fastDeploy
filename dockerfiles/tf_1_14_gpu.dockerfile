FROM tensorflow/tensorflow:1.14.0-gpu-py3
LABEL maintainer="Bedapudi Praneeth <praneeth@notai.tech>"
RUN apt-get update && apt-get install -y build-essential gcc
RUN python3 -m pip install Cython requests gevent gunicorn
RUN python3 -m pip install --no-binary :all: falcon
WORKDIR /app
ADD . /app
CMD ["bash", "_run.sh"]

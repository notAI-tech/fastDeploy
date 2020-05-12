FROM pytorch/pytorch:1.5-cuda10.1-cudnn7-runtime
LABEL maintainer="Bedapudi Praneeth <praneeth@notai.tech>"
RUN apt-get update && apt-get install -y build-essential gcc
RUN pip install Cython requests gevent gunicorn
RUN pip install --no-binary :all: falcon
WORKDIR /app
ADD . /app
CMD ["bash", "_run.sh"]

FROM tensorflow/tensorflow:1.14.0-gpu-py3
LABEL maintainer="Bedapudi Praneeth <praneeth@notai.tech>"
RUN python3 -m pip install --no-cache-dir --upgrade pip requests gevent gunicorn falcon
WORKDIR /app
ADD . /app
CMD ["bash", "_run.sh"]

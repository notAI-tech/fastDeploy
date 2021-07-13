FROM pytorch/pytorch:1.5-cuda10.1-cudnn7-runtime
LABEL maintainer="Bedapudi Praneeth <praneeth@notai.tech>"
RUN python3 -m pip install --no-cache-dir --upgrade pip requests gevent gunicorn falcon
WORKDIR /app
ADD . /app
CMD ["bash", "_run.sh"]

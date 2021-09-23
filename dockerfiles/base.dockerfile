FROM python:3.8-slim
LABEL maintainer="Bedapudi Praneeth <praneeth@notai.tech>"
RUN python3 -m pip install --no-cache-dir --upgrade pip requests gevent falcon diskcache ujson
WORKDIR /app
ADD . /app
CMD ["bash", "_run.sh"]

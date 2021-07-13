FROM pytorch/pytorch:1.7.1-cuda11.0-cudnn8-runtime
LABEL maintainer="Bedapudi Praneeth <praneeth@notai.tech>"
RUN python3 -m pip install --no-cache-dir --upgrade pip requests gevent gunicorn falcon
WORKDIR /app
ADD . /app
CMD ["bash", "_run.sh"]

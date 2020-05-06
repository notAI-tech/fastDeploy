docker build -t notaitech/fastdeploy:base-v0.1 -f Dockerfile-base ../service/
docker push notaitech/fastdeploy:base-v0.1

docker build -t notaitech/fastdeploy:pytorch_1.5_cpu-v0.1 -f Dockerfile-pytorch_1.5_cpu ../service/
docker push notaitech/fastdeploy:pytorch_1.5_cpu-v0.1

docker build -t notaitech/fastdeploy:pytorch_1.5_gpu-v0.1 -f Dockerfile-pytorch_1.5_gpu ../service/
docker push notaitech/fastdeploy:pytorch_1.5_gpu-v0.1

docker build -t notaitech/fastdeploy:tf_1.14_cpu-v0.1 -f Dockerfile-tf_1.14_cpu ../service/
docker push notaitech/fastdeploy:tf_1.14_cpu-v0.1

docker build -t notaitech/fastdeploy:tf_1.14_gpu-v0.1 -f Dockerfile-tf_1.14_gpu ../service/
docker push notaitech/fastdeploy:tf_1.14_gpu-v0.1

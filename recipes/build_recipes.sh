docker rmi notaitech/fastdeploy-recipe:deepsegment_en
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir deepsegment/ --verbose --base tf_1_14_cpu --extra_config '{"LANG": "en"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:deepsegment_en
docker push notaitech/fastdeploy-recipe:deepsegment_en


docker rmi notaitech/fastdeploy-recipe:deepsegment_it
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir deepsegment/ --verbose --base tf_1_14_cpu --extra_config '{"LANG": "it"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:deepsegment_it
docker push notaitech/fastdeploy-recipe:deepsegment_it


docker rmi notaitech/fastdeploy-recipe:deepsegment_fr
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir deepsegment/ --verbose --base tf_1_14_cpu --extra_config '{"LANG": "fr"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:deepsegment_fr
docker push notaitech/fastdeploy-recipe:deepsegment_fr


docker rmi notaitech/fastdeploy-recipe:nudeclassifier
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir nudeclassifier/ --verbose --base tf_1_14_cpu --extra_config '{}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:nudeclassifier
docker push notaitech/fastdeploy-recipe:nudeclassifier


docker rmi notaitech/fastdeploy-recipe:efficientnet_b2
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir efficientnet_imagenet/ --verbose --base tf_1_14_cpu --extra_config '{"B": "2", "WEIGHTS": "noisy-student"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:efficientnet_b2
docker push notaitech/fastdeploy-recipe:efficientnet_b2


docker rmi notaitech/fastdeploy-recipe:craft_text_detection
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir craft_text_detection/ --verbose --base tf_1_14_cpu --extra_config '{}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:craft_text_detection
docker push notaitech/fastdeploy-recipe:craft_text_detection



docker rmi notaitech/fastdeploy-recipe:transformer_ner
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir huggingface_transformers/ --verbose --base pyt_1_5_cpu --extra_config '{"PIPELINE": "ner"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:transformer_ner
docker push notaitech/fastdeploy-recipe:transformer_ner


docker rmi notaitech/fastdeploy-recipe:transformer_sentiment
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir huggingface_transformers/ --verbose --base pyt_1_5_cpu --extra_config '{"PIPELINE": "sentiment"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:transformer_sentiment
docker push notaitech/fastdeploy-recipe:transformer_sentiment


docker rmi notaitech/fastdeploy-recipe:transformer_summarization
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir huggingface_transformers/ --verbose --base pyt_1_5_cpu --extra_config '{"PIPELINE": "summarization"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:transformer_summarization
docker push notaitech/fastdeploy-recipe:transformer_summarization


docker rmi notaitech/fastdeploy-recipe:transformer_translation_en_to_fr
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir huggingface_transformers/ --verbose --base pyt_1_5_cpu --extra_config '{"PIPELINE": "translation_en_to_fr"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:transformer_translation_en_to_fr
docker push notaitech/fastdeploy-recipe:transformer_translation_en_to_fr


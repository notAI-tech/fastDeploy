#============================== DeepSegment =============================
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

# ======================= NudeCLassifier ===============================

docker rmi notaitech/fastdeploy-recipe:nudeclassifier
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir nudeclassifier/ --verbose --base tf_1_14_cpu --extra_config '{}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:nudeclassifier
docker push notaitech/fastdeploy-recipe:nudeclassifier

# ======================= EfficientNet ===============================

docker rmi notaitech/fastdeploy-recipe:efficientnet_b0
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir efficientnet_imagenet/ --verbose --base tf_1_14_cpu --extra_config '{"B": "0", "WEIGHTS": "noisy-student"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:efficientnet_b0
docker push notaitech/fastdeploy-recipe:efficientnet_b0


docker rmi notaitech/fastdeploy-recipe:efficientnet_b2
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir efficientnet_imagenet/ --verbose --base tf_1_14_cpu --extra_config '{"B": "2", "WEIGHTS": "noisy-student"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:efficientnet_b2
docker push notaitech/fastdeploy-recipe:efficientnet_b2


docker rmi notaitech/fastdeploy-recipe:efficientnet_b4
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir efficientnet_imagenet/ --verbose --base tf_1_14_cpu --extra_config '{"B": "4", "WEIGHTS": "noisy-student"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:efficientnet_b4
docker push notaitech/fastdeploy-recipe:efficientnet_b4

docker rmi notaitech/fastdeploy-recipe:efficientnet_b7
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir efficientnet_imagenet/ --verbose --base tf_1_14_cpu --extra_config '{"B": "7", "WEIGHTS": "noisy-student"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:efficientnet_b7
docker push notaitech/fastdeploy-recipe:efficientnet_b7


# =========================== CRAFT ========================

docker rmi notaitech/fastdeploy-recipe:craft_text_detection
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir craft_text_detection/ --verbose --base tf_1_14_cpu --extra_config '{}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:craft_text_detection
docker push notaitech/fastdeploy-recipe:craft_text_detection


# ========================== Transformers ========================

docker rmi notaitech/fastdeploy-recipe:transformer_ner
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir huggingface_transformers/ --verbose --base pyt_1_5_cpu --extra_config '{"PIPELINE": "ner"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:transformer_ner
docker push notaitech/fastdeploy-recipe:transformer_ner


docker rmi notaitech/fastdeploy-recipe:transformer_sentiment
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir huggingface_transformers/ --verbose --base pyt_1_5_cpu --extra_config '{"PIPELINE": "sentiment-analysis"}' --port 127.0.0.1:6788
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


# ======================== YAMNet ==============================

docker rmi notaitech/fastdeploy-recipe:audio_classification_yamnet
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir audio_classification_yamnet/ --verbose --base tf_2_1_cpu --extra_config '{}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:audio_classification_yamnet
docker push notaitech/fastdeploy-recipe:audio_classification_yamnet

# ====================== VOSK-API =====================================

docker rmi notaitech/fastdeploy-recipe:kaldi_vosk-en_us-small
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir kaldi_asr_vosk/ --verbose --base base-v0.1 --extra_config '{"MODEL_ZIP_URL": "http://alphacephei.com/kaldi/models/vosk-model-small-en-us-0.3.zip"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:kaldi_vosk-en_us-small
docker push notaitech/fastdeploy-recipe:kaldi_vosk-en_us-small

docker rmi notaitech/fastdeploy-recipe:kaldi_vosk-en_us-aspire
docker rm temp
python3 ../cli/fastDeploy.py --build temp --source_dir kaldi_asr_vosk/ --verbose --base base-v0.1 --extra_config '{"MODEL_ZIP_URL": "http://alphacephei.com/kaldi/models/vosk-model-en-us-aspire-0.2.zip"}' --port 127.0.0.1:6788
docker commit temp notaitech/fastdeploy-recipe:kaldi_vosk-en_us-aspire
docker push notaitech/fastdeploy-recipe:kaldi_vosk-en_us-aspire


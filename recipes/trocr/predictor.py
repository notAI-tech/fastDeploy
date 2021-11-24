from craft_text_detector import Craft

from glob import glob
import os
import pickle
from tqdm import tqdm
from PIL import Image

output_dir = "outputs/"
if not os.path.exists(output_dir):
    os.mkdir(output_dir)

craft = Craft(output_dir=output_dir, crop_type="poly", cuda=False)

from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image

trocr_processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
trocr_model = VisionEncoderDecoderModel.from_pretrained(
    "microsoft/trocr-base-handwritten"
)


def predictor(x, batch_size=1):
    print(f"{len(x)} input Images received.")
    results = []
    for _ in x:
        print(f"{len(x)} input Images received.")
        try:
            craft.detect_text(_)
            crops = sorted(
                glob(f"outputs/{os.path.splitext(os.path.basename(_))[0]}_crops/*png"),
                key=lambda x: int(x.split("crop_")[1].split(".png")[0]),
            )
            regions = [
                [int(__) for __ in _.strip().split(",")]
                for _ in open(
                    f"outputs/{os.path.splitext(os.path.basename(_))[0]}_text_detection.txt"
                ).readlines()
                if _.strip()
            ]
            texts = []
            while crops:
                texts += trocr_processor.batch_decode(
                    trocr_model.generate(
                        trocr_processor(
                            images=[Image.open(__) for __ in crops[:batch_size]],
                            return_tensors="pt",
                        ).pixel_values
                    ),
                    skip_special_tokens=True,
                )
                crops = crops[batch_size:]
        except Exception as ex:
            print(ex)
            texts = []
            regions = []

        results.append(
            [{"text": text, "poly": poly} for text, poly in zip(texts, regions)]
        )

    return results


if __name__ == "__main__":
    import sys

    print(predictor(sys.argv[1:]))

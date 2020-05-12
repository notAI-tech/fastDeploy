import torch
from PIL import Image
from torchvision import transforms

import multiprocessing

model = torch.hub.load("pytorch/vision:v0.6.0", "densenet161", pretrained=True)
model.eval()

if torch.cuda.is_available():
    input_batch = input_batch.to("cuda")
    model.to("cuda")

preprocess = transforms.Compose(
    [
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ]
)


def preprocess_image(im_path):
    try:
        image = Image.open(im_path)
        return preprocess(image)
    except Exception as ex:
        return None


def predictor(im_paths, batch_size=2):
    model.batch_size = batch_size

    with multiprocessing.Pool(processes=batch_size) as pool:
        images = pool.map(preprocess_image, im_paths)

    with torch.no_grad():
        output = model(torch.stack(images))
        output = torch.nn.functional.softmax(output, dim=1)
        torch.argmax(output, dim=1)

    return output


if __name__ == "__main__":
    print(predictor(["example.jpg", "exmaple.jpg"]))

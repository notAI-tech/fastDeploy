import os
import glob
import time
import pickle
from shlex import quote

red, green, yellow, black = (
    "\x1b[38;5;1m",
    "\x1b[38;5;2m",
    "\x1b[38;5;3m",
    "\x1b[38;5;0m",
)

setup_dir = "/to_setup_data"

current_file_names = glob.glob("/app/*")
current_file_names = {os.path.basename(f) for f in current_file_names}
current_file_names = {f for f in current_file_names if f[0] == "_"}

if os.path.exists(f"{setup_dir}"):
    for f in glob.glob(f"{setup_dir}/*"):
        f = os.path.basename(f)
        if f in current_file_names and f not in {"__pycache__"}:
            print(f"{red} file or folder name cannot be one of {current_file_names}")
            quit()

    os.system(f"cp -r {setup_dir}/* ./")
else:
    quit()

if (
    not os.path.exists("./requirements.txt")
    or not os.path.exists("./predictor.py")
    or not os.path.exists("./example.pkl")
):
    print(
        f"{red} Your folder must contain a file called requirements.txt, predictor.py and example.pkl {black}"
    )
    quit()

if os.path.exists("extras.sh"):
    print(f"{yellow }Installing Extras {black}")
    os.system("chmod +x extras.sh")
    os.system("bash extras.sh")


print(f"{yellow} STEP 1: {green} Installing requirements... {black} \n")

for line in open("requirements.txt", "r"):
    line = line.strip()
    if not line:
        continue
    if line[0] == "#":
        continue
    print(f"\t {yellow} Installing {line} {black}")
    success = not os.system(f"python3 -m pip install --no-cache-dir {line}")
    if not success:
        print(f"{red} Could not install {line} {black}\n")
        quit()

print(f"{yellow} STEP 2: {green} importing predictor {black}\n")

from predictor import predictor

print(f"{green} ALL DONE!\n")
print(f"{green} You can now commit your container using docker commit. {black} \n")

open("_success", "w").write("")

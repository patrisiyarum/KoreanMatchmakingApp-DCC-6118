import subprocess
import os
import sys
import platform
import shutil

if platform.system() == "Windows":

    print("\nChecking Windows C++ build tools...\n")

    cl = shutil.which("cl")
    cmake = shutil.which("cmake")
    nmake = shutil.which("nmake")

    if cl and cmake:
        print("✓ MSVC compiler detected.")
        print(f"  cl.exe at: {cl}")
        print(f"  cmake at: {cmake}")
    else:
        print("✗ C++ Build Tools NOT detected.\n")
        print("You must install **Visual Studio 2022** or the **Build Tools** package:")
        print(" ➤ https://visualstudio.microsoft.com/downloads/")
        print("\nInstall the following components:")
        print("   ✔ C++ x64/x86 Build Tools")
        print("   ✔ Windows SDK")
        print("   ✔ CMake tools for Windows")
        print("   ✔ MSVC toolset")
        print("\nAfter installation, restart your terminal.")
        print("\nExiting because Whisper addon cannot compile without these tools.\n")
        sys.exit(1)

repo_url = "https://github.com/ggml-org/whisper.cpp.git"

print(f"Current working directory: {os.getcwd()}")
s = ""
while s.lower() != "y" and s.lower() != "n":
    s = input("Is the current working directory the GG/Backend folder? (y/n)")

if s.lower() == "n":
    print("Please change the working directory to the correct folder. Exiting now.")
    sys.exit(1)

basedir = os.getcwd()
whisper_basedir = os.path.join(basedir, "whisper.cpp")
addon_path = os.path.join(whisper_basedir, "examples", "addon.node")
model_path = os.path.join(whisper_basedir, "models")
# model_name = "base.en"
model_name = "medium"

try:
    subprocess.run(["git", "clone", repo_url, whisper_basedir], check=True, shell=(platform.system() == "Windows"))
    print(f"Repository cloned successfully to: {whisper_basedir}")
except subprocess.CalledProcessError as e:
    print(f"Error cloning repository: {e}")
    sys.exit(1)
except FileNotFoundError:
    print("Git command not found. Ensure Git is installed and in your system's PATH.")
    sys.exit(1)

os.chdir(addon_path)
print(f"Running npm install in {addon_path}")
try:
    subprocess.run(["npm", "install"], check=True, shell=(platform.system() == "Windows"))
except subprocess.CalledProcessError as e:
    print(f"Error doing npm install: {e}")
    sys.exit(1)

os.chdir(whisper_basedir)
print(f"Running npx cmake-js compile -T addon.node -B Release in {whisper_basedir}")
try:
    subprocess.run(["npx", "cmake-js", "compile", "-T", "addon.node", "-B", "Release"], check=True, shell=(platform.system() == "Windows"))
except subprocess.CalledProcessError as e:
    print(f"Error doing npx cmake-js: {e}")
    sys.exit(1)

os.chdir(model_path)
print(f"Install model from {model_path}")
try:
    subprocess.run(["download-ggml-model.sh", model_name], check=True, shell=(platform.system() == "Windows"))
except subprocess.CalledProcessError as e:
    print(f"Error on model install: {e}")
    sys.exit(1)
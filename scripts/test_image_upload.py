#!/usr/bin/env python3
import requests
import shutil
from pathlib import Path

# Login first
login_url = "http://localhost:8000/api/auth/login/"
login_data = {"username": "admin", "password": "12341234"}
login_response = requests.post(login_url, json=login_data)
token = login_response.json()['tokens']['access']

# Copy a real PNG file
test_image = Path("test_upload.png")
shutil.copy("venv/Lib/site-packages/celery/utils/static/celery_128.png", test_image)

# Upload image with explicit content type
upload_url = "http://localhost:8000/api/users/profile/upload-image/"
headers = {"Authorization": f"Bearer {token}"}
with open(test_image, "rb") as f:
    files = {"image": (test_image.name, f, "image/png")}
    response = requests.post(upload_url, headers=headers, files=files)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Check file sizes
avatar_path = Path("media/avatars")
if avatar_path.exists():
    for f in sorted(avatar_path.glob("*")):
        print(f"File: {f.name}, Size: {f.stat().st_size} bytes")

test_image.unlink()

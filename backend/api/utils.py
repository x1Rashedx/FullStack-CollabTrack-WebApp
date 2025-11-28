import base64
import os
import uuid
from PIL import Image
from io import BytesIO

def compress_base64_image(base64_str, max_width=300, quality=70):
    # Split prefix if present
    prefix = ""
    if "," in base64_str:
        prefix, base64_str = base64_str.split(",", 1)  # keep first part as prefix

    # Decode base64
    img_data = base64.b64decode(base64_str)
    img = Image.open(BytesIO(img_data))

    # Convert to RGB for JPEG
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Resize if needed
    img.thumbnail((max_width, max_width))

    # Save to buffer as JPEG
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=quality)

    # Encode back to base64
    compressed_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    # Add the prefix back if it existed
    if prefix:
        compressed_base64 = f"{prefix},{compressed_base64}"

    return compressed_base64

def rename_file(file):
    # Get base name and extension
    name, ext = os.path.splitext(file.name)

    # Create random suffix
    random_suffix = uuid.uuid4().hex[:8]  # 8 chars

    # Build new filename
    new_name = f"{name}_{random_suffix}{ext}"

    file.name = new_name
    return file
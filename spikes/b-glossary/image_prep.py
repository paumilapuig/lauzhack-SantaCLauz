"""Shrink images before sending them to the LLM: fewer tokens, lower cost."""

import io
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

SUPPORTED_SUFFIXES = {".png", ".jpg", ".jpeg"}


@dataclass(frozen=True)
class PreparedImage:
    jpeg_bytes: bytes
    bytes_before: int
    bytes_after: int


def prepare_image(path, max_side: int = 1024, quality: int = 70) -> PreparedImage:
    """Downscale (never upscale) keeping aspect ratio, convert to grayscale JPEG."""
    path = Path(path)
    if path.suffix.lower() not in SUPPORTED_SUFFIXES:
        raise ValueError(f"Unsupported image type: {path.suffix or path.name} (use png/jpg)")

    original = path.read_bytes()
    with Image.open(io.BytesIO(original)) as opened:
        image = opened.convert("L")
    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, "JPEG", quality=quality)
    jpeg_bytes = buffer.getvalue()
    return PreparedImage(jpeg_bytes, len(original), len(jpeg_bytes))

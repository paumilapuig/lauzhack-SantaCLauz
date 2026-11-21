"""Shrink images in memory before sending them to the LLM: fewer tokens, lower cost."""

import io
import warnings

from PIL import Image, UnidentifiedImageError

from app.glossary.errors import InputError


def prepare_image(data: bytes, max_side: int = 1024, quality: int = 70) -> bytes:
    """Downscale (never upscale) keeping aspect ratio; return a grayscale JPEG."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as opened:
                image = opened.convert("L")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError,
            Image.DecompressionBombWarning) as error:
        raise InputError("Cannot read image") from error
    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    image.save(buffer, "JPEG", quality=quality)
    return buffer.getvalue()

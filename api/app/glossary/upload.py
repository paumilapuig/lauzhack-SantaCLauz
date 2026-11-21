"""Classify and normalize an uploaded file into (source_text, jpeg_images) for the prompt builder."""

from pathlib import PurePath
from typing import Literal

from app.glossary.errors import InputError, TooLarge, UnsupportedType
from app.glossary.image_prep import prepare_image
from app.glossary.pdf_input import extract

MAX_UPLOAD_BYTES = 10 * 1024 * 1024

Kind = Literal["text", "pdf", "image"]

_SUFFIX_KINDS: dict[str, Kind] = {
    ".txt": "text",
    ".pdf": "pdf",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
}
_CONTENT_TYPE_KINDS: dict[str, Kind] = {
    "text/plain": "text",
    "application/pdf": "pdf",
    "image/png": "image",
    "image/jpeg": "image",
}


def classify(filename: str, content_type: str) -> Kind:
    """Kind from the filename suffix, falling back to the content type."""
    suffix = PurePath(filename or "").suffix.lower()
    mime = (content_type or "").split(";")[0].strip().lower()
    kind = _SUFFIX_KINDS.get(suffix) or _CONTENT_TYPE_KINDS.get(mime)
    if kind is None:
        raise UnsupportedType(f"Unsupported file type: {filename or content_type}")
    return kind


def normalize_upload(filename: str, content_type: str, data: bytes) -> tuple[str, list[bytes]]:
    """Return (source_text, jpeg_images) ready for `build_messages`."""
    if len(data) > MAX_UPLOAD_BYTES:
        raise TooLarge(f"File exceeds {MAX_UPLOAD_BYTES} bytes")
    kind = classify(filename, content_type)
    if not data.strip():
        raise InputError("Empty file")
    if kind == "pdf":
        return extract(data)
    if kind == "image":
        return "", [prepare_image(data)]
    return _decode_text(data), []


def _decode_text(data: bytes) -> str:
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError as error:
        raise InputError("Text file is not valid UTF-8") from error

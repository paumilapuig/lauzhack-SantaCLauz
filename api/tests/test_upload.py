import io

import pymupdf
import pytest
from PIL import Image

from app.glossary.errors import InputError, TooLarge, UnsupportedType
from app.glossary.upload import MAX_UPLOAD_BYTES, classify, normalize_upload


def _png(size=(2000, 1000)) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", size, "white").save(buffer, "PNG")
    return buffer.getvalue()


@pytest.mark.parametrize(
    ("filename", "content_type", "kind"),
    [
        ("a.txt", "text/plain", "text"),
        ("a.PDF", "application/octet-stream", "pdf"),
        ("a", "application/pdf", "pdf"),
        ("photo.jpeg", "", "image"),
        ("x.bin", "image/png", "image"),
    ],
)
def test_classify(filename, content_type, kind):
    assert classify(filename, content_type) == kind


def test_classify_unsupported():
    with pytest.raises(UnsupportedType):
        classify("a.docx", "application/msword")


def test_text_upload():
    text, images = normalize_upload("a.txt", "text/plain", "Bonjour la classe".encode())
    assert text == "Bonjour la classe"
    assert images == []


def test_image_upload_is_prepared_jpeg():
    text, images = normalize_upload("a.png", "image/png", _png())
    assert text == ""
    with Image.open(io.BytesIO(images[0])) as image:
        assert image.format == "JPEG"
        assert max(image.size) == 1024


def test_pdf_upload():
    document = pymupdf.open()
    document.new_page().insert_text((72, 72), "Bonjour la classe\n" * 20)
    text, images = normalize_upload("a.pdf", "application/pdf", document.tobytes())
    assert "Bonjour" in text
    assert images == []


def test_too_large():
    with pytest.raises(TooLarge):
        normalize_upload("a.txt", "text/plain", b"x" * (MAX_UPLOAD_BYTES + 1))


@pytest.mark.parametrize("data", [b"", b"   \n"])
def test_empty_text_or_file(data):
    with pytest.raises(InputError):
        normalize_upload("a.txt", "text/plain", data)


def test_unreadable_image():
    with pytest.raises(InputError):
        normalize_upload("a.png", "image/png", b"garbage")


def test_non_utf8_text():
    with pytest.raises(InputError):
        normalize_upload("a.txt", "text/plain", b"\xff\xfe\x00bad")

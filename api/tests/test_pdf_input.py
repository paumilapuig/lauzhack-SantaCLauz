import io

import pymupdf
import pytest
from PIL import Image

from app.glossary.errors import InputError
from app.glossary.pdf_input import extract


def _pdf(pages_text: list[str]) -> bytes:
    document = pymupdf.open()
    for text in pages_text:
        page = document.new_page()
        if text:
            page.insert_text((72, 72), text)
    return document.tobytes()


def test_text_pdf_returns_text_and_no_images():
    text, images = extract(_pdf(["La respiration cellulaire\n" * 20]))
    assert "respiration" in text
    assert images == []


def test_near_empty_pdf_renders_at_most_five_prepared_jpeg_pages():
    text, images = extract(_pdf(["", "", "", "", "", "", ""]))
    assert len(images) == 5
    with Image.open(io.BytesIO(images[0])) as image:
        assert image.format == "JPEG"
        assert image.mode == "L"
        assert max(image.size) <= 1024


def test_garbage_bytes_raise_input_error():
    with pytest.raises(InputError):
        extract(b"not a pdf at all")

import io

import pymupdf
import httpx
import pytest
from PIL import Image

import cache
from generate_glossary import generate
from image_prep import prepare_image_bytes
from pdf_input import describe, lesson_inputs, load_pdf
from test_generate_glossary import _client

LONG_TEXT = "La respiration cellulaire libère de l'énergie dans les mitochondries. " * 5


def _text_pdf(path, text=LONG_TEXT):
    document = pymupdf.open()
    document.new_page().insert_textbox(pymupdf.Rect(40, 40, 550, 800), text)
    document.save(path)
    return path


def _scanned_pdf(path, pages=1):
    buffer = io.BytesIO()
    Image.effect_noise((200, 200), 80).convert("RGB").save(buffer, "PNG")
    document = pymupdf.open()
    for _ in range(pages):
        document.new_page().insert_image(pymupdf.Rect(40, 40, 400, 400), stream=buffer.getvalue())
    document.save(path)
    return path


def test_text_pdf_is_used_as_text_only(tmp_path):
    content = load_pdf(_text_pdf(tmp_path / "t.pdf"))
    assert content.used_vision is False
    assert content.page_images == []
    assert "mitochondries" in content.text
    assert content.pages_total == 1


def test_scanned_pdf_is_rendered_to_png_pages(tmp_path):
    content = load_pdf(_scanned_pdf(tmp_path / "s.pdf", pages=2))
    assert content.used_vision is True
    assert len(content.page_images) == 2
    assert content.page_images[0].startswith(b"\x89PNG")


def test_scanned_pdf_is_capped_at_max_pages(tmp_path):
    content = load_pdf(_scanned_pdf(tmp_path / "s.pdf", pages=6))
    assert len(content.page_images) == 5
    assert content.pages_total == 6


def test_non_pdf_suffix_is_rejected(tmp_path):
    path = tmp_path / "lesson.txt"
    path.write_text("hello")
    with pytest.raises(ValueError, match="pdf"):
        load_pdf(path)


def test_corrupt_pdf_is_rejected(tmp_path):
    path = tmp_path / "bad.pdf"
    path.write_bytes(b"not a pdf at all")
    with pytest.raises(ValueError, match="PDF"):
        load_pdf(path)


def _image_parts(request: httpx.Request) -> list:
    import json

    parts = json.loads(request.content)["messages"][1]["content"]
    return [part for part in parts if part["type"] == "image_url"]


def _generate_from_pdf(tmp_path, pdf_path):
    http, calls = _client()
    text, blobs = lesson_inputs("", load_pdf(pdf_path))
    generate(text, [], "m", "key", http=http, cache_dir=tmp_path / "cache", image_blobs=blobs)
    return calls[0]


def test_generate_with_text_pdf_sends_no_images(tmp_path):
    request = _generate_from_pdf(tmp_path, _text_pdf(tmp_path / "t.pdf"))
    assert _image_parts(request) == []


def test_generate_with_scanned_pdf_sends_images(tmp_path):
    request = _generate_from_pdf(tmp_path, _scanned_pdf(tmp_path / "s.pdf", pages=2))
    assert len(_image_parts(request)) == 2


def test_cache_key_differs_for_different_blobs():
    assert cache.cache_key("m", "v1", "t", [b"a"]) != cache.cache_key("m", "v1", "t", [b"b"])


def test_prepare_image_bytes_matches_file_behaviour(tmp_path):
    buffer = io.BytesIO()
    Image.effect_noise((2000, 1000), 80).convert("RGB").save(buffer, "PNG")
    prepared = prepare_image_bytes(buffer.getvalue())
    assert prepared.bytes_before == len(buffer.getvalue())
    assert max(Image.open(io.BytesIO(prepared.jpeg_bytes)).size) == 1024


def test_describe_says_text_or_images(tmp_path):
    assert "as text" in describe(load_pdf(_text_pdf(tmp_path / "t.pdf")))
    assert "2 page images" in describe(load_pdf(_scanned_pdf(tmp_path / "s.pdf", pages=2)))

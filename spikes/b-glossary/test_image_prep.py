import io

import pytest
from PIL import Image

from image_prep import prepare_image


def _save_noisy_png(path, size):
    image = Image.effect_noise(size, 80).convert("RGB")
    image.save(path, "PNG")


def test_large_png_is_downscaled_grayscale_jpeg(tmp_path):
    source = tmp_path / "big.png"
    _save_noisy_png(source, (3000, 2000))

    prepared = prepare_image(source)

    output = Image.open(io.BytesIO(prepared.jpeg_bytes))
    assert max(output.size) == 1024
    assert output.size == (1024, 683) or output.size == (1024, 682)
    assert output.mode == "L"
    assert prepared.jpeg_bytes[:3] == b"\xff\xd8\xff"
    assert prepared.bytes_after == len(prepared.jpeg_bytes)
    assert prepared.bytes_after < prepared.bytes_before


def test_small_image_is_not_upscaled(tmp_path):
    source = tmp_path / "small.jpg"
    Image.new("RGB", (200, 100), "red").save(source, "JPEG")

    prepared = prepare_image(source)

    assert Image.open(io.BytesIO(prepared.jpeg_bytes)).size == (200, 100)


def test_pdf_is_rejected(tmp_path):
    source = tmp_path / "doc.pdf"
    source.write_bytes(b"%PDF-1.4")

    with pytest.raises(ValueError):
        prepare_image(source)

import base64

import pytest

from app.glossary.prompt import build_messages


def test_build_messages_text_then_image_data_urls():
    messages = build_messages("texte", [b"\xff\xd8jpeg"])

    assert messages[0]["role"] == "system"
    assert "JSON" in messages[0]["content"]
    parts = messages[1]["content"]
    assert [p["type"] for p in parts] == ["text", "image_url"]
    url = parts[1]["image_url"]["url"]
    assert base64.b64decode(url.removeprefix("data:image/jpeg;base64,")) == b"\xff\xd8jpeg"


def test_build_messages_images_only_has_no_text_part():
    messages = build_messages("  ", [b"\xff\xd8jpeg"])

    assert [p["type"] for p in messages[1]["content"]] == ["image_url"]


def test_build_messages_rejects_empty_input():
    with pytest.raises(ValueError):
        build_messages("  ", [])

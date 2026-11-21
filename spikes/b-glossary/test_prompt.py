import base64

import pytest
from PIL import Image

from prompt import PROMPT_VERSION, build_messages


@pytest.fixture
def image_paths(tmp_path):
    paths = []
    for index in range(2):
        path = tmp_path / f"page{index}.png"
        Image.new("RGB", (2000, 1000), "white").save(path)
        paths.append(path)
    return paths


def user_parts(messages):
    user = [m for m in messages if m["role"] == "user"][0]
    return user["content"]


def test_text_only_gives_one_text_part():
    messages, prepared = build_messages("La respiration est vitale.", [])
    parts = user_parts(messages)
    assert len(parts) == 1
    assert parts[0] == {"type": "text", "text": "La respiration est vitale."}
    assert prepared == []


def test_two_images_give_two_jpeg_data_urls(image_paths):
    messages, prepared = build_messages("", image_paths)
    parts = user_parts(messages)
    assert [p["type"] for p in parts] == ["image_url", "image_url"]
    prefix = "data:image/jpeg;base64,"
    for part, image in zip(parts, prepared):
        url = part["image_url"]["url"]
        assert url.startswith(prefix)
        assert base64.b64decode(url[len(prefix):]) == image.jpeg_bytes


def test_text_and_images_put_text_first(image_paths):
    messages, _ = build_messages("texte", image_paths[:1])
    assert [p["type"] for p in user_parts(messages)] == ["text", "image_url"]


def test_empty_input_raises():
    with pytest.raises(ValueError):
        build_messages("  ", [])


def test_system_prompt_demands_json():
    messages, _ = build_messages("texte", [])
    system = messages[0]
    assert system["role"] == "system"
    assert "JSON" in system["content"]


def test_prompt_version_is_set():
    assert PROMPT_VERSION

import json

import httpx
import pytest

from scripts import smoke_lessons


def client(handler) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_sign_in_uses_password_grant_and_returns_token():
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(200, json={"access_token": "jwt-123"})

    token = smoke_lessons.sign_in(client(handler), "https://x.supabase.co", "pk", "a@b.c", "pw")

    assert token == "jwt-123"
    assert seen[0].url.path == "/auth/v1/token"
    assert seen[0].url.params["grant_type"] == "password"
    assert seen[0].headers["apikey"] == "pk"
    assert json.loads(seen[0].content) == {"email": "a@b.c", "password": "pw"}


def test_sign_in_failure_exits_without_echoing_password():
    with pytest.raises(SystemExit) as error:
        smoke_lessons.sign_in(client(lambda r: httpx.Response(400)), "https://x", "pk", "a@b.c", "secret-pw")

    assert "secret-pw" not in str(error.value)


def test_post_lesson_json_sends_demo_text_with_bearer():
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(200, json={})

    smoke_lessons.post_lesson(client(handler), "http://api", "jwt", None)

    body = json.loads(seen[0].content)
    assert seen[0].headers["Authorization"] == "Bearer jwt"
    assert "respiration" in body["source_text"].lower()


def test_post_lesson_with_file_is_multipart(tmp_path):
    photo = tmp_path / "page.png"
    photo.write_bytes(b"\x89PNG fake")
    seen = []

    def handler(request):
        seen.append(request)
        return httpx.Response(200, json={})

    smoke_lessons.post_lesson(client(handler), "http://api", "jwt", photo)

    assert seen[0].headers["content-type"].startswith("multipart/form-data")
    assert b'filename="page.png"' in seen[0].content

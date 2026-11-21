import json

import httpx
import pytest

from openrouter_client import call_openrouter

USAGE = {"prompt_tokens": 120, "completion_tokens": 30, "cost": 0.0004}


def make_client(status: int, body: dict, seen: list):
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(status, json=body)

    return httpx.Client(transport=httpx.MockTransport(handler))


def ok_body() -> dict:
    return {"choices": [{"message": {"content": '{"terms": []}'}}], "usage": USAGE}


def test_request_url_header_and_body():
    seen: list = []
    messages = [{"role": "user", "content": "hola"}]
    call_openrouter(messages, "some/model", "sk-test", http=make_client(200, ok_body(), seen))

    request = seen[0]
    assert str(request.url) == "https://openrouter.ai/api/v1/chat/completions"
    assert request.headers["Authorization"] == "Bearer sk-test"
    body = json.loads(request.content)
    assert body["model"] == "some/model"
    assert body["messages"] == messages
    assert body["response_format"] == {"type": "json_object"}
    assert body["usage"] == {"include": True}


def test_returns_content_and_usage_with_cost():
    content, usage = call_openrouter([], "m", "k", http=make_client(200, ok_body(), []))

    assert content == '{"terms": []}'
    assert usage["cost"] == 0.0004
    assert usage["prompt_tokens"] == 120


def test_non_2xx_raises_runtime_error_with_status_and_excerpt():
    client = make_client(401, {"error": "bad key"}, [])

    with pytest.raises(RuntimeError, match="401.*bad key"):
        call_openrouter([], "m", "k", http=client)

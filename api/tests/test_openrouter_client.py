import json

import httpx
import pytest

from app.glossary.openrouter_client import OpenRouterError, call_openrouter

USAGE = {"prompt_tokens": 120, "completion_tokens": 30, "cost": 0.0004}


def make_client(status: int, body: dict, seen: list) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(status, json=body)

    return httpx.Client(transport=httpx.MockTransport(handler))


def ok_body() -> dict:
    return {"choices": [{"message": {"content": '{"terms": []}'}}], "usage": USAGE}


def test_one_post_with_url_auth_model_and_image_parts():
    seen: list = []
    image = {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,AAAA"}}
    messages = [{"role": "user", "content": [image]}]

    call_openrouter(messages, "some/model", "sk-test", http=make_client(200, ok_body(), seen))

    assert len(seen) == 1
    request = seen[0]
    assert request.method == "POST"
    assert str(request.url) == "https://openrouter.ai/api/v1/chat/completions"
    assert request.headers["Authorization"] == "Bearer sk-test"
    body = json.loads(request.content)
    assert body["model"] == "some/model"
    assert body["messages"][0]["content"] == [image]
    assert body["response_format"] == {"type": "json_object"}
    assert body["usage"] == {"include": True}
    assert body["provider"] == {"require_parameters": True}  # only providers that honour JSON mode


def test_returns_content_and_usage_with_cost():
    content, usage = call_openrouter([], "m", "k", http=make_client(200, ok_body(), []))

    assert content == '{"terms": []}'
    assert usage["cost"] == 0.0004


def test_non_2xx_raises_with_status_and_excerpt():
    with pytest.raises(OpenRouterError, match="401.*bad key"):
        call_openrouter([], "m", "k", http=make_client(401, {"error": "bad key"}, []))


def test_injected_client_is_left_open():
    client = make_client(200, ok_body(), [])

    call_openrouter([], "m", "k", http=client)

    assert client.is_closed is False


def make_raw_client(response: httpx.Response) -> httpx.Client:
    return httpx.Client(transport=httpx.MockTransport(lambda request: response))


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(200, json={"usage": USAGE}),
        httpx.Response(200, json={"error": {"message": "rate limited"}}),
        httpx.Response(200, json={"choices": []}),
        httpx.Response(200, text="<html>oops</html>"),
        httpx.Response(200, json={"choices": [{"message": {"content": None}}]}),
        httpx.Response(200, json={"choices": [{"message": {"content": ""}}]}),
        httpx.Response(200, json=["not", "an", "object"]),
    ],
)
def test_malformed_2xx_raises_openrouter_error(response):
    with pytest.raises(OpenRouterError):
        call_openrouter([], "m", "k", http=make_raw_client(response))

import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
TIMEOUT_SECONDS = 120
ERROR_EXCERPT_CHARS = 300


class OpenRouterError(RuntimeError):
    pass


def call_openrouter(
    messages: list[dict],
    model: str,
    api_key: str,
    http: httpx.Client | None = None,
) -> tuple[str, dict]:
    """One chat completion in JSON mode. Returns (message content, usage incl. cost)."""
    payload = {
        "model": model,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "usage": {"include": True},
        "provider": {"require_parameters": True},
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    if http is not None:
        return _post(http, payload, headers)
    with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
        return _post(client, payload, headers)


def _post(client: httpx.Client, payload: dict, headers: dict) -> tuple[str, dict]:
    response = client.post(OPENROUTER_URL, json=payload, headers=headers)
    if response.status_code // 100 != 2:
        excerpt = response.text[:ERROR_EXCERPT_CHARS]
        raise OpenRouterError(f"OpenRouter error {response.status_code}: {excerpt}")
    return _extract_content_and_usage(response)


def _extract_content_and_usage(response: httpx.Response) -> tuple[str, dict]:
    try:
        data = response.json()
    except ValueError as error:
        raise OpenRouterError("OpenRouter returned a non-JSON body") from error
    if not isinstance(data, dict):
        raise OpenRouterError("OpenRouter returned an unexpected JSON body")
    if "error" in data:
        raise OpenRouterError(f"OpenRouter returned an error: {str(data['error'])[:ERROR_EXCERPT_CHARS]}")
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise OpenRouterError("OpenRouter response has no choices[0].message.content") from error
    if not isinstance(content, str) or not content.strip():
        raise OpenRouterError("OpenRouter returned empty message content")
    return content, data.get("usage") or {}

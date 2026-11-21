import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
TIMEOUT_SECONDS = 120
ERROR_EXCERPT_CHARS = 300


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
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    client = http or httpx.Client(timeout=TIMEOUT_SECONDS)
    response = client.post(OPENROUTER_URL, json=payload, headers=headers)
    if response.status_code // 100 != 2:
        excerpt = response.text[:ERROR_EXCERPT_CHARS]
        raise RuntimeError(f"OpenRouter error {response.status_code}: {excerpt}")
    data = response.json()
    return data["choices"][0]["message"]["content"], data.get("usage", {})

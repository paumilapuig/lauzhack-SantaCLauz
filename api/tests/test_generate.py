import json
import logging

import httpx
import pytest

from app.glossary.generate import generate_glossary
from app.glossary.openrouter_client import OpenRouterError
from app.glossary.parser import GlossaryParseError

USAGE = {"prompt_tokens": 120, "completion_tokens": 30, "cost": 0.0004}
TERM = {
    "lemma": "cellule",
    "forms": ["cellule"],
    "translation_es": "célula",
    "definition_fr": "Petite partie vivante.",
    "transparent": True,
    "key_phrase": "La cellule respire.",
}


def make_client(content: str, seen: list) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}], "usage": USAGE})

    return httpx.Client(transport=httpx.MockTransport(handler))


def valid_content() -> str:
    return json.dumps({"terms": [TERM], "key_phrases": []})


def test_one_request_returns_result_and_metrics():
    seen: list = []

    result, metrics = generate_glossary("texte", [b"jpeg"], "m/x", "sk-secret", http=make_client(valid_content(), seen))

    assert len(seen) == 1
    assert [t.lemma for t in result.terms] == ["cellule"]
    assert metrics.prompt_tokens == 120
    assert metrics.completion_tokens == 30
    assert metrics.cost_usd == 0.0004
    assert metrics.overrides == 0
    assert metrics.dropped_terms == 0
    assert metrics.seconds >= 0


def test_logs_one_info_line_without_api_key(caplog):
    with caplog.at_level(logging.INFO, logger="app.glossary.generate"):
        generate_glossary("texte", (), "m/x", "sk-secret", http=make_client(valid_content(), []))

    records = [r for r in caplog.records if r.name == "app.glossary.generate"]
    assert len(records) == 1
    assert "sk-secret" not in records[0].getMessage()
    assert "prompt_tokens=120" in records[0].getMessage()


def test_invalid_content_raises_parse_error_after_one_request():
    seen: list = []

    with pytest.raises(GlossaryParseError):
        generate_glossary("texte", (), "m/x", "k", http=make_client("not json", seen))

    assert len(seen) == 1


def test_http_error_propagates_as_openrouter_error():
    client = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(500, text="boom")))

    with pytest.raises(OpenRouterError):
        generate_glossary("texte", (), "m/x", "k", http=client)

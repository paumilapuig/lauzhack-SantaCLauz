import json
import logging

import httpx
import pytest

from app.glossary.openrouter_client import OpenRouterError
from app.glossary.schema import GlossaryTerm
from app.lost_concepts import LostConcept, LostConceptsParseError, LostContext, summarize_lost_contexts
from app.lost_concepts.summarize import Metrics

USAGE = {"prompt_tokens": 120, "completion_tokens": 30, "cost": 0.0004}
GLOSSARY = [
    GlossaryTerm(
        lemma="cellule",
        forms=["cellule"],
        translation_es="célula",
        definition_fr="Petite partie vivante.",
        transparent=True,
        key_phrase="La cellule respire.",
    )
]
CONTEXTS = [LostContext(event_id=f"e{i}", t_sec=i * 60, transcript=f"La cellule {i}.") for i in (1, 2, 3)]


def make_client(content: str, seen: list) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}], "usage": USAGE})

    return httpx.Client(transport=httpx.MockTransport(handler))


def valid_content() -> str:
    concepts = [
        {"event_id": f"e{i}", "concept_fr": "La cellule respire.", "explanation_es": "La célula respira.", "lemmas": ["Cellule"]}
        for i in (1, 2, 3)
    ]
    return json.dumps({"concepts": concepts})


def test_three_contexts_make_one_request_and_return_three_concepts():
    seen: list = []

    concepts, metrics = summarize_lost_contexts(CONTEXTS, GLOSSARY, "m/x", "sk-secret", http=make_client(valid_content(), seen))

    assert len(seen) == 1
    assert [c.event_id for c in concepts] == ["e1", "e2", "e3"]
    assert all(isinstance(c, LostConcept) and c.lemmas == ["cellule"] for c in concepts)
    assert metrics.dropped_items == 0


def test_metrics_come_from_usage():
    _, metrics = summarize_lost_contexts(CONTEXTS, GLOSSARY, "m/x", "k", http=make_client(valid_content(), []))

    assert metrics.prompt_tokens == 120
    assert metrics.completion_tokens == 30
    assert metrics.cost_usd == 0.0004
    assert metrics.seconds >= 0


def test_empty_contexts_make_no_request():
    seen: list = []

    concepts, metrics = summarize_lost_contexts([], GLOSSARY, "m/x", "k", http=make_client(valid_content(), seen))

    assert seen == []
    assert concepts == []
    assert metrics == Metrics(0, 0, 0, 0.0, 0)


def test_http_error_propagates_as_openrouter_error():
    client = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(500, text="boom")))

    with pytest.raises(OpenRouterError):
        summarize_lost_contexts(CONTEXTS, GLOSSARY, "m/x", "k", http=client)


def test_invalid_content_raises_parse_error_after_one_request():
    seen: list = []

    with pytest.raises(LostConceptsParseError):
        summarize_lost_contexts(CONTEXTS, GLOSSARY, "m/x", "k", http=make_client("not json", seen))

    assert len(seen) == 1


def test_logs_one_info_line_without_api_key(caplog):
    with caplog.at_level(logging.INFO, logger="app.lost_concepts.summarize"):
        summarize_lost_contexts(CONTEXTS, GLOSSARY, "m/x", "sk-secret", http=make_client(valid_content(), []))

    records = [r for r in caplog.records if r.name == "app.lost_concepts.summarize"]
    assert len(records) == 1
    assert "sk-secret" not in records[0].getMessage()
    assert "prompt_tokens=120" in records[0].getMessage()

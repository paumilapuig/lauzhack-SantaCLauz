import json

import httpx
import pytest

from app.glossary.openrouter_client import OpenRouterError
from app.lost_concepts import ConceptGap, LostConceptsParseError, LostMoment, summarize_session

USAGE = {"prompt_tokens": 120, "completion_tokens": 30, "cost": 0.0004}
LEMMAS = ["cellule"]
MOMENTS = [LostMoment(n=i, t_sec=i * 60.0, transcript=f"La cellule {i}.") for i in (1, 2, 3, 4)]


def valid_content() -> str:
    step = {"fr": "La cellule respire.", "es": "La célula respira.", "visual": "🫁 → 🔋"}
    exercise = {"question": "Qui respire ?", "options": ["la cellule", "la pierre"], "answer": 0}
    concept = {"concept": "La respiration", "moments": [1, 4], "lemmas": ["Cellule"],
               "explanation": [step, step, step], "exercises": [exercise, exercise]}
    return json.dumps({"concepts": [concept]})


def make_client(seen: list, content: str = "", status: int = 200) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        if status != 200:
            return httpx.Response(status, text="upstream down")
        return httpx.Response(200, json={"choices": [{"message": {"content": content}}], "usage": USAGE})

    return httpx.Client(transport=httpx.MockTransport(handler))


def test_four_moments_make_exactly_one_request():
    seen: list = []

    gaps, metrics = summarize_session(MOMENTS, LEMMAS, "m/x", "sk-secret", http=make_client(seen, valid_content()))

    assert len(seen) == 1
    assert len(gaps) == 1 and isinstance(gaps[0], ConceptGap)
    assert gaps[0].minutes == [1, 4]
    assert gaps[0].lemmas == ["cellule"]
    assert metrics.dropped_items == 0


def test_no_moments_make_no_request():
    seen: list = []

    gaps, metrics = summarize_session([], LEMMAS, "m/x", "k", http=make_client(seen, valid_content()))

    assert seen == []
    assert gaps == []
    assert metrics.cost_usd == 0.0


def test_metrics_come_from_usage():
    _, metrics = summarize_session(MOMENTS, LEMMAS, "m/x", "k", http=make_client([], valid_content()))

    assert (metrics.prompt_tokens, metrics.completion_tokens, metrics.cost_usd) == (120, 30, 0.0004)
    assert metrics.seconds >= 0


def test_http_error_raises_openrouter_error():
    with pytest.raises(OpenRouterError):
        summarize_session(MOMENTS, LEMMAS, "m/x", "k", http=make_client([], status=500))


def test_unreadable_reply_raises_parse_error():
    with pytest.raises(LostConceptsParseError):
        summarize_session(MOMENTS, LEMMAS, "m/x", "k", http=make_client([], "not json"))


def test_the_api_key_is_never_logged(caplog):
    caplog.set_level("INFO")

    summarize_session(MOMENTS, LEMMAS, "m/x", "sk-secret", http=make_client([], valid_content()))

    assert "sk-secret" not in caplog.text

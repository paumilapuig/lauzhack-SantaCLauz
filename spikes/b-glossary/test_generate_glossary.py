import json
from pathlib import Path

import httpx
import pytest

import cli
from generate_glossary import compare_with_reference, generate

FIXTURE = Path(__file__).parent / "fixtures" / "fake_llm_response.json"
LESSON_TEXT = "Aujourd'hui, on parle de la respiration cellulaire."


def _fake_response() -> dict:
    fake = json.loads(FIXTURE.read_text(encoding="utf-8"))
    return {
        "choices": [{"message": {"content": fake["content"]}}],
        "usage": fake["usage"],
    }


def _client(content_override: str | None = None) -> tuple[httpx.Client, list[httpx.Request]]:
    calls: list[httpx.Request] = []
    body = _fake_response()
    if content_override is not None:
        body["choices"][0]["message"]["content"] = content_override

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(200, json=body)

    return httpx.Client(transport=httpx.MockTransport(handler)), calls


def _generate(tmp_path, http, text=LESSON_TEXT, image_paths=()):
    return generate(text, list(image_paths), "m", "key", http=http, cache_dir=tmp_path)


def test_fenced_fixture_parses(tmp_path):
    http, _ = _client()
    result, _ = _generate(tmp_path, http)
    assert len(result.terms) == 15
    assert len(result.key_phrases) == 6


def test_transparent_is_overridden_by_rule(tmp_path):
    http, _ = _client()
    result, _ = _generate(tmp_path, http)
    assert sum(term.transparent for term in result.terms) == 8


def test_garbage_raises_value_error(tmp_path):
    http, _ = _client("this is not json")
    with pytest.raises(ValueError, match="LLM returned invalid glossary"):
        _generate(tmp_path, http)


def test_schema_violation_raises_value_error(tmp_path):
    http, _ = _client('{"terms": [], "key_phrases": []}')
    with pytest.raises(ValueError, match="LLM returned invalid glossary"):
        _generate(tmp_path, http)


def test_metrics_come_from_usage(tmp_path):
    http, _ = _client()
    _, metrics = _generate(tmp_path, http)
    assert (metrics.prompt_tokens, metrics.completion_tokens) == (1200, 800)
    assert metrics.cost_usd == 0.0004
    assert metrics.cached is False
    assert metrics.seconds >= 0


def test_image_sizes_are_reported(tmp_path):
    from PIL import Image

    path = tmp_path / "page.png"
    Image.new("RGB", (3000, 2000), "white").save(path)
    http, _ = _client()
    _, metrics = _generate(tmp_path, http, text="", image_paths=[path])
    assert metrics.image_bytes_before == path.stat().st_size
    assert 0 < metrics.image_bytes_after


def test_second_call_hits_cache(tmp_path):
    http, calls = _client()
    first, _ = _generate(tmp_path, http)
    second, metrics = _generate(tmp_path, http)
    assert len(calls) == 1
    assert metrics.cached is True
    assert metrics.cost_usd == 0
    assert second == first


def test_comparison_with_reference(tmp_path, reference_terms):
    http, _ = _client()
    result, _ = _generate(tmp_path, http)
    comparison = compare_with_reference(result, reference_terms)
    assert len(comparison["matched"]) == 15
    assert comparison["missing"] == [] and comparison["extra"] == []
    assert comparison["reference_transparent_mismatches"] == []


def test_comparison_reports_missing_extra_and_mismatch(tmp_path, reference_terms):
    http, _ = _client()
    result, _ = _generate(tmp_path, http)
    altered = [dict(term) for term in reference_terms[1:]]
    altered[0]["lemma"] = "inventé"
    altered[1]["transparent"] = not altered[1]["transparent"]
    comparison = compare_with_reference(result, altered)
    assert reference_terms[0]["lemma"] in comparison["extra"]
    assert "inventé" in comparison["missing"]
    assert comparison["reference_transparent_mismatches"] == [altered[1]["lemma"]]


def test_cli_without_api_key_exits(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(SystemExit) as exit_info:
        cli.main(["--text", str(FIXTURE)])
    assert "OPENROUTER_API_KEY" in str(exit_info.value)


def test_metrics_count_llm_flags_overridden_by_rule(tmp_path):
    http, _ = _client()
    _, metrics = _generate(tmp_path, http)
    assert metrics.llm_flag_overrides == 7

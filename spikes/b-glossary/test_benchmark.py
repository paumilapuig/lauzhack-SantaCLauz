import json
from pathlib import Path

import httpx

import benchmark

FIXTURE = Path(__file__).parent / "fixtures" / "fake_llm_response.json"


def _client(garbage_model: str | None = None) -> tuple[httpx.Client, list[str]]:
    fake = json.loads(FIXTURE.read_text(encoding="utf-8"))
    called: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        model = json.loads(request.content)["model"]
        called.append(model)
        content = "not json" if model == garbage_model else fake["content"]
        body = {"choices": [{"message": {"content": content}}], "usage": fake["usage"]}
        return httpx.Response(200, json=body)

    return httpx.Client(transport=httpx.MockTransport(handler)), called


def test_one_row_per_model_in_order(reference_terms):
    http, called = _client()
    rows = benchmark.run_benchmark(["a", "b"], "Texte.", [], "key", http=http)
    assert [row.model for row in rows] == ["a", "b"]
    assert all(row.error is None and row.matched > 0 for row in rows)
    assert all(row.llm_flag_overrides == 7 for row in rows)
    assert called == ["a", "b"]


def test_every_model_is_really_called_even_with_same_input():
    http, called = _client()
    benchmark.run_benchmark(["a", "a"], "Texte.", [], "key", http=http)
    assert called == ["a", "a"]


def test_failing_model_gives_error_row_and_run_continues():
    http, _ = _client(garbage_model="bad")
    rows = benchmark.run_benchmark(["bad", "good"], "Texte.", [], "key", http=http)
    assert rows[0].error and "invalid glossary" in rows[0].error
    assert rows[1].error is None


def test_table_has_header_and_one_line_per_row():
    http, _ = _client(garbage_model="bad")
    rows = benchmark.run_benchmark(["bad", "good"], "Texte.", [], "key", http=http)
    lines = benchmark.format_table(rows).splitlines()
    assert len(lines) == 2 + 2
    assert lines[0].startswith("| model")
    assert "ERROR" in lines[2]

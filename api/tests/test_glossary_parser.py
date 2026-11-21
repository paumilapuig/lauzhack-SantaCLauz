import base64
import json

import pytest

from app.glossary.parser import GlossaryParseError, parse_glossary
from app.glossary.prompt import build_messages


def make_term(**overrides) -> dict:
    term = {
        "lemma": "cellule",
        "forms": ["cellule", "cellules"],
        "translation_es": "célula",
        "definition_fr": "Plus petite partie vivante.",
        "transparent": True,
        "key_phrase": "Chaque cellule a besoin d'énergie.",
    }
    return {**term, **overrides}


def make_reply(terms: list[dict], phrases: int = 5) -> str:
    key_phrases = [{"text": f"Phrase {i}.", "lemmas": ["cellule"]} for i in range(phrases)]
    return json.dumps({"terms": terms, "key_phrases": key_phrases})


def test_valid_reply_is_parsed_with_zero_overrides():
    result, overrides = parse_glossary(make_reply([make_term()]))

    assert [t.lemma for t in result.terms] == ["cellule"]
    assert overrides == 0


def test_fenced_json_is_accepted():
    result, _ = parse_glossary("```json\n" + make_reply([make_term()]) + "\n```")

    assert len(result.terms) == 1


def test_duplicate_lemmas_are_deduped_keeping_first():
    first = make_term(definition_fr="première")
    second = make_term(definition_fr="seconde", lemma="Cellule", forms=["cellule"])

    result, _ = parse_glossary(make_reply([first, second]))

    assert [t.definition_fr for t in result.terms] == ["première"]


def test_transparency_rule_overrides_llm_flag_and_counts_it():
    term = make_term(lemma="maison", forms=["maison"], translation_es="casa", transparent=True)

    result, overrides = parse_glossary(make_reply([term]))

    assert result.terms[0].transparent is False
    assert overrides == 1


def test_term_missing_key_phrase_is_rejected():
    term = make_term()
    del term["key_phrase"]

    with pytest.raises(GlossaryParseError):
        parse_glossary(make_reply([term]))


@pytest.mark.parametrize("content", ["not json", '{"terms": []}', '{"terms": "x", "key_phrases": []}'])
def test_malformed_reply_raises_parse_error(content):
    with pytest.raises(GlossaryParseError):
        parse_glossary(content)


def test_build_messages_text_then_image_data_urls():
    messages, = [build_messages("texte", [b"\xff\xd8jpeg"])]

    assert messages[0]["role"] == "system"
    assert "JSON" in messages[0]["content"]
    parts = messages[1]["content"]
    assert [p["type"] for p in parts] == ["text", "image_url"]
    url = parts[1]["image_url"]["url"]
    assert base64.b64decode(url.removeprefix("data:image/jpeg;base64,")) == b"\xff\xd8jpeg"


def test_build_messages_rejects_empty_input():
    with pytest.raises(ValueError):
        build_messages("  ", [])

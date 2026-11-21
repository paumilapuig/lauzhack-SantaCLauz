import json

import pytest

from app.glossary.parser import GlossaryParseError, parse_glossary


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


def make_reply(terms: list, phrases: int = 5) -> str:
    key_phrases = [{"text": f"Phrase {i}.", "lemmas": ["cellule"]} for i in range(phrases)]
    return json.dumps({"terms": terms, "key_phrases": key_phrases})


def test_valid_reply_is_parsed_with_zero_overrides_and_drops():
    parsed = parse_glossary(make_reply([make_term()]))

    assert [t.lemma for t in parsed.result.terms] == ["cellule"]
    assert parsed.overrides == 0
    assert parsed.dropped_terms == 0


def test_fenced_json_is_accepted():
    parsed = parse_glossary("```json"+chr(10)+make_reply([make_term()])+chr(10)+"```")

    assert len(parsed.result.terms) == 1


def test_duplicate_lemmas_are_deduped_keeping_first():
    first = make_term(definition_fr="première")
    second = make_term(definition_fr="seconde", lemma="Cellule", forms=["cellule"])

    parsed = parse_glossary(make_reply([first, second]))

    assert [t.definition_fr for t in parsed.result.terms] == ["première"]


def test_transparency_rule_overrides_llm_flag_and_counts_it():
    term = make_term(lemma="maison", forms=["maison"], translation_es="casa", transparent=True)

    parsed = parse_glossary(make_reply([term]))

    assert parsed.result.terms[0].transparent is False
    assert parsed.overrides == 1


def test_four_key_phrases_are_accepted():
    assert len(parse_glossary(make_reply([make_term()], phrases=4)).result.key_phrases) == 4


def test_ten_key_phrases_are_truncated_to_eight():
    assert len(parse_glossary(make_reply([make_term()], phrases=10)).result.key_phrases) == 8


def test_missing_key_phrases_become_empty_list():
    content = json.dumps({"terms": [make_term()]})

    assert parse_glossary(content).result.key_phrases == []


def test_malformed_key_phrase_is_dropped_not_fatal():
    content = json.dumps({"terms": [make_term()], "key_phrases": [{"text": "ok", "lemmas": ["a"]}, {"bad": 1}, "x"]})

    assert [k.text for k in parse_glossary(content).result.key_phrases] == ["ok"]


def test_invalid_term_among_valid_ones_is_dropped_and_counted():
    no_key_phrase = make_term(lemma="noyau", forms=["noyau"])
    del no_key_phrase["key_phrase"]
    other = make_term(lemma="noyau2", forms=["noyau2"])

    parsed = parse_glossary(make_reply([make_term(), no_key_phrase, other]))

    assert [t.lemma for t in parsed.result.terms] == ["cellule", "noyau2"]
    assert parsed.dropped_terms == 1


def test_lemma_not_in_forms_is_dropped():
    bad = make_term(lemma="noyau", forms=["noyaux"])

    parsed = parse_glossary(make_reply([make_term(), bad, "not a dict", {"lemma": 3}]))

    assert len(parsed.result.terms) == 1
    assert parsed.dropped_terms == 3


def test_all_terms_invalid_raises():
    term = make_term()
    del term["key_phrase"]

    with pytest.raises(GlossaryParseError):
        parse_glossary(make_reply([term]))


@pytest.mark.parametrize(
    "content",
    ["not json", "[]", '"text"', '{"terms": []}', '{"terms": "x", "key_phrases": []}', '{"key_phrases": []}'],
)
def test_fatal_replies_raise_parse_error(content):
    with pytest.raises(GlossaryParseError):
        parse_glossary(content)

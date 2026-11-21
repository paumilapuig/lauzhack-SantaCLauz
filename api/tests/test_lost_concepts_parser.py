import json

import pytest

from app.lost_concepts.errors import LostConceptsParseError
from app.lost_concepts.parser import parse_lost_concepts

EVENT_IDS = {"e1", "e2", "e3"}
GLOSSARY_LEMMAS = ["cellule", "énergie", "respiration"]


def make_item(**overrides) -> dict:
    item = {
        "event_id": "e1",
        "concept_fr": "Les cellules ont besoin d'énergie.",
        "explanation_es": "La profesora explicaba que las células necesitan energía.",
        "lemmas": ["cellule"],
    }
    return {**item, **overrides}


def make_reply(items: list) -> str:
    return json.dumps({"concepts": items})


def parse(content: str):
    return parse_lost_concepts(content, EVENT_IDS, GLOSSARY_LEMMAS)


def test_valid_reply_is_parsed_with_zero_dropped():
    parsed = parse(make_reply([make_item(), make_item(event_id="e2")]))

    assert [c.event_id for c in parsed.concepts] == ["e1", "e2"]
    assert parsed.concepts[0].concept_fr == "Les cellules ont besoin d'énergie."
    assert parsed.concepts[0].lemmas == ["cellule"]
    assert parsed.dropped == 0


def test_fenced_json_is_accepted():
    parsed = parse("```json" + chr(10) + make_reply([make_item()]) + chr(10) + "```")

    assert len(parsed.concepts) == 1


def test_unknown_event_id_is_dropped_and_counted():
    parsed = parse(make_reply([make_item(), make_item(event_id="zzz")]))

    assert [c.event_id for c in parsed.concepts] == ["e1"]
    assert parsed.dropped == 1


def test_empty_concept_fr_is_dropped_and_counted():
    parsed = parse(make_reply([make_item(concept_fr="  "), make_item(event_id="e2")]))

    assert [c.event_id for c in parsed.concepts] == ["e2"]
    assert parsed.dropped == 1


def test_repeated_event_id_keeps_first_and_counts_the_rest_dropped():
    first = make_item(concept_fr="Première.")
    second = make_item(concept_fr="Seconde.")

    parsed = parse(make_reply([first, second]))

    assert [c.concept_fr for c in parsed.concepts] == ["Première."]
    assert parsed.dropped == 1


def test_non_dict_items_are_dropped_and_counted():
    parsed = parse(make_reply([make_item(), "not a dict", 3]))

    assert len(parsed.concepts) == 1
    assert parsed.dropped == 2


def test_lemmas_outside_glossary_are_filtered():
    parsed = parse(make_reply([make_item(lemmas=["cellule", "inconnu", "respiration"])]))

    assert parsed.concepts[0].lemmas == ["cellule", "respiration"]


def test_lemmas_match_case_insensitively_and_return_canonical_spelling():
    parsed = parse(make_reply([make_item(lemmas=["  ÉNERGIE ", "Cellule"])]))

    assert parsed.concepts[0].lemmas == ["énergie", "cellule"]


def test_repeated_lemmas_are_deduped_keeping_order():
    parsed = parse(make_reply([make_item(lemmas=["respiration", "cellule", "Respiration", "cellule"])]))

    assert parsed.concepts[0].lemmas == ["respiration", "cellule"]


def test_missing_lemmas_become_empty_list():
    item = make_item()
    del item["lemmas"]

    assert parse(make_reply([item])).concepts[0].lemmas == []


def test_empty_concepts_list_is_valid():
    parsed = parse(make_reply([]))

    assert parsed.concepts == []
    assert parsed.dropped == 0


@pytest.mark.parametrize(
    "content",
    ["not json", "[]", '"text"', '{"other": []}', '{"concepts": "x"}'],
)
def test_fatal_replies_raise_parse_error(content):
    with pytest.raises(LostConceptsParseError):
        parse(content)

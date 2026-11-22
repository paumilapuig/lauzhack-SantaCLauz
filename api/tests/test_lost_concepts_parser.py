import json

import pytest

from app.lost_concepts.errors import LostConceptsParseError
from app.lost_concepts.parser import parse_concept_gaps

T_SEC_BY_N = {1: 65.0, 2: 130.0, 3: 140.0}
LEMMAS = ["mitochondrie", "oxygène"]


def step(text: str = "La cellule respire.") -> dict:
    return {"fr": text, "es": "La célula respira.", "visual": "🍞 + 💨 → 🔋"}


def exercise(answer: int = 0, options: list[str] | None = None) -> dict:
    return {"question": "Que fabrique la mitochondrie ?", "options": options or ["énergie", "sucre", "eau"], "answer": answer}


def concept(**overrides) -> dict:
    base = {
        "concept": "Comment la cellule fabrique de l'énergie",
        "moments": [2, 1, 2],
        "lemmas": ["Mitochondrie", "oxygène", "soleil", "mitochondrie"],
        "explanation": [step(), step("Elle utilise l'oxygène."), step("Elle produit de l'énergie.")],
        "exercises": [exercise(0), exercise(2)],
    }
    base.update(overrides)
    return base


def parse(concepts: list[dict]):
    return parse_concept_gaps(json.dumps({"concepts": concepts}), T_SEC_BY_N, LEMMAS)


def test_valid_concept_becomes_a_gap_with_computed_minutes_and_glossary_lemmas():
    parsed = parse([concept()])

    assert parsed.dropped == 0
    gap = parsed.gaps[0]
    assert gap.concept == "Comment la cellule fabrique de l'énergie"
    assert gap.minutes == [1, 2]
    assert gap.lemmas == ["mitochondrie", "oxygène"]
    assert len(gap.explanation) == 3 and gap.explanation[0].visual == "🍞 + 💨 → 🔋"
    assert [e.answer for e in gap.exercises] == [0, 2]


def test_json_inside_markdown_fences_is_accepted():
    content = "```json\n" + json.dumps({"concepts": [concept()]}) + "\n```"

    assert len(parse_concept_gaps(content, T_SEC_BY_N, LEMMAS).gaps) == 1


@pytest.mark.parametrize(
    "overrides",
    [
        {"moments": [9]},
        {"moments": []},
        {"concept": "  "},
        {"explanation": [step(), step()]},
        {"explanation": [step()] * 6},
        {"exercises": [exercise()]},
        {"exercises": [exercise()] * 4},
        {"exercises": [exercise(options=["a"]), exercise()]},
        {"exercises": [exercise(options=["a", "b", "c", "d", "e"]), exercise()]},
        {"exercises": [exercise(answer=3), exercise()]},
        {"exercises": [exercise(answer=-1), exercise()]},
        {"explanation": [{"fr": "a", "es": "a", "visual": "x" * 41}, step(), step()]},
        {"explanation": [{"fr": "a" * 201, "es": "a", "visual": "x"}, step(), step()]},
        {"explanation": [{"fr": "a", "es": "a" * 301, "visual": "x"}, step(), step()]},
    ],
)
def test_invalid_concepts_are_dropped(overrides):
    parsed = parse([concept(**overrides)])

    assert parsed.gaps == []
    assert parsed.dropped == 1


def test_only_the_first_three_valid_concepts_are_kept():
    parsed = parse([concept(concept=f"Concept {i}") for i in range(5)])

    assert [g.concept for g in parsed.gaps] == ["Concept 0", "Concept 1", "Concept 2"]
    assert parsed.dropped == 2


def test_non_dict_items_are_dropped():
    parsed = parse(["oops", concept()])

    assert len(parsed.gaps) == 1
    assert parsed.dropped == 1


@pytest.mark.parametrize("content", ["not json", "[]", '{"other": []}', '{"concepts": {}}'])
def test_unreadable_reply_raises(content):
    with pytest.raises(LostConceptsParseError):
        parse_concept_gaps(content, T_SEC_BY_N, LEMMAS)

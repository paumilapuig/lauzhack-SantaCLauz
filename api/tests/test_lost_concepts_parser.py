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
        {"concept": "  "},
        {"explanation": [step()]},
        {"explanation": "not a list"},
        {"exercises": [exercise()]},
        {"exercises": [exercise(options=["a"]), exercise()]},
        {"exercises": [exercise(options=["a", "b", "c", "d", "e"]), exercise()]},
        {"exercises": [exercise(answer=3), exercise()]},
        {"exercises": [exercise(answer=-1), exercise()]},
        {"explanation": [{"fr": "a" * 201, "es": "a", "visual": "x"}, step(), {"fr": "a", "es": "a" * 301, "visual": "x"}]},
    ],
)
def test_concepts_that_cannot_be_repaired_are_dropped(overrides):
    parsed = parse([concept(**overrides)])

    assert parsed.gaps == []
    assert parsed.dropped == 1


@pytest.mark.parametrize("moments", [[9], [], [0, 9], "1"])
def test_unknown_moment_numbers_link_the_concept_to_every_moment(moments):
    gap = parse([concept(moments=moments)]).gaps[0]

    assert gap.minutes == [1, 2]


def test_unknown_moment_numbers_are_dropped_and_known_ones_kept():
    assert parse([concept(moments=[3, 9])]).gaps[0].minutes == [2]


def test_a_long_visual_is_shortened_instead_of_dropping_the_concept():
    long_visual = "🍞 + 💨 → 🔋 → 🏃 → 🔥 → 💧 → 🌬️ → ⚡ → 🧠 → 💪 → 🫁 → 🩸"
    gap = parse([concept(explanation=[{"fr": "a", "es": "a", "visual": long_visual}, step(), step()])]).gaps[0]

    assert len(gap.explanation[0].visual) <= 40
    assert gap.explanation[0].visual.startswith("🍞 + 💨 → 🔋")


def test_two_steps_are_accepted():
    assert len(parse([concept(explanation=[step(), step()])]).gaps[0].explanation) == 2


def test_extra_steps_and_exercises_are_trimmed():
    gap = parse([concept(explanation=[step()] * 6, exercises=[exercise()] * 4)]).gaps[0]

    assert (len(gap.explanation), len(gap.exercises)) == (5, 3)


def test_one_invalid_exercise_is_dropped_when_two_valid_ones_remain():
    gap = parse([concept(exercises=[exercise(answer=7), exercise(0), exercise(1)])]).gaps[0]

    assert [e.answer for e in gap.exercises] == [0, 1]


def test_one_invalid_step_is_dropped_when_two_valid_ones_remain():
    bad = {"fr": "a" * 201, "es": "a", "visual": "x"}
    assert len(parse([concept(explanation=[bad, step(), step()])]).gaps[0].explanation) == 2


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


def test_byte_token_emojis_in_the_reply_are_decoded():
    raw = json.dumps({"concepts": [concept()]}, ensure_ascii=False).replace("🔋", "<0xF0><0x9F><0x94><0x8B>")

    gap = parse_concept_gaps(raw, T_SEC_BY_N, LEMMAS).gaps[0]

    assert gap.explanation[0].visual == "🍞 + 💨 → 🔋"

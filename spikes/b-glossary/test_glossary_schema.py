import pytest
from pydantic import ValidationError

from glossary_schema import GlossaryResult, LessonTermInput


def make_phrases(count: int) -> list[dict]:
    return [{"text": f"Phrase {i}.", "lemmas": ["cellule"]} for i in range(count)]


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


def test_reference_json_validates(reference_terms):
    result = GlossaryResult(terms=reference_terms, key_phrases=make_phrases(6))
    assert len(result.terms) == 15


def test_uppercase_lemma_and_forms_are_lowercased():
    term = LessonTermInput(**make_term(lemma="Cellule", forms=["CELLULE", "Cellules"]))
    assert term.lemma == "cellule"
    assert term.forms == ["cellule", "cellules"]


def test_lemma_missing_from_forms_is_added_first():
    term = LessonTermInput(**make_term(forms=["cellules"]))

    assert term.forms == ["cellule", "cellules"]


@pytest.mark.parametrize("count", [4, 9])
def test_key_phrase_count_out_of_range_is_rejected(count):
    with pytest.raises(ValidationError):
        GlossaryResult(terms=[make_term()], key_phrases=make_phrases(count))


@pytest.mark.parametrize("count", [5, 8])
def test_key_phrase_count_in_range_is_accepted(count):
    result = GlossaryResult(terms=[make_term()], key_phrases=make_phrases(count))
    assert len(result.key_phrases) == count

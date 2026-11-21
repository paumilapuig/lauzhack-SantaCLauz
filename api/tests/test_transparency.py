import json
from pathlib import Path

import pytest

from app.transparency import is_transparent, norm, similarity

REFERENCE = Path(__file__).resolve().parents[2] / "docs" / "demo" / "glossary-respiration.json"


def test_norm_lowercases_and_drops_accents():
    assert norm("Libérer") == "liberer"


@pytest.mark.parametrize(
    "french, spanish, expected",
    [
        ("libérer", "liberar", 0.86),
        ("oxygène", "oxígeno", 0.71),
        ("déchet", "desecho", 0.62),
        ("chaleur", "calor", 0.67),
    ],
)
def test_similarity_values(french, spanish, expected):
    assert round(similarity(french, spanish), 2) == expected


def test_llm_flag_false_is_never_transparent():
    assert is_transparent(False, "libérer", "liberar") is False


def test_threshold_applies_when_llm_flag_true():
    assert is_transparent(True, "oxygène", "oxígeno") is True
    assert is_transparent(True, "chaleur", "calor") is False


def test_rule_over_reference_matches_file_flags():
    terms = json.loads(REFERENCE.read_text(encoding="utf-8"))
    flags = [t["transparent"] for t in terms]
    by_rule = [is_transparent(True, t["lemma"], t["translation_es"]) for t in terms]
    assert (sum(by_rule), len(by_rule) - sum(by_rule)) == (8, 7)
    assert by_rule == flags

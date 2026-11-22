from app.lost_concepts.repair import repair_concept, shorten_visual


def test_short_visual_is_unchanged():
    assert shorten_visual("  🍞 → 🔋 ") == "🍞 → 🔋"


def test_long_visual_keeps_whole_pieces():
    assert shorten_visual("aaaa bbbb cccc", limit=10) == "aaaa bbbb"


def test_a_single_long_piece_is_cut_hard():
    assert shorten_visual("x" * 50, limit=40) == "x" * 40


def test_repair_keeps_unrelated_fields_and_does_not_mutate_input():
    raw = {"concept": "C", "lemmas": ["a"], "moments": [7], "explanation": [], "exercises": []}

    repaired = repair_concept(raw, {1, 2})

    assert repaired["concept"] == "C" and repaired["lemmas"] == ["a"]
    assert repaired["moments"] == [1, 2]
    assert raw["moments"] == [7]

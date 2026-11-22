from app.lost_concepts.repair import decode_byte_tokens, repair_concept, shorten_visual


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


def test_byte_tokens_become_the_emoji_they_encode():
    assert decode_byte_tokens("<0xF0><0x9F><0xA7><0xAC> + 💨") == "🧬 + 💨"


def test_broken_byte_tokens_are_removed():
    assert decode_byte_tokens("🧍 <0xE2><0x86> 🔥") == "🧍  🔥"


def test_text_without_byte_tokens_is_unchanged():
    assert decode_byte_tokens("La cellule <respire> 0xF0") == "La cellule <respire> 0xF0"

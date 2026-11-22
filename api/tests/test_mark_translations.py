import json

from app.config import Settings
from app.mark_translations import parse_translations, translate_clip_marks
from tests.fake_supabase import FakeSupabase

STUDENT = "00000000-0000-4000-8000-000000000002"
CLIP = "30000000-0000-4000-8000-000000000001"


def settings(key="sk-test"):
    return Settings(supabase_url="http://x", supabase_secret_key="s", openrouter_api_key=key)


def seed():
    return FakeSupabase({
        "clips": [{"id": CLIP, "student_id": STUDENT, "transcript": "Le glucose arrive dans le sang après la digestion."}],
        "clip_marks": [
            {"student_id": STUDENT, "clip_id": CLIP, "word": "sang", "lemma": None, "translation_es": None, "definition_fr": None},
            {"student_id": STUDENT, "clip_id": CLIP, "word": "digestion", "lemma": None, "translation_es": None, "definition_fr": None},
            {"student_id": STUDENT, "clip_id": CLIP, "word": "glucose", "lemma": "glucose", "translation_es": None, "definition_fr": None},
        ],
    })


def answer(words):
    return json.dumps({"words": words})


def test_parse_keeps_valid_entries_for_asked_words_only():
    content = answer([
        {"word": "sang", "translation_es": "sangre", "definition_fr": "Liquide rouge dans le corps."},
        {"word": "inconnu", "translation_es": "x", "definition_fr": "y"},
        {"word": "digestion", "translation_es": "", "definition_fr": "z"},
    ])
    assert parse_translations(content, {"sang", "digestion"}) == {"sang": ("sangre", "Liquide rouge dans le corps.")}


def test_parse_survives_invalid_json():
    assert parse_translations("not json", {"sang"}) == {}


def test_translates_only_non_glossary_marks_in_one_call():
    db = seed()
    calls = []

    def fake_llm(messages, model, api_key, http=None):
        calls.append(messages)
        return answer([
            {"word": "sang", "translation_es": "sangre", "definition_fr": "Liquide rouge."},
            {"word": "digestion", "translation_es": "digestión", "definition_fr": "Transformation des aliments."},
        ]), {}

    assert translate_clip_marks(db, CLIP, STUDENT, settings(), llm=fake_llm) == 2
    assert len(calls) == 1
    assert "glucose" not in json.dumps(calls[0]).split("Words:")[-1]
    rows = {r["word"]: r for r in db.tables["clip_marks"]}
    assert (rows["sang"]["translation_es"], rows["sang"]["definition_fr"]) == ("sangre", "Liquide rouge.")
    assert rows["digestion"]["translation_es"] == "digestión"
    assert rows["glucose"]["translation_es"] is None


def test_no_key_or_nothing_to_translate_makes_no_call():
    calls = []
    fake_llm = lambda *a, **k: calls.append(1) or ("{}", {})  # noqa: E731
    assert translate_clip_marks(seed(), CLIP, STUDENT, settings(key=None), llm=fake_llm) == 0
    empty = seed()
    empty.tables["clip_marks"] = [m for m in empty.tables["clip_marks"] if m["lemma"]]
    assert translate_clip_marks(empty, CLIP, STUDENT, settings(), llm=fake_llm) == 0
    assert calls == []


def test_llm_failure_is_swallowed():
    def broken(*args, **kwargs):
        raise RuntimeError("down")

    assert translate_clip_marks(seed(), CLIP, STUDENT, settings(), llm=broken) == 0

import logging

import pytest
from fastapi.testclient import TestClient

import app.main as main
import app.roles as roles
from app.auth import get_current_user
from app.db import get_supabase
from app.schemas import CurrentUser, Profile
from tests.fake_supabase import FakeSupabase

STUDENT = "00000000-0000-4000-8000-000000000002"
OTHER_STUDENT = "00000000-0000-4000-8000-000000000003"
LESSON = "10000000-0000-4000-8000-000000000001"
SESSION = "20000000-0000-4000-8000-000000000001"
OTHER_SESSION = "20000000-0000-4000-8000-000000000002"
URL = "/api/home/review"
USER = CurrentUser(id=STUDENT, email="lucia@example.com")


def clip_id(n: int) -> str:
    return f"30000000-0000-4000-8000-{n:012d}"


def make_clip(n, student=STUDENT, session=SESSION, transcript="les mitochondries", day=15, reviewed_at=None):
    return {
        "reviewed_at": reviewed_at,
        "id": clip_id(n), "session_id": session, "student_id": student,
        "t_start": 10.0, "t_end": 20.0, "transcript": transcript,
        "audio_path": f"{student}/{clip_id(n)}.webm",
        "created_at": f"2026-11-{day:02d}T10:00:00+00:00",
    }


def make_term(lemma, transparent=False):
    return {
        "id": f"40000000-0000-4000-8000-{len(lemma):012d}", "lesson_id": LESSON,
        "lemma": lemma, "forms": [lemma, f"{lemma}s"], "translation_es": f"es-{lemma}",
        "definition_fr": f"def-{lemma}", "transparent": transparent, "key_phrase": None,
    }


def seed(clips=(), results=(), marks=(), mastery=(), terms=None, store_audio=True) -> FakeSupabase:
    db = FakeSupabase({
        "clips": list(clips),
        "class_sessions": [
            {"id": SESSION, "lesson_id": LESSON, "student_id": STUDENT,
             "started_at": "2026-11-15T09:00:00+00:00"},
            {"id": OTHER_SESSION, "lesson_id": LESSON, "student_id": OTHER_STUDENT,
             "started_at": "2026-11-15T09:00:00+00:00"},
        ],
        "lessons": [{"id": LESSON, "title": "La cellule"}],
        "lesson_terms": terms if terms is not None else [make_term("mitochondrie")],
        "practice_results": list(results),
        "clip_marks": list(marks),
        "word_mastery": list(mastery),
        "concept_gaps": [],
    })
    if store_audio:
        for row in clips:
            db.storage.from_("clips").upload(row["audio_path"], b"audio")
    return db


@pytest.fixture
def role(monkeypatch):
    state = {"role": "student"}
    monkeypatch.setattr(
        roles, "fetch_profile", lambda user_id: Profile(display_name=None, role=state["role"])
    )
    return state


@pytest.fixture
def client_for(role):
    def build(db):
        main.app.dependency_overrides[get_current_user] = lambda: USER
        main.app.dependency_overrides[get_supabase] = lambda: db
        return TestClient(main.app)

    yield build
    main.app.dependency_overrides.clear()


def get_review(client_for, db):
    response = client_for(db).get(URL)
    assert response.status_code == 200
    return response.json()


def test_pending_clip_has_audio_title_terms_kind_and_no_lemma(client_for):
    (clip,) = get_review(client_for, seed([make_clip(1)]))["clips"]
    assert clip["id"] == clip_id(1)
    assert clip["lesson_title"] == "La cellule"
    assert "fake.storage" in clip["audio_url"]
    assert clip["terms"] == ["mitochondrie"]
    assert (clip["kind"], clip["lemma"]) == ("word", None)


def test_reviewed_clip_is_not_listed(client_for):
    db = seed([make_clip(1, reviewed_at="2026-11-16T10:00:00+00:00"), make_clip(2)])
    assert [c["id"] for c in get_review(client_for, db)["clips"]] == [clip_id(2)]


def test_only_the_five_newest_pending_clips_are_listed(client_for):
    db = seed([make_clip(n, day=10 + n) for n in range(1, 8)])
    ids = [c["id"] for c in get_review(client_for, db)["clips"]]
    assert ids == [clip_id(n) for n in (7, 6, 5, 4, 3)]


def test_other_students_clip_is_not_listed(client_for):
    db = seed([make_clip(1, student=OTHER_STUDENT, session=OTHER_SESSION)])
    assert get_review(client_for, db)["clips"] == []


def test_clips_are_ordered_newest_first(client_for):
    db = seed([make_clip(1, day=15), make_clip(2, day=17), make_clip(3, day=16)])
    ids = [c["id"] for c in get_review(client_for, db)["clips"]]
    assert ids == [clip_id(2), clip_id(3), clip_id(1)]


def test_clip_without_storage_object_is_left_out_and_logged(client_for, caplog):
    db = seed([make_clip(1)], store_audio=False)
    with caplog.at_level(logging.WARNING):
        assert get_review(client_for, db)["clips"] == []
    warnings = [r for r in caplog.records if r.levelno == logging.WARNING]
    assert any(clip_id(1) in r.getMessage() for r in warnings)


def test_student_without_data_gets_empty_lists(client_for):
    assert get_review(client_for, seed()) == {"clips": [], "words_to_practice": [], "concepts_to_learn": []}


def test_teacher_gets_403(client_for, role):
    role["role"] = "teacher"
    assert client_for(seed()).get(URL).status_code == 403


def test_no_token_gets_401():
    assert TestClient(main.app).get(URL).status_code == 401


TWO_SENTENCES = "Bonjour a tous. Les mitochondries produisent l'energie."


def make_mark(n, word="mitochondries", lemma="mitochondrie", student=STUDENT, day=15):
    return {
        "student_id": student, "clip_id": clip_id(n), "word": word, "lemma": lemma,
        "created_at": f"2026-11-{day:02d}T11:00:00+00:00",
    }


def mastery_row(lemma, level):
    return {"student_id": STUDENT, "lemma": lemma, "level": level}


def get_words(client_for, db):
    return get_review(client_for, db)["words_to_practice"]


def test_level_zero_glossary_word_is_listed_with_help_and_its_sentence(client_for):
    db = seed([make_clip(1, transcript=TWO_SENTENCES)], marks=[make_mark(1)],
              mastery=[mastery_row("mitochondrie", 0)])
    (word,) = get_words(client_for, db)
    assert word == {
        "word": "mitochondries", "lemma": "mitochondrie",
        "translation_es": "es-mitochondrie", "definition_fr": "def-mitochondrie",
        "key_phrase": "Les mitochondries produisent l'energie.", "level": 0,
        "clip_id": clip_id(1),
    }


def test_word_at_level_two_is_not_listed(client_for):
    db = seed([make_clip(1)], marks=[make_mark(1)], mastery=[mastery_row("mitochondrie", 2)])
    assert get_words(client_for, db) == []


def test_without_mastery_row_transparent_is_skipped_and_other_starts_at_zero(client_for):
    terms = [make_term("mitochondrie"), make_term("cellule", transparent=True)]
    db = seed([make_clip(1)], marks=[make_mark(1), make_mark(1, "cellules", "cellule")],
              terms=terms)
    assert [(w["lemma"], w["level"]) for w in get_words(client_for, db)] == [("mitochondrie", 0)]


def test_out_of_glossary_word_is_listed_with_nulls_and_whole_transcript(client_for):
    db = seed([make_clip(1, transcript=" Bonjour a tous. ")], marks=[make_mark(1, "salut", None)])
    (word,) = get_words(client_for, db)
    assert (word["lemma"], word["translation_es"], word["definition_fr"], word["level"]) == (
        None, None, None, None)
    assert word["word"] == "salut"
    assert word["key_phrase"] == "Bonjour a tous."


def test_lemma_missing_from_the_clip_lesson_glossary_is_treated_as_out_of_glossary(client_for):
    db = seed([make_clip(1)], marks=[make_mark(1, "noyau", "noyau")])
    (word,) = get_words(client_for, db)
    assert (word["lemma"], word["level"]) == (None, None)


def test_words_are_ordered_newest_first(client_for):
    db = seed([make_clip(1), make_clip(2)],
              marks=[make_mark(1, "a", None, day=15), make_mark(2, "b", None, day=17)])
    assert [w["word"] for w in get_words(client_for, db)] == ["b", "a"]


def test_mark_on_passed_clip_still_counts(client_for):
    results = [{"student_id": STUDENT, "clip_id": clip_id(1), "passed": True}]
    db = seed([make_clip(1)], results=results, marks=[make_mark(1, "salut", None)])
    assert [w["word"] for w in get_words(client_for, db)] == ["salut"]


def test_other_students_marks_are_not_listed(client_for):
    other = make_clip(2, student=OTHER_STUDENT, session=OTHER_SESSION)
    db = seed([make_clip(1), other],
              marks=[make_mark(2, student=OTHER_STUDENT), make_mark(1, "salut", None)])
    assert [w["word"] for w in get_words(client_for, db)] == ["salut"]

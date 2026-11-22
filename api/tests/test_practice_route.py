from datetime import UTC, datetime

from app.practice_repository import (
    fetch_level,
    find_student_clip_lesson,
    find_term_transparent,
    insert_practice_result,
    upsert_level,
)
from tests.fake_supabase import FakeSupabase

STUDENT = "00000000-0000-4000-8000-000000000002"
OTHER_STUDENT = "00000000-0000-4000-8000-000000000003"
LESSON = "10000000-0000-4000-8000-000000000001"
OTHER_LESSON = "10000000-0000-4000-8000-000000000002"
SESSION = "20000000-0000-4000-8000-000000000001"
OTHER_SESSION = "20000000-0000-4000-8000-000000000002"
CLIP = "30000000-0000-4000-8000-000000000001"
OTHER_CLIP = "30000000-0000-4000-8000-000000000002"
NOW = datetime(2026, 11, 22, 10, 0, tzinfo=UTC)


def make_term(lemma, lesson=LESSON, transparent=False):
    return {"lesson_id": lesson, "lemma": lemma, "transparent": transparent}


def seed(mastery=(), results=()) -> FakeSupabase:
    return FakeSupabase({
        "clips": [
            {"id": CLIP, "session_id": SESSION, "student_id": STUDENT},
            {"id": OTHER_CLIP, "session_id": OTHER_SESSION, "student_id": OTHER_STUDENT},
        ],
        "class_sessions": [
            {"id": SESSION, "lesson_id": LESSON, "student_id": STUDENT},
            {"id": OTHER_SESSION, "lesson_id": OTHER_LESSON, "student_id": OTHER_STUDENT},
        ],
        "lesson_terms": [
            make_term("mitochondrie"),
            make_term("cellule", transparent=True),
            make_term("noyau", lesson=OTHER_LESSON),
        ],
        "word_mastery": list(mastery),
        "practice_results": list(results),
    })


def test_own_clip_returns_its_lesson():
    assert find_student_clip_lesson(seed(), STUDENT, CLIP) == LESSON


def test_other_students_clip_returns_none():
    assert find_student_clip_lesson(seed(), STUDENT, OTHER_CLIP) is None


def test_missing_clip_returns_none():
    missing = "30000000-0000-4000-8000-0000000000ff"
    assert find_student_clip_lesson(seed(), STUDENT, missing) is None


def test_term_transparency_is_read_for_the_lesson():
    db = seed()
    assert find_term_transparent(db, "cellule", LESSON) is True
    assert find_term_transparent(db, "mitochondrie", LESSON) is False


def test_lemma_unknown_in_that_lesson_returns_none():
    assert find_term_transparent(seed(), "noyau", LESSON) is None


def test_without_lesson_any_lesson_matches():
    assert find_term_transparent(seed(), "noyau", None) is False
    assert find_term_transparent(seed(), "inconnu", None) is None


def test_fetch_level_returns_row_level_or_none():
    db = seed(mastery=[{"student_id": STUDENT, "lemma": "cellule", "level": 1}])
    assert fetch_level(db, STUDENT, "cellule") == 1
    assert fetch_level(db, STUDENT, "noyau") is None
    assert fetch_level(db, OTHER_STUDENT, "cellule") is None


def test_insert_practice_result_stores_row_without_created_at():
    db = seed()
    insert_practice_result(db, STUDENT, "cellule", CLIP, True)
    (row,) = db.tables["practice_results"]
    assert (row["student_id"], row["lemma"], row["clip_id"], row["passed"]) == (
        STUDENT, "cellule", CLIP, True)
    assert "created_at" not in row


def test_upsert_level_creates_then_overwrites_with_last_seen():
    db = seed()
    upsert_level(db, STUDENT, "cellule", 1, NOW)
    upsert_level(db, STUDENT, "cellule", 2, NOW)
    (row,) = db.tables["word_mastery"]
    assert (row["level"], row["last_seen_at"]) == (2, NOW.isoformat())

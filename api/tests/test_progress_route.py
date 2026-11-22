from datetime import UTC, datetime

from app.progress_repository import fetch_levels, fetch_mark_lemmas, fetch_passed_practices
from tests.fake_supabase import FakeSupabase

STUDENT = "00000000-0000-4000-8000-000000000002"
OTHER_STUDENT = "00000000-0000-4000-8000-000000000003"
LESSON = "10000000-0000-4000-8000-000000000001"


def practice(student, lemma, created_at, passed=True):
    return {"student_id": student, "lemma": lemma, "clip_id": None,
            "passed": passed, "created_at": created_at}


def mark(student, lemma, created_at):
    return {"student_id": student, "clip_id": None, "word": lemma or "x",
            "lemma": lemma, "created_at": created_at}


def term(lemma, transparent):
    return {"lesson_id": LESSON, "lemma": lemma, "transparent": transparent}


def test_passed_practices_only_student_passed_newest_first_with_z_suffix():
    db = FakeSupabase({"practice_results": [
        practice(STUDENT, "cellule", "2026-11-16T10:00:00+00:00"),
        practice(STUDENT, "noyau", "2026-11-18T10:00:00Z"),
        practice(STUDENT, "atome", "2026-11-19T10:00:00+00:00", passed=False),
        practice(OTHER_STUDENT, "ion", "2026-11-20T10:00:00+00:00"),
    ]})

    result = fetch_passed_practices(db, STUDENT)

    assert result == [
        ("noyau", datetime(2026, 11, 18, 10, tzinfo=UTC)),
        ("cellule", datetime(2026, 11, 16, 10, tzinfo=UTC)),
    ]


def test_mark_lemmas_skip_null_and_other_students_newest_first():
    db = FakeSupabase({"clip_marks": [
        mark(STUDENT, "cellule", "2026-11-16T10:00:00+00:00"),
        mark(STUDENT, None, "2026-11-17T10:00:00+00:00"),
        mark(STUDENT, "noyau", "2026-11-18T10:00:00+00:00"),
        mark(OTHER_STUDENT, "ion", "2026-11-19T10:00:00+00:00"),
    ]})

    assert fetch_mark_lemmas(db, STUDENT) == ["noyau", "cellule"]


def test_levels_use_mastery_then_transparent_fallback_then_zero():
    db = FakeSupabase({
        "word_mastery": [
            {"student_id": STUDENT, "lemma": "cellule", "level": 2},
            {"student_id": OTHER_STUDENT, "lemma": "noyau", "level": 2},
        ],
        "lesson_terms": [term("noyau", False), term("atome", True)],
    })

    levels = fetch_levels(db, STUDENT, ["cellule", "noyau", "atome", "inconnu"])

    assert levels == {"cellule": 2, "noyau": 0, "atome": 3, "inconnu": 0}


def test_levels_empty_lemmas_returns_empty():
    assert fetch_levels(FakeSupabase({}), STUDENT, []) == {}

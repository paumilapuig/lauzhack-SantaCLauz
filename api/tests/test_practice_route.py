from datetime import UTC, datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
from app.auth import get_current_user
from app.db import get_supabase
from app.practice_repository import (
    fetch_level,
    find_student_clip_lesson,
    find_term_transparent,
    insert_practice_result,
    upsert_level,
)
from app.routers import practice
from app.schemas import CurrentUser, Profile
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


def test_insert_practice_result_stores_row_with_its_time():
    db = seed()
    insert_practice_result(db, STUDENT, "cellule", CLIP, True, NOW)
    (row,) = db.tables["practice_results"]
    assert (row["student_id"], row["lemma"], row["clip_id"], row["passed"]) == (
        STUDENT, "cellule", CLIP, True)
    assert row["created_at"] == NOW.isoformat()


def test_upsert_level_creates_then_overwrites_with_last_seen():
    db = seed()
    upsert_level(db, STUDENT, "cellule", 1, NOW)
    upsert_level(db, STUDENT, "cellule", 2, NOW)
    (row,) = db.tables["word_mastery"]
    assert (row["level"], row["last_seen_at"]) == (2, NOW.isoformat())


# --- route ---

USER = CurrentUser(id=STUDENT, email="lucia@example.com")


@pytest.fixture
def role(monkeypatch):
    state = {"role": "student"}
    monkeypatch.setattr(roles, "fetch_profile", lambda user_id: Profile(display_name=None, role=state["role"]))
    return state


def make_client(db, authenticated=True) -> TestClient:
    app = FastAPI()
    app.include_router(practice.router)
    app.dependency_overrides[get_supabase] = lambda: db
    if authenticated:
        app.dependency_overrides[get_current_user] = lambda: USER
    return TestClient(app)


def submit(client, lemma, passed, clip_id=CLIP):
    return client.post("/api/practice", json={"lemma": lemma, "clip_id": clip_id, "passed": passed})


def test_pass_at_level_zero_levels_up_and_stores_rows(role):
    db = seed()
    response = submit(make_client(db), "mitochondrie", True)
    assert response.status_code == 200
    assert response.json() == {"lemma": "mitochondrie", "level": 1, "leveled_up": True}
    assert [r["passed"] for r in db.tables["practice_results"]] == [True]
    (row,) = db.tables["word_mastery"]
    assert (row["student_id"], row["lemma"], row["level"]) == (STUDENT, "mitochondrie", 1)


def test_transparent_term_without_row_stays_at_three(role):
    response = submit(make_client(seed()), "cellule", True)
    assert response.json() == {"lemma": "cellule", "level": 3, "leveled_up": False}


def test_fail_keeps_level_and_still_records_result(role):
    mastery = [{"student_id": STUDENT, "lemma": "mitochondrie", "level": 1}]
    db = seed(mastery=mastery)
    response = submit(make_client(db), "mitochondrie", False)
    assert response.json() == {"lemma": "mitochondrie", "level": 1, "leveled_up": False}
    assert [r["passed"] for r in db.tables["practice_results"]] == [False]
    assert db.tables["word_mastery"] == mastery


def test_other_students_clip_is_404(role):
    assert submit(make_client(seed()), "noyau", True, clip_id=OTHER_CLIP).status_code == 404


def test_unknown_lemma_is_422(role):
    response = submit(make_client(seed()), "inconnu", True)
    assert response.status_code == 422
    assert response.json()["detail"] == "Unknown lemma"


def test_lemma_of_another_lesson_is_422_for_the_clip(role):
    assert submit(make_client(seed()), "noyau", True).status_code == 422


def test_null_clip_id_accepts_a_lemma_of_any_lesson(role):
    db = seed()
    response = submit(make_client(db), "noyau", True, clip_id=None)
    assert response.status_code == 200
    assert db.tables["practice_results"][0]["clip_id"] is None


def test_teacher_is_forbidden(role):
    role["role"] = "teacher"
    assert submit(make_client(seed()), "mitochondrie", True).status_code == 403


def test_missing_token_is_401():
    assert submit(make_client(seed(), authenticated=False), "mitochondrie", True).status_code == 401


def test_main_app_exposes_practice_and_keeps_me():
    import app.main as main

    paths = main.app.openapi()["paths"]
    assert "post" in paths["/api/practice"]
    assert "get" in paths["/api/me"]


def test_a_second_pass_the_same_day_is_stored_but_does_not_level_up(role):
    db = seed()
    client = make_client(db)
    first = submit(client, "mitochondrie", True).json()
    second = submit(client, "mitochondrie", True).json()
    assert first == {"lemma": "mitochondrie", "level": 1, "leveled_up": True}
    assert second == {"lemma": "mitochondrie", "level": 1, "leveled_up": False}
    assert [r["passed"] for r in db.tables["practice_results"]] == [True, True]
    assert db.tables["word_mastery"][0]["level"] == 1


def test_a_pass_on_an_earlier_day_does_not_block_today(role):
    yesterday = {"student_id": STUDENT, "lemma": "mitochondrie", "clip_id": CLIP, "passed": True,
                 "created_at": "2026-11-20T10:00:00+00:00"}
    mastery = [{"student_id": STUDENT, "lemma": "mitochondrie", "level": 1}]
    response = submit(make_client(seed(mastery=mastery, results=[yesterday])), "mitochondrie", True)
    assert response.json() == {"lemma": "mitochondrie", "level": 2, "leveled_up": True}


def test_another_students_pass_today_does_not_count(role):
    other = {"student_id": OTHER_STUDENT, "lemma": "mitochondrie", "clip_id": None, "passed": True,
             "created_at": datetime.now(UTC).isoformat()}
    response = submit(make_client(seed(results=[other])), "mitochondrie", True)
    assert response.json()["leveled_up"] is True


def test_a_failed_try_today_does_not_block_a_pass():
    from app import mastery
    assert mastery.apply_practice(0, True, raised_today=False) == 1
    assert mastery.apply_practice(0, True, raised_today=True) == 0
    assert mastery.apply_practice(2, False, raised_today=False) == 2

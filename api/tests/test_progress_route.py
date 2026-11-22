from datetime import UTC, datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
from app.auth import get_current_user
from app.db import get_supabase
from app.progress_repository import fetch_levels, fetch_mark_lemmas, fetch_passed_practices
from app.routers import progress
from app.schemas import CurrentUser, Profile
from tests.fake_supabase import FakeSupabase

STUDENT = "00000000-0000-4000-8000-000000000002"
OTHER_STUDENT = "00000000-0000-4000-8000-000000000003"
LESSON = "10000000-0000-4000-8000-000000000001"
URL = "/api/me/progress"
NOW = datetime(2026, 11, 19, 12, tzinfo=UTC)


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


def empty_db():
    return FakeSupabase({
        "practice_results": [], "clip_marks": [], "word_mastery": [], "lesson_terms": [],
    })


@pytest.fixture
def role(monkeypatch):
    state = {"role": "student"}
    monkeypatch.setattr(
        roles, "fetch_profile", lambda user_id: Profile(display_name=None, role=state["role"])
    )
    return state


@pytest.fixture
def client_for(role):
    def build(db, authenticated=True):
        app = FastAPI()
        app.include_router(progress.router)
        app.dependency_overrides[get_supabase] = lambda: db
        app.dependency_overrides[progress.get_now] = lambda: NOW
        if authenticated:
            app.dependency_overrides[get_current_user] = lambda: CurrentUser(
                id=STUDENT, email="lucia@example.com"
            )
        return TestClient(app)

    return build


def test_progress_returns_messages_for_the_token_student_only(client_for):
    db = FakeSupabase({
        "practice_results": [
            practice(STUDENT, "cellule", "2026-11-18T10:00:00+00:00"),
            practice(OTHER_STUDENT, "ion", "2026-11-18T11:00:00+00:00"),
            practice(OTHER_STUDENT, "atome", "2026-11-18T12:00:00+00:00"),
        ],
        "clip_marks": [
            mark(STUDENT, "noyau", "2026-11-18T09:00:00+00:00"),
            mark(OTHER_STUDENT, "proton", "2026-11-18T09:30:00+00:00"),
        ],
        "word_mastery": [
            {"student_id": STUDENT, "lemma": "cellule", "level": 1},
            {"student_id": OTHER_STUDENT, "lemma": "ion", "level": 3},
        ],
        "lesson_terms": [],
    })

    response = client_for(db).get(URL)

    assert response.status_code == 200
    assert response.json() == {"messages": [
        {"kind": "learned_this_week", "text": "Esta semana has aprendido 1 palabra nueva"},
        {"kind": "keep_going", "text": "Sigue así: mañana repasamos «noyau»"},
    ]}


def test_progress_without_data_only_encourages(client_for):
    response = client_for(empty_db()).get(URL)

    assert response.json() == {"messages": [
        {"kind": "keep_going", "text": "Sigue así, vas muy bien"},
    ]}


def test_progress_teacher_is_forbidden(client_for, role):
    role["role"] = "teacher"

    assert client_for(empty_db()).get(URL).status_code == 403


def test_progress_without_token_is_unauthorized(client_for):
    assert client_for(empty_db(), authenticated=False).get(URL).status_code == 401


def test_main_app_exposes_progress_next_to_me():
    import app.main as main

    paths = main.app.openapi()["paths"]
    assert "get" in paths["/api/me/progress"]
    assert "get" in paths["/api/me"]

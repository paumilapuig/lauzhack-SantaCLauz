import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
from app.auth import get_current_user
from app.db import get_supabase
from app.routers.teacher import router
from app.schemas import CurrentUser, Profile
from tests.classdata_seed import L1, OTHER_SESSION, OTHER_STUDENT, TEACHER, seeded_fake

UNKNOWN_LESSON = "10000000-0000-4000-8000-0000000000ff"
EMPTY_LESSON = "10000000-0000-4000-8000-000000000002"


@pytest.fixture
def db():
    fake = seeded_fake()
    fake.tables["lessons"].append({"id": EMPTY_LESSON, "teacher_id": TEACHER, "title": "Sans élèves",
                                   "subject": None, "lesson_date": None, "created_at": "2026-11-21T08:00:00+00:00"})
    fake.tables["profiles"] = [{"id": OTHER_STUDENT, "display_name": "Lucía (semaine 4)", "role": "student"}]
    fake.tables["class_events"].append(
        {"session_id": OTHER_SESSION, "student_id": OTHER_STUDENT, "t_sec": 725.0, "type": "lost", "lemma": None})
    fake.tables["word_states_log"] = [
        {"session_id": OTHER_SESSION, "student_id": OTHER_STUDENT, "lemma": "chaleur", "state": "green"},
        {"session_id": OTHER_SESSION, "student_id": OTHER_STUDENT, "lemma": "déchet", "state": "yellow"},
    ]
    fake.tables["concept_gaps"] = [
        {"session_id": OTHER_SESSION, "student_id": OTHER_STUDENT, "lesson_id": L1, "concept": "La chaleur",
         "minutes": [12], "lemmas": ["chaleur"], "status": "review", "attempts": 1, "answered_at": None},
        {"session_id": "elsewhere", "student_id": OTHER_STUDENT, "lesson_id": EMPTY_LESSON, "concept": "Autre leçon",
         "minutes": [1], "lemmas": [], "status": "pending", "attempts": 0, "answered_at": None},
    ]
    return fake


def client_as(db, monkeypatch, user_id=TEACHER, role="teacher"):
    monkeypatch.setattr(roles, "fetch_profile", lambda _: Profile(display_name=None, role=role))
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_supabase] = lambda: db
    if user_id:
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(id=user_id, email="prof@example.com")
    return TestClient(app)


def get(client, lesson=L1):
    return client.get(f"/api/teacher/lessons/{lesson}/dashboard")


def test_dashboard_aggregates_the_lesson(db, monkeypatch):
    response = get(client_as(db, monkeypatch))
    assert response.status_code == 200
    assert response.json() == {
        "lesson": {"id": L1, "title": "La chaleur"},
        "lost_peaks": [{"minute": 12, "count": 1}],
        "unclear_peaks": [{"minute": 0, "count": 1}],
        "concept_gaps": [{"student": "Lucía (semaine 4)", "concept": "La chaleur", "minutes": [12],
                          "lemmas": ["chaleur"], "status": "review", "attempts": 1}],
        "top_words": [{"lemma": "chaleur", "taps": 1}],
        "students": [{"name": "Lucía (semaine 4)", "autonomy": 0.5,
                      "weekly": [{"week": "2026-W47", "autonomy": 0.5}]}],
    }


def test_lesson_without_sessions_is_empty(db, monkeypatch):
    body = get(client_as(db, monkeypatch), EMPTY_LESSON).json()
    assert (body["lost_peaks"], body["unclear_peaks"], body["top_words"], body["students"]) == ([], [], [], [])
    assert [g["concept"] for g in body["concept_gaps"]] == ["Autre leçon"]


def test_unknown_lesson_is_404(db, monkeypatch):
    assert get(client_as(db, monkeypatch), UNKNOWN_LESSON).status_code == 404


def test_other_teacher_is_403(db, monkeypatch):
    response = get(client_as(db, monkeypatch, user_id="00000000-0000-4000-8000-0000000000aa"))
    assert (response.status_code, response.json()["detail"]) == (403, "Not your lesson")


def test_student_is_403_and_anonymous_401(db, monkeypatch):
    assert get(client_as(db, monkeypatch, role="student")).status_code == 403
    assert get(client_as(db, monkeypatch, user_id=None)).status_code == 401

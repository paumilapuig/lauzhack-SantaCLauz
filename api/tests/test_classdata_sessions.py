import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
from app.auth import get_current_user
from app.db import get_supabase
from app.routers.classdata_sessions import router
from app.schemas import CurrentUser, Profile
from tests.classdata_seed import L1, OTHER_SESSION, STUDENT, STUDENT_SESSION, seeded_fake

USER = CurrentUser(id=STUDENT, email="lucia@example.com")
LESSON_SESSION = "20000000-0000-4000-8000-000000000009"


@pytest.fixture
def db():
    return seeded_fake()


@pytest.fixture
def role(monkeypatch):
    state = {"role": "student"}
    monkeypatch.setattr(
        roles, "fetch_profile", lambda user_id: Profile(display_name=None, role=state["role"])
    )
    return state


@pytest.fixture
def client(db, role):
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: USER
    app.dependency_overrides[get_supabase] = lambda: db
    return TestClient(app)


@pytest.fixture
def anonymous(db):
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_supabase] = lambda: db
    return TestClient(app)


def _l1_session(client):
    return client.post("/api/sessions", json={"lesson_id": L1}).json()["session_id"]


def _lost(client, session=None, t_sec=100.0, transcript="Elle produit des déchets."):
    session = session or _l1_session(client)
    body = {"t_sec": t_sec, "type": "lost", "lemma": None, "context": {"t_start": 40.0, "transcript": transcript}}
    return client.post(f"/api/sessions/{session}/events", json=body)


def test_create_session_stores_row(client, db):
    response = client.post("/api/sessions", json={"lesson_id": L1})
    assert response.status_code == 200
    stored = [r for r in db.tables["class_sessions"] if r["id"] == response.json()["session_id"]]
    assert (stored[0]["lesson_id"], stored[0]["student_id"]) == (L1, STUDENT)


def test_create_session_requires_token(anonymous):
    assert anonymous.post("/api/sessions", json={"lesson_id": L1}).status_code == 401


def test_create_session_teacher_forbidden(client, role):
    role["role"] = "teacher"
    assert client.post("/api/sessions", json={"lesson_id": L1}).status_code == 403


def test_create_session_unknown_lesson_404(client):
    response = client.post("/api/sessions", json={"lesson_id": LESSON_SESSION})
    assert (response.status_code, response.json()["detail"]) == (404, "Lesson not found")


def test_create_session_bad_uuid_422(client):
    assert client.post("/api/sessions", json={"lesson_id": "nope"}).status_code == 422


def test_lost_event_stores_text_only_context(client, db):
    response = _lost(client)
    assert (response.status_code, response.json()) == (200, {"ok": True})
    stored = db.tables["class_events"][-1]
    assert (stored["type"], stored["lemma"], stored["t_sec"]) == ("lost", None, 100.0)
    assert (stored["context_t_start"], stored["context_transcript"]) == (40.0, "Elle produit des déchets.")


def test_lost_event_never_touches_mastery(client, db):
    before = list(db.tables["word_mastery"])
    _lost(client)
    assert db.tables["word_mastery"] == before


def test_events_require_token(anonymous):
    body = {"t_sec": 1, "type": "lost"}
    assert anonymous.post(f"/api/sessions/{STUDENT_SESSION}/events", json=body).status_code == 401


def test_events_teacher_forbidden(client, role):
    session = _l1_session(client)
    role["role"] = "teacher"
    assert _lost(client, session).status_code == 403


@pytest.mark.parametrize("session", [OTHER_SESSION, LESSON_SESSION])
def test_events_foreign_or_unknown_session_404_without_writes(client, db, session):
    before = len(db.tables["class_events"])
    response = _lost(client, session)
    assert (response.status_code, response.json()["detail"]) == (404, "Session not found")
    assert len(db.tables["class_events"]) == before


@pytest.mark.parametrize("body", [
    {"t_sec": 3, "type": "word", "lemma": "déchet"},
    {"t_sec": 1, "type": "unclear"},
    {"t_sec": 1, "type": "lost"},
], ids=["word", "unclear", "lost-without-context"])
def test_rejected_event_422_without_writes(client, db, body):
    session = _l1_session(client)
    before = (len(db.tables["class_events"]), list(db.tables["word_mastery"]))
    assert client.post(f"/api/sessions/{session}/events", json=body).status_code == 422
    assert (len(db.tables["class_events"]), db.tables["word_mastery"]) == before

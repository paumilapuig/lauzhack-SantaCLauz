import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import roles
from app.auth import get_current_user
from app.db import get_supabase
from app.routers import classdata_session_repository as session_repo
from app.routers.classdata_word_states import router
from app.schemas import CurrentUser, Profile
from tests.classdata_seed import L1, OTHER_SESSION, STUDENT, seeded_fake


@pytest.fixture
def db():
    return seeded_fake()


@pytest.fixture
def session_id(db):
    return session_repo.insert_session(db, L1, STUDENT)


@pytest.fixture
def client(db, monkeypatch):
    monkeypatch.setattr(roles, "fetch_profile", lambda user_id: Profile(display_name=None, role="student"))
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_supabase] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(id=STUDENT, email="lucia@example.com")
    return TestClient(app)


def post(client, session, states):
    return client.post(f"/api/sessions/{session}/word-states", json={"states": states})


def entry(lemma, state):
    return {"lemma": lemma, "state": state}


THREE = [entry("mitochondrie", "green"), entry("chaleur", "green"), entry("déchet", "yellow")]


def test_autonomy_is_green_share_and_rows_are_stored(client, db, session_id):
    response = post(client, session_id, THREE)
    assert response.status_code == 200
    assert response.json() == {"ok": True, "autonomy": pytest.approx(2 / 3)}
    assert len(db.tables["word_states_log"]) == 3


def test_resend_keeps_three_rows(client, db, session_id):
    post(client, session_id, THREE)
    post(client, session_id, THREE)
    assert len(db.tables["word_states_log"]) == 3


def test_empty_states_give_zero_autonomy(client, session_id):
    response = post(client, session_id, [])
    assert response.status_code == 200
    assert response.json() == {"ok": True, "autonomy": 0.0}


def test_duplicate_lemma_is_422(client, session_id):
    assert post(client, session_id, [entry("chaleur", "green"), entry("chaleur", "yellow")]).status_code == 422


def test_unknown_lemma_is_422_and_nothing_stored(client, db, session_id):
    assert post(client, session_id, [entry("chaleur", "green"), entry("zzz", "green")]).status_code == 422
    assert db.tables["word_states_log"] == []


def test_foreign_session_is_404_and_nothing_stored(client, db):
    response = post(client, OTHER_SESSION, THREE)
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"
    assert db.tables["word_states_log"] == []


def test_without_token_is_401(db):
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_supabase] = lambda: db
    assert post(TestClient(app), OTHER_SESSION, []).status_code == 401


def test_teacher_is_403(client, session_id, monkeypatch):
    monkeypatch.setattr(roles, "fetch_profile", lambda user_id: Profile(display_name=None, role="teacher"))
    assert post(client, session_id, THREE).status_code == 403

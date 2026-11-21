import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
from app.auth import get_current_user
from app.db import get_supabase
from app.routers import classdata
from app.schemas import CurrentUser, Profile
from tests.classdata_seed import L0, L1, STUDENT, TEACHER, seeded_fake

UNKNOWN = "10000000-0000-4000-8000-0000000000ff"


def _build_app(user: CurrentUser | None) -> FastAPI:
    throwaway = FastAPI()
    throwaway.include_router(classdata.router)
    throwaway.dependency_overrides[get_supabase] = seeded_fake
    if user is not None:
        throwaway.dependency_overrides[get_current_user] = lambda: user
    return throwaway


def _client_as(monkeypatch, user_id: str | None, role: str | None = None) -> TestClient:
    user = None if user_id is None else CurrentUser(id=user_id, email="x@example.com")
    profile = None if role is None else Profile(display_name=None, role=role)
    monkeypatch.setattr(roles, "fetch_profile", lambda _id: profile)
    return TestClient(_build_app(user))


@pytest.mark.parametrize("user_id", [STUDENT, TEACHER])
def test_lessons_listed_for_any_role_newest_first(monkeypatch, user_id):
    client = _client_as(monkeypatch, user_id)
    response = client.get("/api/lessons")
    assert response.status_code == 200
    assert response.json() == [
        {"id": L1, "title": "La chaleur", "subject": "Physique", "lesson_date": "2026-11-22"},
        {"id": L0, "title": "Old lesson", "subject": None, "lesson_date": "2026-11-15"},
    ]


def test_lessons_without_token_is_401(monkeypatch):
    assert _client_as(monkeypatch, None).get("/api/lessons").status_code == 401


def test_class_pack_for_student(monkeypatch):
    client = _client_as(monkeypatch, STUDENT, "student")
    response = client.get(f"/api/lessons/{L1}/class-pack")
    assert response.status_code == 200
    body = response.json()
    assert body["lesson"] == {
        "id": L1, "title": "La chaleur", "subject": "Physique", "lesson_date": "2026-11-22",
    }
    assert {t["lemma"] for t in body["terms"]} == {"mitochondrie", "déchet", "chaleur"}
    assert body["mastery"] == {"mitochondrie": 3, "déchet": 1, "chaleur": 0}
    assert body["previously_tapped"] == ["chaleur"]


def test_class_pack_without_token_is_401(monkeypatch):
    assert _client_as(monkeypatch, None).get(f"/api/lessons/{L1}/class-pack").status_code == 401


def test_class_pack_for_teacher_is_403(monkeypatch):
    client = _client_as(monkeypatch, TEACHER, "teacher")
    assert client.get(f"/api/lessons/{L1}/class-pack").status_code == 403


def test_class_pack_unknown_lesson_is_404(monkeypatch):
    client = _client_as(monkeypatch, STUDENT, "student")
    assert client.get(f"/api/lessons/{UNKNOWN}/class-pack").status_code == 404


def test_class_pack_malformed_id_is_422(monkeypatch):
    client = _client_as(monkeypatch, STUDENT, "student")
    assert client.get("/api/lessons/not-a-uuid/class-pack").status_code == 422

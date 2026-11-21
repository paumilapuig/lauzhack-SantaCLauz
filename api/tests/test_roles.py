import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
from app.auth import get_current_user
from app.schemas import CurrentUser, Profile

USER = CurrentUser(id="user-1", email="lucia@example.com")


def _build_app() -> FastAPI:
    throwaway = FastAPI()

    @throwaway.get("/student-only")
    def student_only(user: roles.StudentUser):
        return {"id": user.id}

    @throwaway.get("/teacher-only")
    def teacher_only(user: roles.TeacherUser):
        return {"id": user.id}

    return throwaway


@pytest.fixture
def client():
    throwaway = _build_app()
    throwaway.dependency_overrides[get_current_user] = lambda: USER
    return TestClient(throwaway)


def _profile_with_role(monkeypatch, role):
    profile = None if role is None else Profile(display_name=None, role=role)
    monkeypatch.setattr(roles, "fetch_profile", lambda user_id: profile)


def test_missing_token_gives_401():
    response = TestClient(_build_app()).get("/student-only")

    assert response.status_code == 401


def test_teacher_on_student_route_gives_403(client, monkeypatch):
    _profile_with_role(monkeypatch, "teacher")

    response = client.get("/student-only")

    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden: student role required"


def test_missing_profile_gives_403(client, monkeypatch):
    _profile_with_role(monkeypatch, None)

    assert client.get("/student-only").status_code == 403


def test_student_on_student_route_gives_200(client, monkeypatch):
    _profile_with_role(monkeypatch, "student")

    response = client.get("/student-only")

    assert response.status_code == 200
    assert response.json() == {"id": "user-1"}


def test_teacher_on_teacher_route_gives_200(client, monkeypatch):
    _profile_with_role(monkeypatch, "teacher")

    assert client.get("/teacher-only").status_code == 200

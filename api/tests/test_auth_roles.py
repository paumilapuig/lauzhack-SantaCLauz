import pytest
from fastapi import HTTPException

import app.auth_roles as auth_roles
from app.schemas import CurrentUser, Profile

USER = CurrentUser(id="user-1", email="prof@example.com")


def _profile_with_role(role):
    return lambda user_id: Profile(display_name="x", role=role)


def test_teacher_passes(monkeypatch):
    monkeypatch.setattr(auth_roles, "fetch_profile", _profile_with_role("teacher"))

    assert auth_roles.require_teacher(USER) == USER


def test_student_is_forbidden(monkeypatch):
    monkeypatch.setattr(auth_roles, "fetch_profile", _profile_with_role("student"))

    with pytest.raises(HTTPException) as error:
        auth_roles.require_teacher(USER)

    assert error.value.status_code == 403


def test_missing_profile_is_forbidden(monkeypatch):
    monkeypatch.setattr(auth_roles, "fetch_profile", lambda user_id: None)

    with pytest.raises(HTTPException) as error:
        auth_roles.require_teacher(USER)

    assert error.value.status_code == 403

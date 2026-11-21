import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.auth import get_current_user
from app.schemas import CurrentUser, Profile

USER = CurrentUser(id="user-1", email="lucia@example.com")


@pytest.fixture
def client():
    main.app.dependency_overrides[get_current_user] = lambda: USER
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def test_me_returns_profile_fields(client, monkeypatch):
    monkeypatch.setattr(
        main, "fetch_profile", lambda user_id: Profile(display_name="lucia-w1", role="student")
    )

    response = client.get("/api/me")

    assert response.status_code == 200
    assert response.json() == {
        "id": "user-1",
        "email": "lucia@example.com",
        "display_name": "lucia-w1",
        "role": "student",
    }


def test_me_looks_up_profile_by_user_id(client, monkeypatch):
    requested_ids = []

    def fake_fetch(user_id):
        requested_ids.append(user_id)
        return Profile(display_name=None, role="teacher")

    monkeypatch.setattr(main, "fetch_profile", fake_fetch)

    client.get("/api/me")

    assert requested_ids == ["user-1"]


def test_me_without_profile_is_404(client, monkeypatch):
    monkeypatch.setattr(main, "fetch_profile", lambda user_id: None)

    response = client.get("/api/me")

    assert response.status_code == 404
    assert response.json() == {"detail": "Profile not found"}

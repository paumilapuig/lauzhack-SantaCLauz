from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_is_public_and_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_me_without_token_is_401():
    response = client.get("/api/me")

    assert response.status_code == 401


def test_me_with_garbage_token_is_401():
    response = client.get("/api/me", headers={"Authorization": "Bearer not-a-jwt"})

    assert response.status_code == 401

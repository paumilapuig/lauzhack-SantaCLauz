import pytest
from fastapi.testclient import TestClient

import app.main as main

UUID = "10000000-0000-4000-8000-000000000001"

ROUTES = [
    ("get", "/api/lessons", None),
    ("get", f"/api/lessons/{UUID}/class-pack", None),
    ("post", "/api/sessions", {"lesson_id": UUID}),
    ("post", f"/api/sessions/{UUID}/events", {"t_sec": 1, "type": "lost"}),
    ("post", f"/api/sessions/{UUID}/word-states", {"states": []}),
]


@pytest.mark.parametrize("method,path,body", ROUTES)
def test_class_routes_require_token(method, path, body):
    response = getattr(TestClient(main.app), method)(path, **({"json": body} if body else {}))

    assert response.status_code == 401


def test_clips_route_requires_token():
    response = TestClient(main.app).post("/api/clips")

    assert response.status_code == 401

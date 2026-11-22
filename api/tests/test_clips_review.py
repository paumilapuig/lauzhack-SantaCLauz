import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
from app.auth import get_current_user
from app.db import get_supabase
from app.routers.clips_review import router
from app.schemas import CurrentUser, Profile
from tests.classdata_seed import OTHER_STUDENT, STUDENT, STUDENT_SESSION, seeded_fake

CLIP = "40000000-0000-4000-8000-000000000001"
FOREIGN_CLIP = "40000000-0000-4000-8000-000000000002"


@pytest.fixture
def db():
    fake = seeded_fake()
    fake.tables["clips"] = [
        {"id": CLIP, "session_id": STUDENT_SESSION, "student_id": STUDENT, "reviewed_at": None},
        {"id": FOREIGN_CLIP, "session_id": STUDENT_SESSION, "student_id": OTHER_STUDENT, "reviewed_at": None},
    ]
    return fake


@pytest.fixture
def client(db, monkeypatch):
    monkeypatch.setattr(roles, "fetch_profile", lambda user_id: Profile(display_name=None, role="student"))
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_supabase] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(id=STUDENT, email="lucia@example.com")
    return TestClient(app)


def _row(db, clip_id):
    return next(row for row in db.tables["clips"] if row["id"] == clip_id)


def test_marks_own_clip_as_reviewed(client, db):
    response = client.post(f"/api/clips/{CLIP}/reviewed")
    assert (response.status_code, response.json()) == (200, {"ok": True})
    assert _row(db, CLIP)["reviewed_at"] is not None


def test_foreign_clip_is_404_and_untouched(client, db):
    assert client.post(f"/api/clips/{FOREIGN_CLIP}/reviewed").status_code == 404
    assert _row(db, FOREIGN_CLIP)["reviewed_at"] is None


def test_requires_token(db):
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_supabase] = lambda: db
    assert TestClient(app).post(f"/api/clips/{CLIP}/reviewed").status_code == 401

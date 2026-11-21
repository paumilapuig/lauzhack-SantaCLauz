from io import BytesIO

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
import app.routers.clips as clips_module
from app.auth import get_current_user
from app.db import get_supabase
from app.routers.clips import router
from app.routers.clips_storage import signed_clip_url
from app.schemas import CurrentUser, Profile
from tests.classdata_seed import OTHER_SESSION, STUDENT, STUDENT_SESSION, seeded_fake

USER = CurrentUser(id=STUDENT, email="lucia@example.com")
UNKNOWN_SESSION = "20000000-0000-4000-8000-0000000000ff"
FIXED_ID = "30000000-0000-4000-8000-000000000001"
AUDIO = b"webm-bytes"


@pytest.fixture
def db():
    fake = seeded_fake()
    fake.tables["clips"] = []
    return fake


@pytest.fixture
def role(monkeypatch):
    state = {"role": "student"}
    monkeypatch.setattr(
        roles, "fetch_profile", lambda user_id: Profile(display_name=None, role=state["role"])
    )
    return state


def _client(db, authenticated=True):
    app = FastAPI()
    app.include_router(router)
    if authenticated:
        app.dependency_overrides[get_current_user] = lambda: USER
    app.dependency_overrides[get_supabase] = lambda: db
    return TestClient(app)


@pytest.fixture
def client(db, role):
    return _client(db)


def post_clip(client, data=AUDIO, content_type="audio/webm;codecs=opus", **overrides):
    form = {"session_id": STUDENT_SESSION, "t_start": "10", "t_end": "40", "transcript": "bonjour"}
    form.update(overrides)
    return client.post("/api/clips", data=form, files={"audio": ("clip.webm", BytesIO(data), content_type)})


def stored_objects(db):
    return db.storage.objects.get("clips", {})


def snapshot(db):
    return len(stored_objects(db)), len(db.tables["clips"]), len(db.tables["class_events"])


def test_create_clip_stores_object_row_and_event(client, db):
    events_before = len(db.tables["class_events"])
    response = post_clip(client)
    assert response.status_code == 200
    body = response.json()
    assert body["audio_path"] == f"{STUDENT}/{body['clip_id']}.webm"
    assert stored_objects(db)[body["audio_path"]]["data"] == AUDIO
    (row,) = db.tables["clips"]
    assert (row["id"], row["session_id"], row["student_id"]) == (body["clip_id"], STUDENT_SESSION, STUDENT)
    assert (row["t_start"], row["t_end"], row["transcript"]) == (10, 40, "bonjour")
    assert row["audio_path"] == body["audio_path"]
    new_events = db.tables["class_events"][events_before:]
    assert [(e["type"], e["t_sec"], e["lemma"]) for e in new_events] == [("unclear", 40, None)]
    assert "fake.storage" in signed_clip_url(db, body["audio_path"])


def test_requires_token(db, role):
    assert post_clip(_client(db, authenticated=False)).status_code == 401
    assert snapshot(db) == (0, 0, len(db.tables["class_events"]))


def test_teacher_forbidden(client, role):
    role["role"] = "teacher"
    assert post_clip(client).status_code == 403


@pytest.mark.parametrize("session_id", [OTHER_SESSION, UNKNOWN_SESSION])
def test_foreign_or_unknown_session_404(client, db, session_id):
    before = snapshot(db)
    response = post_clip(client, session_id=session_id)
    assert (response.status_code, response.json()["detail"]) == (404, "Session not found")
    assert snapshot(db) == before


@pytest.mark.parametrize(
    "kwargs, status, detail",
    [
        ({"content_type": "audio/ogg"}, 415, "Audio must be audio/webm"),
        ({"data": b"x" * (2 * 1024 * 1024 + 1)}, 413, "Audio larger than 2 MB"),
        ({"data": b""}, 422, "Empty audio"),
        ({"t_end": "5"}, 422, "t_end must be greater than t_start"),
        ({"t_start": "-1"}, 422, None),
        ({"session_id": "not-a-uuid"}, 422, None),
    ],
)
def test_rejected_requests_change_nothing(client, db, kwargs, status, detail):
    before = snapshot(db)
    response = post_clip(client, **kwargs)
    assert response.status_code == status
    if detail:
        assert response.json()["detail"] == detail
    assert snapshot(db) == before


def test_clip_insert_failure_removes_object(client, db):
    del db.tables["clips"]
    events_before = len(db.tables["class_events"])
    response = post_clip(client)
    assert (response.status_code, response.json()["detail"]) == (500, "Could not save clip")
    assert stored_objects(db) == {}
    assert len(db.tables["class_events"]) == events_before


def test_event_insert_failure_removes_clip_and_object(client, db):
    del db.tables["class_events"]
    response = post_clip(client)
    assert (response.status_code, response.json()["detail"]) == (500, "Could not save clip")
    assert stored_objects(db) == {}
    assert db.tables["clips"] == []


def test_object_removed_even_if_clip_delete_fails(client, db, monkeypatch):
    del db.tables["class_events"]

    real_table = db.table

    class _BrokenDelete:
        def __init__(self, query):
            self._query = query

        def __getattr__(self, name):
            if name == "delete":
                raise RuntimeError("db down")
            return getattr(self._query, name)

    monkeypatch.setattr(db, "table", lambda name: _BrokenDelete(real_table(name)) if name == "clips" else real_table(name))
    assert post_clip(client).status_code == 500
    assert stored_objects(db) == {}


def test_duplicate_object_gives_500_without_rows(client, db, monkeypatch):
    monkeypatch.setattr(clips_module, "uuid4", lambda: FIXED_ID)
    db.storage.from_("clips").upload(f"{STUDENT}/{FIXED_ID}.webm", b"old", {"upsert": "false"})
    events_before = len(db.tables["class_events"])
    response = post_clip(client)
    assert (response.status_code, response.json()["detail"]) == (500, "Could not store audio")
    assert db.tables["clips"] == []
    assert len(db.tables["class_events"]) == events_before

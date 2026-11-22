import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import roles
from app.auth import get_current_user
from app.db import get_supabase
from app.routers.teacher_courses import router
from app.schemas import CurrentUser, Profile
from tests.classdata_seed import L0, L1, TEACHER, seeded_fake

OTHER_TEACHER = "00000000-0000-4000-8000-0000000000aa"
BIO = "60000000-0000-4000-8000-000000000001"
OTHERS_COURSE = "60000000-0000-4000-8000-000000000002"
UNKNOWN = "60000000-0000-4000-8000-0000000000ff"


@pytest.fixture
def db():
    fake = seeded_fake()
    fake.tables["courses"] = [
        {"id": BIO, "teacher_id": TEACHER, "name": "Biologie 1re"},
        {"id": OTHERS_COURSE, "teacher_id": OTHER_TEACHER, "name": "Histoire 2e"},
    ]
    fake.tables["lessons"][1]["course_id"] = BIO
    return fake


def client_as(db, monkeypatch, user_id=TEACHER, role="teacher"):
    monkeypatch.setattr(roles, "fetch_profile", lambda _: Profile(display_name=None, role=role))
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_supabase] = lambda: db
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(id=user_id, email="prof@example.com")
    return TestClient(app)


def test_lists_only_her_courses_with_their_lesson_count(db, monkeypatch):
    response = client_as(db, monkeypatch).get("/api/teacher/courses")
    assert response.status_code == 200
    assert response.json() == [{"id": BIO, "name": "Biologie 1re", "lesson_count": 1}]


def test_courses_are_sorted_by_name(db, monkeypatch):
    db.tables["courses"].append({"id": "60000000-0000-4000-8000-000000000003", "teacher_id": TEACHER, "name": "Arts 1re"})
    names = [c["name"] for c in client_as(db, monkeypatch).get("/api/teacher/courses").json()]
    assert names == ["Arts 1re", "Biologie 1re"]


def test_creates_a_course_with_a_trimmed_name(db, monkeypatch):
    response = client_as(db, monkeypatch).post("/api/teacher/courses", json={"name": "  Chimie 2e  "})
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Chimie 2e" and body["lesson_count"] == 0
    stored = next(c for c in db.tables["courses"] if c["id"] == body["id"])
    assert stored["teacher_id"] == TEACHER and stored["name"] == "Chimie 2e"


@pytest.mark.parametrize("name", ["", "   ", "x" * 81])
def test_rejects_a_blank_or_too_long_name(db, monkeypatch, name):
    response = client_as(db, monkeypatch).post("/api/teacher/courses", json={"name": name})
    assert response.status_code == 422


def test_students_cannot_use_courses(db, monkeypatch):
    client = client_as(db, monkeypatch, role="student")
    assert client.get("/api/teacher/courses").status_code == 403
    assert client.post("/api/teacher/courses", json={"name": "Bio"}).status_code == 403


def test_moves_a_lesson_into_her_course_and_out_again(db, monkeypatch):
    client = client_as(db, monkeypatch)
    response = client.patch(f"/api/teacher/lessons/{L0}", json={"course_id": BIO})
    assert response.status_code == 200
    assert response.json() == {"id": L0, "course_id": BIO}
    assert db.tables["lessons"][0]["course_id"] == BIO
    assert client.patch(f"/api/teacher/lessons/{L0}", json={"course_id": None}).json() == {"id": L0, "course_id": None}
    assert db.tables["lessons"][0]["course_id"] is None


def test_cannot_move_into_a_course_that_is_not_hers(db, monkeypatch):
    client = client_as(db, monkeypatch)
    for course in (OTHERS_COURSE, UNKNOWN):
        response = client.patch(f"/api/teacher/lessons/{L0}", json={"course_id": course})
        assert response.status_code == 422
        assert response.json()["detail"] == "Unknown course"
    assert "course_id" not in db.tables["lessons"][0]


def test_cannot_move_a_lesson_that_is_not_hers(db, monkeypatch):
    response = client_as(db, monkeypatch, user_id=OTHER_TEACHER).patch(f"/api/teacher/lessons/{L1}", json={"course_id": None})
    assert response.status_code == 403
    assert response.json()["detail"] == "Not your lesson"


def test_moving_an_unknown_lesson_is_404(db, monkeypatch):
    response = client_as(db, monkeypatch).patch(f"/api/teacher/lessons/{UNKNOWN}", json={"course_id": None})
    assert response.status_code == 404

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.roles as roles
from app.auth import get_current_user
from app.db import get_supabase
from app.routers import classdata_session_repository as session_repo
from app.routers import clips_repository
from app.routers.clips_marks import router
from app.schemas import CurrentUser, Profile
from tests.classdata_seed import L1, OTHER_CLIP, STUDENT, seeded_fake

USER = CurrentUser(id=STUDENT, email="lucia@example.com")
UNKNOWN_CLIP = "50000000-0000-4000-8000-0000000000ff"


@pytest.fixture
def db():
    return seeded_fake()


@pytest.fixture
def role(monkeypatch):
    state = {"role": "student"}
    monkeypatch.setattr(roles, "fetch_profile", lambda user_id: Profile(display_name=None, role=state["role"]))
    return state


@pytest.fixture
def client(db, role):
    app = FastAPI()
    app.include_router(router)
    app.dependency_overrides[get_current_user] = lambda: USER
    app.dependency_overrides[get_supabase] = lambda: db
    return TestClient(app)


def new_clip(db, session=None) -> str:
    session = session or session_repo.insert_session(db, L1, STUDENT)
    clip_id = f"60000000-0000-4000-8000-{len(db.tables['clips']):012d}"
    clips_repository.insert_clip(db, clip_id, session, STUDENT, 0.0, 10.0, "des déchets", None, "word", None)
    return clip_id


def mark(client, clip, word):
    return client.post(f"/api/clips/{clip}/marks", json={"word": word})


def unmark(client, clip, word):
    return client.delete(f"/api/clips/{clip}/marks/{word}")


def level(db, lemma):
    rows = [r for r in db.tables["word_mastery"] if r["student_id"] == STUDENT and r["lemma"] == lemma]
    return (rows[0]["level"], rows[0]["times_tapped"]) if rows else None


def marks(db, clip):
    return [r["word"] for r in db.tables["clip_marks"] if r["clip_id"] == clip]


def test_glossary_mark_lowers_level_once_and_returns_translation(client, db):
    clip = new_clip(db)
    response = mark(client, clip, "Déchets ")
    assert (response.status_code, response.json()) == (
        200, {"word": "déchets", "lemma": "déchet", "translation_es": "desecho", "level": 0})
    assert marks(db, clip) == ["déchets"]
    assert level(db, "déchet") == (0, 3)
    assert [r["level_delta"] for r in db.tables["mark_level_changes"]] == [-1]


def test_first_mark_without_mastery_row_starts_from_initial_level(client, db):
    response = mark(client, new_clip(db), "mitochondrie")
    assert response.json()["level"] == 2
    assert level(db, "mitochondrie") == (2, 1)


def test_same_lemma_again_in_the_session_changes_nothing(client, db):
    session = session_repo.insert_session(db, L1, STUDENT)
    first, second = new_clip(db, session), new_clip(db, session)
    mark(client, first, "chaleur")
    mark(client, first, "chaleur")
    response = mark(client, second, "chaleur")
    assert response.json()["level"] == 0
    assert level(db, "chaleur") == (0, 1)
    assert len(db.tables["mark_level_changes"]) == 1
    assert (marks(db, first), marks(db, second)) == (["chaleur"], ["chaleur"])


def test_mark_in_another_session_lowers_again(client, db):
    mark(client, new_clip(db), "mitochondrie")
    assert mark(client, new_clip(db), "mitochondrie").json()["level"] == 1


def test_word_outside_glossary_is_stored_without_level(client, db):
    clip = new_clip(db)
    response = mark(client, clip, "hier")
    assert response.json() == {"word": "hier", "lemma": None, "translation_es": None, "level": None}
    assert marks(db, clip) == ["hier"]
    assert db.tables["mark_level_changes"] == []


def test_undo_last_mark_gives_the_level_back(client, db):
    clip = new_clip(db)
    mark(client, clip, "déchets")
    response = unmark(client, clip, "déchets")
    assert (response.status_code, response.json()) == (200, {"ok": True, "level": 1})
    assert marks(db, clip) == []
    assert level(db, "déchet") == (1, 2)
    assert db.tables["mark_level_changes"] == []


def test_undo_at_level_zero_does_not_add_a_level(client, db):
    clip = new_clip(db)
    mark(client, clip, "chaleur")
    assert unmark(client, clip, "chaleur").json()["level"] == 0
    assert level(db, "chaleur") == (0, 0)


def test_undo_keeps_the_change_while_another_mark_of_the_lemma_remains(client, db):
    session = session_repo.insert_session(db, L1, STUDENT)
    first, second = new_clip(db, session), new_clip(db, session)
    mark(client, first, "déchets")
    mark(client, second, "déchet")
    assert unmark(client, first, "déchets").json()["level"] == 0
    assert len(db.tables["mark_level_changes"]) == 1
    assert unmark(client, second, "déchet").json()["level"] == 1


def test_undo_of_an_absent_mark_changes_nothing(client, db):
    clip = new_clip(db)
    response = unmark(client, clip, "déchets")
    assert response.json() == {"ok": True, "level": 1}
    assert level(db, "déchet") == (1, 2)


@pytest.mark.parametrize("call", [mark, unmark])
@pytest.mark.parametrize("clip", [OTHER_CLIP, UNKNOWN_CLIP])
def test_foreign_or_unknown_clip_is_404_without_writes(client, db, call, clip):
    before = (list(db.tables["clip_marks"]), list(db.tables["word_mastery"]))
    response = call(client, clip, "chaleur")
    assert (response.status_code, response.json()["detail"]) == (404, "Clip not found")
    assert (db.tables["clip_marks"], db.tables["word_mastery"]) == before


@pytest.mark.parametrize("word", ["", "   ", "x" * 81])
def test_empty_or_too_long_word_is_422(client, db, word):
    assert mark(client, new_clip(db), word).status_code == 422


def test_teacher_is_403(client, db, role):
    clip = new_clip(db)
    role["role"] = "teacher"
    assert mark(client, clip, "chaleur").status_code == 403
    assert unmark(client, clip, "chaleur").status_code == 403

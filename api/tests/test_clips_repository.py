import logging

from app.routers.clips_repository import delete_clip, insert_clip
from tests.classdata_seed import STUDENT, seeded_fake

CLIP_ID = "11111111-1111-1111-1111-111111111111"
SESSION_ID = "22222222-2222-2222-2222-222222222222"


def test_insert_clip_stores_row_with_given_id():
    db = seeded_fake()
    db.tables["clips"] = []

    insert_clip(db, CLIP_ID, SESSION_ID, STUDENT, 1.5, 31.5, "bonjour", f"{STUDENT}/{CLIP_ID}.webm")

    assert len(db.tables["clips"]) == 1
    row = db.tables["clips"][0]
    assert row["id"] == CLIP_ID
    assert {k: v for k, v in row.items() if k not in {"id", "created_at"}} == {
        "session_id": SESSION_ID,
        "student_id": STUDENT,
        "t_start": 1.5,
        "t_end": 31.5,
        "transcript": "bonjour",
        "audio_path": f"{STUDENT}/{CLIP_ID}.webm",
    }


def test_delete_clip_removes_row_by_id():
    db = seeded_fake()
    db.tables["clips"] = [{"id": CLIP_ID}, {"id": "other"}]

    delete_clip(db, CLIP_ID)

    assert db.tables["clips"] == [{"id": "other"}]


def test_delete_clip_does_not_raise_on_missing_table(caplog):
    db = seeded_fake()
    del db.tables["clips"]
    with caplog.at_level(logging.ERROR):
        delete_clip(db, CLIP_ID)

    assert CLIP_ID in caplog.text

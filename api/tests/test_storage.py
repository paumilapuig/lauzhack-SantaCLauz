import pytest

from app.storage import clip_object_path, remove_clip, signed_clip_url, upload_clip
from tests.classdata_seed import STUDENT, seeded_fake
from tests.fake_storage import FakeStorageError

CLIP_ID = "11111111-1111-1111-1111-111111111111"


def test_clip_object_path_is_student_slash_clip_webm():
    assert clip_object_path(STUDENT, CLIP_ID) == f"{STUDENT}/{CLIP_ID}.webm"


def test_upload_clip_stores_webm_content_type():
    db = seeded_fake()
    path = clip_object_path(STUDENT, CLIP_ID)

    upload_clip(db, path, b"audio")

    assert db.storage.objects["clips"][path] == {"data": b"audio", "content_type": "audio/webm"}


def test_upload_clip_duplicate_raises_and_keeps_original():
    db = seeded_fake()
    path = clip_object_path(STUDENT, CLIP_ID)
    upload_clip(db, path, b"first")

    with pytest.raises(FakeStorageError):
        upload_clip(db, path, b"second")

    assert db.storage.objects["clips"][path]["data"] == b"first"


def test_remove_clip_deletes_object():
    db = seeded_fake()
    path = clip_object_path(STUDENT, CLIP_ID)
    upload_clip(db, path, b"audio")

    remove_clip(db, path)

    assert path not in db.storage.objects["clips"]


def test_remove_clip_on_broken_bucket_does_not_raise():
    db = seeded_fake()

    class Broken:
        def from_(self, bucket):
            raise RuntimeError("storage down")

    db.storage = Broken()

    remove_clip(db, "any/path.webm")


def test_signed_clip_url_defaults_to_one_hour():
    db = seeded_fake()
    path = clip_object_path(STUDENT, CLIP_ID)
    upload_clip(db, path, b"audio")

    assert signed_clip_url(db, path) == f"https://fake.storage/clips/{path}?token=fake&expires=3600"


def test_signed_clip_url_honours_expires():
    db = seeded_fake()
    path = clip_object_path(STUDENT, CLIP_ID)
    upload_clip(db, path, b"audio")

    assert signed_clip_url(db, path, expires=60).endswith("expires=60")

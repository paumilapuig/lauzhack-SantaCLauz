import pytest
from tests.fake_storage import FakeStorageError
from tests.fake_supabase import FakeSupabase

PATH = "student/clip.webm"


def _bucket():
    db = FakeSupabase({})
    return db, db.storage.from_("clips")


def test_upload_stores_bytes_and_content_type():
    db, bucket = _bucket()
    bucket.upload(PATH, b"abc", {"content-type": "audio/webm", "upsert": "false"})
    assert db.storage.objects["clips"][PATH] == {"data": b"abc", "content_type": "audio/webm"}


def test_second_upload_without_upsert_raises():
    _, bucket = _bucket()
    bucket.upload(PATH, b"a", {"upsert": "false"})
    with pytest.raises(FakeStorageError):
        bucket.upload(PATH, b"b", {"upsert": "false"})


def test_upload_with_upsert_overwrites():
    db, bucket = _bucket()
    bucket.upload(PATH, b"a", {"upsert": "false"})
    bucket.upload(PATH, b"b", {"upsert": "true"})
    assert db.storage.objects["clips"][PATH]["data"] == b"b"


def test_signed_url_contains_path_and_expires():
    _, bucket = _bucket()
    bucket.upload(PATH, b"a", {})
    url = bucket.create_signed_url(PATH, 3600)["signedURL"]
    assert PATH in url and "expires=3600" in url


def test_signing_missing_path_raises():
    _, bucket = _bucket()
    with pytest.raises(FakeStorageError):
        bucket.create_signed_url(PATH, 60)


def test_remove_deletes_and_ignores_missing():
    db, bucket = _bucket()
    bucket.upload(PATH, b"a", {})
    bucket.remove([PATH, "nope"])
    assert PATH not in db.storage.objects["clips"]


def test_no_public_url():
    _, bucket = _bucket()
    assert not hasattr(bucket, "get_public_url")

"""Shared Supabase Storage helpers for the private `clips` bucket (reused by every router)."""

import logging

from supabase import Client

logger = logging.getLogger(__name__)

BUCKET = "clips"
CONTENT_TYPE = "audio/webm"


def clip_object_path(student_id: str, clip_id: str) -> str:
    return f"{student_id}/{clip_id}.webm"


def upload_clip(db: Client, path: str, data: bytes) -> None:
    """Raises if the object already exists (upsert is off)."""
    db.storage.from_(BUCKET).upload(path, data, {"content-type": CONTENT_TYPE, "upsert": "false"})


def remove_clip(db: Client, path: str) -> None:
    """Best-effort rollback: never raises, logs the failure."""
    try:
        db.storage.from_(BUCKET).remove([path])
    except Exception:
        logger.exception("Could not remove clip object %s during rollback", path)


def signed_clip_url(db: Client, path: str, expires: int = 3600) -> str:
    return db.storage.from_(BUCKET).create_signed_url(path, expires)["signedURL"]

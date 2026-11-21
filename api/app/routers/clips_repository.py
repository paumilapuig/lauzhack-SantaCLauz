"""Supabase reads and writes for the clips table."""

import logging

from supabase import Client

logger = logging.getLogger(__name__)


def insert_clip(
    db: Client,
    clip_id: str,
    session_id: str,
    student_id: str,
    t_start: float,
    t_end: float,
    transcript: str,
    audio_path: str,
) -> None:
    db.table("clips").insert({
        "id": clip_id,
        "session_id": session_id,
        "student_id": student_id,
        "t_start": t_start,
        "t_end": t_end,
        "transcript": transcript,
        "audio_path": audio_path,
    }).execute()


def delete_clip(db: Client, clip_id: str) -> None:
    """Best-effort rollback: never raises, logs the failure."""
    try:
        db.table("clips").delete().eq("id", clip_id).execute()
    except Exception:
        logger.exception("Could not delete clip %s during rollback", clip_id)

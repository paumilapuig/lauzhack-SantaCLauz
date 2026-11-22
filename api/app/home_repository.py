"""Supabase reads and storage signing for GET /api/home/review. Returns plain dicts."""

import logging

from supabase import Client

from app.storage import signed_clip_url

logger = logging.getLogger(__name__)


def fetch_student_clips(db: Client, student_id: str) -> list[dict]:
    result = (
        db.table("clips")
        .select("id, session_id, t_start, t_end, transcript, audio_path, created_at, reviewed_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def fetch_concept_gaps(db: Client, student_id: str) -> list[dict]:
    result = (
        db.table("concept_gaps")
        .select("id, lesson_id, concept, lemmas, explanation, exercises, status, created_at")
        .eq("student_id", student_id)
        .in_("status", ["pending", "review"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def fetch_sessions(db: Client, ids: list[str]) -> list[dict]:
    if not ids:
        return []
    return db.table("class_sessions").select("id, lesson_id").in_("id", ids).execute().data


def fetch_lessons(db: Client, ids: list[str]) -> list[dict]:
    if not ids:
        return []
    return db.table("lessons").select("id, title").in_("id", ids).execute().data


def fetch_lesson_terms(db: Client, lesson_ids: list[str]) -> list[dict]:
    if not lesson_ids:
        return []
    return (
        db.table("lesson_terms")
        .select("lesson_id, lemma, forms, translation_es, definition_fr, transparent")
        .in_("lesson_id", lesson_ids)
        .execute()
        .data
    )


def fetch_clip_marks(db: Client, student_id: str) -> list[dict]:
    result = (
        db.table("clip_marks")
        .select("clip_id, word, lemma, translation_es, definition_fr, created_at")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def fetch_mastery(db: Client, student_id: str, lemmas: list[str]) -> dict[str, int]:
    if not lemmas:
        return {}
    result = (
        db.table("word_mastery")
        .select("lemma, level")
        .eq("student_id", student_id)
        .in_("lemma", lemmas)
        .execute()
    )
    return {row["lemma"]: row["level"] for row in result.data}


def sign_audio(db: Client, clip_id: str, path: str) -> str | None:
    try:
        return signed_clip_url(db, path)
    except Exception:
        logger.warning("Could not sign audio for clip %s (path %s)", clip_id, path, exc_info=True)
        return None

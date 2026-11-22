"""Supabase reads for the teacher Dashboard; one query per table, filtered by the lesson's sessions."""

from supabase import Client


def get_lesson(db: Client, lesson_id: str) -> dict | None:
    result = db.table("lessons").select("id, title, teacher_id").eq("id", lesson_id).maybe_single().execute()
    return result.data if result else None


def lesson_sessions(db: Client, lesson_id: str) -> list[dict]:
    return db.table("class_sessions").select("id, student_id, started_at").eq("lesson_id", lesson_id).execute().data


def lost_events(db: Client, session_ids: list[str]) -> list[dict]:
    if not session_ids:
        return []
    return (
        db.table("class_events").select("t_sec").eq("type", "lost").in_("session_id", session_ids)
        .execute().data
    )


def clip_starts(db: Client, session_ids: list[str]) -> list[dict]:
    if not session_ids:
        return []
    return db.table("clips").select("t_start").in_("session_id", session_ids).execute().data


def word_states(db: Client, session_ids: list[str]) -> list[dict]:
    if not session_ids:
        return []
    return db.table("word_states_log").select("session_id, state").in_("session_id", session_ids).execute().data


def marks(db: Client, session_ids: list[str]) -> list[dict]:
    if not session_ids:
        return []
    clip_ids = [row["id"] for row in db.table("clips").select("id").in_("session_id", session_ids).execute().data]
    if not clip_ids:
        return []
    return db.table("clip_marks").select("lemma").in_("clip_id", clip_ids).execute().data


def concept_gaps(db: Client, lesson_id: str) -> list[dict]:
    return (
        db.table("concept_gaps").select("student_id, concept, minutes, lemmas, status, attempts")
        .eq("lesson_id", lesson_id).execute().data
    )


def display_names(db: Client, student_ids: list[str]) -> dict[str, str]:
    if not student_ids:
        return {}
    rows = db.table("profiles").select("id, display_name").in_("id", student_ids).execute().data
    return {row["id"]: row["display_name"] for row in rows if row["display_name"]}

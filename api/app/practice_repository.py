from datetime import datetime

from supabase import Client


def find_student_clip_lesson(db: Client, student_id: str, clip_id: str) -> str | None:
    clip = (
        db.table("clips").select("session_id")
        .eq("id", clip_id).eq("student_id", student_id).maybe_single().execute()
    )
    if clip is None or not clip.data:
        return None
    session = (
        db.table("class_sessions").select("lesson_id")
        .eq("id", clip.data["session_id"]).maybe_single().execute()
    )
    return session.data["lesson_id"] if session is not None and session.data else None


def find_term_transparent(db: Client, lemma: str, lesson_id: str | None) -> bool | None:
    query = db.table("lesson_terms").select("transparent").eq("lemma", lemma)
    if lesson_id is not None:
        query = query.eq("lesson_id", lesson_id)
    rows = query.limit(1).execute().data
    return rows[0]["transparent"] if rows else None


def fetch_level(db: Client, student_id: str, lemma: str) -> int | None:
    rows = (
        db.table("word_mastery").select("level")
        .eq("student_id", student_id).eq("lemma", lemma).limit(1).execute().data
    )
    return rows[0]["level"] if rows else None


def passed_on_day(db: Client, student_id: str, lemma: str, now: datetime) -> bool:
    """Whether this student already passed a practice of this word on `now`'s UTC day."""
    rows = (
        db.table("practice_results").select("created_at")
        .eq("student_id", student_id).eq("lemma", lemma).eq("passed", True).execute().data
    )
    day = now.date().isoformat()
    return any(str(row.get("created_at", ""))[:10] == day for row in rows)


def insert_practice_result(
    db: Client, student_id: str, lemma: str, clip_id: str | None, passed: bool, now: datetime
) -> None:
    db.table("practice_results").insert(
        {"student_id": student_id, "lemma": lemma, "clip_id": clip_id, "passed": passed, "created_at": now.isoformat()}
    ).execute()


def upsert_level(db: Client, student_id: str, lemma: str, level: int, now: datetime) -> None:
    db.table("word_mastery").upsert(
        {"student_id": student_id, "lemma": lemma, "level": level, "last_seen_at": now.isoformat()},
        on_conflict="student_id,lemma",
    ).execute()

"""Supabase reads and writes for words marked at home (clip_marks) and their level changes."""

from supabase import Client


def get_owned_clip(db: Client, clip_id: str, student_id: str) -> dict | None:
    result = (
        db.table("clips").select("id, session_id").eq("id", clip_id).eq("student_id", student_id)
        .maybe_single().execute()
    )
    return result.data if result else None


def has_mark(db: Client, student_id: str, clip_id: str, word: str) -> bool:
    rows = (
        db.table("clip_marks").select("word").eq("student_id", student_id).eq("clip_id", clip_id)
        .eq("word", word).execute().data
    )
    return bool(rows)


def insert_mark(db: Client, student_id: str, clip_id: str, word: str, lemma: str | None) -> None:
    db.table("clip_marks").insert(
        {"student_id": student_id, "clip_id": clip_id, "word": word, "lemma": lemma}
    ).execute()


def delete_mark(db: Client, student_id: str, clip_id: str, word: str) -> bool:
    removed = (
        db.table("clip_marks").delete().eq("student_id", student_id).eq("clip_id", clip_id)
        .eq("word", word).execute().data
    )
    return bool(removed)


def lemma_marked_in_session(db: Client, student_id: str, session_id: str, lemma: str) -> bool:
    clip_ids = [
        row["id"] for row in
        db.table("clips").select("id").eq("session_id", session_id).eq("student_id", student_id).execute().data
    ]
    if not clip_ids:
        return False
    rows = (
        db.table("clip_marks").select("word").eq("student_id", student_id).eq("lemma", lemma)
        .in_("clip_id", clip_ids).execute().data
    )
    return bool(rows)


def get_level_change(db: Client, student_id: str, session_id: str, lemma: str) -> dict | None:
    result = (
        db.table("mark_level_changes").select("level_delta").eq("student_id", student_id)
        .eq("session_id", session_id).eq("lemma", lemma).maybe_single().execute()
    )
    return result.data if result else None


def insert_level_change(db: Client, student_id: str, session_id: str, lemma: str, level_delta: int) -> None:
    db.table("mark_level_changes").insert(
        {"student_id": student_id, "session_id": session_id, "lemma": lemma, "level_delta": level_delta}
    ).execute()


def delete_level_change(db: Client, student_id: str, session_id: str, lemma: str) -> None:
    (
        db.table("mark_level_changes").delete().eq("student_id", student_id).eq("session_id", session_id)
        .eq("lemma", lemma).execute()
    )

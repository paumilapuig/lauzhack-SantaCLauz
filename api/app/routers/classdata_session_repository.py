"""Supabase reads and writes for class sessions, class events and word-state logs."""

from supabase import Client


def insert_session(db: Client, lesson_id: str, student_id: str) -> str:
    result = db.table("class_sessions").insert({"lesson_id": lesson_id, "student_id": student_id}).execute()
    return result.data[0]["id"]


def get_owned_session(db: Client, session_id: str, student_id: str) -> dict | None:
    result = (
        db.table("class_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )
    return result.data if result else None


def insert_event(
    db: Client, session_id: str, student_id: str, t_sec: float, event_type: str, lemma: str | None
) -> None:
    db.table("class_events").insert({
        "session_id": session_id,
        "student_id": student_id,
        "t_sec": t_sec,
        "type": event_type,
        "lemma": lemma,
    }).execute()


def insert_lost_event(
    db: Client, session_id: str, student_id: str, t_sec: float, context_t_start: float, transcript: str
) -> None:
    db.table("class_events").insert({
        "session_id": session_id,
        "student_id": student_id,
        "t_sec": t_sec,
        "type": "lost",
        "lemma": None,
        "context_t_start": context_t_start,
        "context_transcript": transcript,
    }).execute()


def upsert_word_states(db: Client, session_id: str, student_id: str, entries: list[tuple[str, str]]) -> None:
    if not entries:
        return
    rows = [
        {"session_id": session_id, "student_id": student_id, "lemma": lemma, "state": state}
        for lemma, state in entries
    ]
    db.table("word_states_log").upsert(rows, on_conflict="session_id,student_id,lemma").execute()


def session_states(db: Client, session_id: str, student_id: str) -> list[str]:
    result = (
        db.table("word_states_log")
        .select("state")
        .eq("session_id", session_id)
        .eq("student_id", student_id)
        .execute()
    )
    return [row["state"] for row in result.data]

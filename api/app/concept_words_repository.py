"""Supabase reads and writes for words tapped inside a concept explanation (concept_word_marks)."""

from supabase import Client

TABLE = "concept_word_marks"


def get_owned_gap(db: Client, gap_id: str, student_id: str) -> dict | None:
    result = (
        db.table("concept_gaps").select("id, session_id, lesson_id, explanation")
        .eq("id", gap_id).eq("student_id", student_id).maybe_single().execute()
    )
    return result.data if result is not None and result.data else None


def has_mark(db: Client, student_id: str, gap_id: str, word: str) -> bool:
    rows = db.table(TABLE).select("word").eq("student_id", student_id).eq("gap_id", gap_id).eq("word", word).execute()
    return bool(rows.data)


def insert_mark(db: Client, row: dict) -> None:
    db.table(TABLE).insert(row).execute()


def fetch_student_marks(db: Client, student_id: str) -> list[dict]:
    return (
        db.table(TABLE).select("gap_id, lesson_id, word, lemma, translation_es, key_phrase, created_at")
        .eq("student_id", student_id).order("created_at", desc=True).execute().data
    )

"""Reads and writes of lessons, lesson terms and word mastery for the class-data endpoints."""
from supabase import Client

_TERM_COLUMNS = (
    "id, lesson_id, lemma, forms, translation_es, definition_fr, transparent, key_phrase"
)


def list_lessons(client: Client) -> list[dict]:
    return (
        client.table("lessons")
        .select("id, title, subject, lesson_date, course_id")
        .order("lesson_date", desc=True, nullsfirst=False)
        .order("created_at", desc=True)
        .execute()
        .data
    )


def get_lesson(client: Client, lesson_id: str) -> dict | None:
    response = client.table("lessons").select("*").eq("id", lesson_id).maybe_single().execute()
    return response.data if response else None


def list_terms(client: Client, lesson_id: str) -> list[dict]:
    return (
        client.table("lesson_terms")
        .select(_TERM_COLUMNS)
        .eq("lesson_id", lesson_id)
        .order("lemma")
        .execute()
        .data
    )


def mastery_rows(client: Client, student_id: str, lemmas: list[str]) -> dict[str, dict]:
    if not lemmas:
        return {}
    rows = (
        client.table("word_mastery")
        .select("lemma, level, times_tapped")
        .eq("student_id", student_id)
        .in_("lemma", lemmas)
        .execute()
        .data
    )
    return {r["lemma"]: {"level": r["level"], "times_tapped": r["times_tapped"]} for r in rows}


def tapped_lemmas(client: Client, student_id: str, lemmas: list[str]) -> set[str]:
    """Glossary lemmas this student marked at home on a clip (🟠 in class)."""
    if not lemmas:
        return set()
    rows = (
        client.table("clip_marks")
        .select("lemma")
        .eq("student_id", student_id)
        .in_("lemma", lemmas)
        .execute()
        .data
    )
    return {r["lemma"] for r in rows}


def upsert_mastery(
    client: Client, student_id: str, lemma: str, level: int, times_tapped: int, last_seen_at: str
) -> None:
    row = {
        "student_id": student_id,
        "lemma": lemma,
        "level": level,
        "times_tapped": times_tapped,
        "last_seen_at": last_seen_at,
    }
    client.table("word_mastery").upsert(row, on_conflict="student_id,lemma").execute()

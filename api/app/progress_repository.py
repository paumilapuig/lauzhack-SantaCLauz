"""Supabase reads for GET /api/me/progress. Returns plain Python values."""

from datetime import datetime

from supabase import Client

from app.mastery import initial_level


def _parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def fetch_passed_practices(db: Client, student_id: str) -> list[tuple[str, datetime]]:
    result = (
        db.table("practice_results")
        .select("lemma, created_at")
        .eq("student_id", student_id)
        .eq("passed", True)
        .order("created_at", desc=True)
        .execute()
    )
    return [(row["lemma"], _parse_timestamp(row["created_at"])) for row in result.data]


def fetch_practice_times(db: Client, student_id: str) -> list[datetime]:
    """When she finished each practice, passed or not (for her week)."""
    result = db.table("practice_results").select("created_at").eq("student_id", student_id).execute()
    return [_parse_timestamp(row["created_at"]) for row in result.data]


def fetch_translations(db: Client, lemmas: list[str]) -> dict[str, str]:
    """The glossary's Spanish for each lemma (first lesson that has one)."""
    if not lemmas:
        return {}
    result = db.table("lesson_terms").select("lemma, translation_es").in_("lemma", lemmas).execute()
    translations: dict[str, str] = {}
    for row in result.data:
        if row.get("translation_es") and row["lemma"] not in translations:
            translations[row["lemma"]] = row["translation_es"]
    return translations


def fetch_mark_lemmas(db: Client, student_id: str) -> list[str]:
    result = (
        db.table("clip_marks")
        .select("lemma")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [row["lemma"] for row in result.data if row["lemma"] is not None]


def _fetch_mastery_levels(db: Client, student_id: str, lemmas: list[str]) -> dict[str, int]:
    result = (
        db.table("word_mastery")
        .select("lemma, level")
        .eq("student_id", student_id)
        .in_("lemma", lemmas)
        .execute()
    )
    return {row["lemma"]: row["level"] for row in result.data}


def _fallback_level(db: Client, lemma: str) -> int:
    result = (
        db.table("lesson_terms").select("transparent").eq("lemma", lemma).limit(1).execute()
    )
    if not result.data:
        return 0
    return initial_level(result.data[0]["transparent"])


def fetch_levels(db: Client, student_id: str, lemmas: list[str]) -> dict[str, int]:
    if not lemmas:
        return {}
    known = _fetch_mastery_levels(db, student_id, lemmas)
    return {
        lemma: known[lemma] if lemma in known else _fallback_level(db, lemma)
        for lemma in lemmas
    }

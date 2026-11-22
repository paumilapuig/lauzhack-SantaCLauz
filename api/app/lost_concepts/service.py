"""After-class processing of a session's "Me he perdido" moments into `concept_gaps` rows."""

import logging

import httpx
from supabase import Client

from app.config import Settings, get_settings
from app.db import get_supabase
from app.lost_concepts.schema import ConceptGap, LostMoment
from app.lost_concepts.summarize import summarize_session

logger = logging.getLogger(__name__)


def process_session(
    session_id: str,
    db: Client | None = None,
    settings: Settings | None = None,
    http: httpx.Client | None = None,
) -> int:
    """Generate and store the session's concept gaps; return how many rows were inserted.

    Runs as a background task after `POST /api/sessions/{id}/word-states`, so it never raises:
    any failure (no key, LLM, parsing, database) is logged and nothing is stored.
    """
    try:
        return _process(session_id, db or get_supabase(), settings or get_settings(), http)
    except Exception:  # background task: an error must not escape into the request cycle
        logger.warning("concept gaps not generated session=%s", session_id, exc_info=True)
        return 0


def _process(session_id: str, db: Client, settings: Settings, http: httpx.Client | None) -> int:
    if not settings.openrouter_api_key:
        logger.warning("concept gaps skipped: OPENROUTER_API_KEY is not set session=%s", session_id)
        return 0
    session = _session(db, session_id)
    if session is None or _has_gaps(db, session_id):
        return 0
    moments = _lost_moments(db, session_id)
    if not moments:
        return 0
    lemmas = _glossary_lemmas(db, session["lesson_id"])
    gaps, _ = summarize_session(moments, lemmas, settings.resolved_model(), settings.openrouter_api_key, http=http)
    if not gaps:
        return 0
    rows = [_row(gap, session) for gap in gaps]
    db.table("concept_gaps").insert(rows).execute()
    return len(rows)


def _session(db: Client, session_id: str) -> dict | None:
    response = (
        db.table("class_sessions").select("id, lesson_id, student_id").eq("id", session_id).maybe_single().execute()
    )
    return response.data if response is not None and response.data else None


def _has_gaps(db: Client, session_id: str) -> bool:
    return bool(db.table("concept_gaps").select("id").eq("session_id", session_id).limit(1).execute().data)


def _lost_moments(db: Client, session_id: str) -> list[LostMoment]:
    events = (
        db.table("class_events")
        .select("t_sec, context_transcript")
        .eq("session_id", session_id)
        .eq("type", "lost")
        .execute()
        .data
    )
    with_text = sorted(
        (e for e in events if (e.get("context_transcript") or "").strip()), key=lambda e: e["t_sec"]
    )
    return [
        LostMoment(n=number, t_sec=e["t_sec"], transcript=e["context_transcript"])
        for number, e in enumerate(with_text, start=1)
    ]


def _glossary_lemmas(db: Client, lesson_id: str) -> list[str]:
    rows = db.table("lesson_terms").select("lemma").eq("lesson_id", lesson_id).execute().data
    return [row["lemma"] for row in rows]


def _row(gap: ConceptGap, session: dict) -> dict:
    return {
        "session_id": session["id"],
        "student_id": session["student_id"],
        "lesson_id": session["lesson_id"],
        "concept": gap.concept,
        "minutes": gap.minutes,
        "lemmas": gap.lemmas,
        "explanation": [step.model_dump(by_alias=True) for step in gap.explanation],
        "exercises": [exercise.model_dump() for exercise in gap.exercises],
        "status": "pending",
    }

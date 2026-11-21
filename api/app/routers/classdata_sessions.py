"""Class sessions and tap/lost events (docs/API.md)."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from .. import mastery
from ..db import get_supabase
from ..roles import StudentUser
from . import classdata_repository as lessons
from . import classdata_session_repository as sessions
from .classdata_schemas import ClassEventCreate, ClassEventResult, SessionCreate, SessionCreated

router = APIRouter(prefix="/api/sessions", tags=["class-data"])


def _not_found(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, detail)


def _owned_session(db: Client, session_id: UUID, student_id: str) -> dict:
    session = sessions.get_owned_session(db, str(session_id), student_id)
    if session is None:
        raise _not_found("Session not found")
    return session


def _lesson_term(db: Client, lesson_id: str, lemma: str) -> dict:
    term = next((t for t in lessons.list_terms(db, lesson_id) if t["lemma"] == lemma), None)
    if term is None:
        raise HTTPException(422, "Unknown lemma for this lesson")
    return term


def _register_tap(db: Client, student_id: str, term: dict) -> int:
    lemma = term["lemma"]
    row = lessons.mastery_rows(db, student_id, [lemma]).get(lemma)
    old_level = row["level"] if row else mastery.initial_level(term["transparent"])
    old_taps = row["times_tapped"] if row else 0
    new_level = mastery.apply_tap(old_level)
    now = datetime.now(timezone.utc).isoformat()
    lessons.upsert_mastery(db, student_id, lemma, new_level, old_taps + 1, now)
    return new_level


@router.post("", response_model=SessionCreated)
def create_session(body: SessionCreate, user: StudentUser, db: Client = Depends(get_supabase)):
    if lessons.get_lesson(db, str(body.lesson_id)) is None:
        raise _not_found("Lesson not found")
    return SessionCreated(session_id=sessions.insert_session(db, str(body.lesson_id), user.id))


@router.post("/{session_id}/events", response_model=ClassEventResult)
def create_event(
    session_id: UUID, body: ClassEventCreate, user: StudentUser, db: Client = Depends(get_supabase)
):
    session = _owned_session(db, session_id, user.id)
    level = None
    if body.type == "word":
        term = _lesson_term(db, session["lesson_id"], body.lemma)
        level = _register_tap(db, user.id, term)
    sessions.insert_event(db, str(session_id), user.id, body.t_sec, body.type, body.lemma)
    return ClassEventResult(ok=True, level=level)

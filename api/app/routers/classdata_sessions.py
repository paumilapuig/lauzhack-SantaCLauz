"""Class sessions and "Me he perdido" events (docs/API.md)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..db import get_supabase
from ..roles import StudentUser
from . import classdata_repository as lessons
from . import classdata_session_repository as sessions
from .classdata_schemas import ClassEventCreate, ClassEventResult, SessionCreate, SessionCreated

router = APIRouter(prefix="/api/sessions", tags=["class-data"])


def _not_found(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, detail)


@router.post("", response_model=SessionCreated)
def create_session(body: SessionCreate, user: StudentUser, db: Client = Depends(get_supabase)):
    if lessons.get_lesson(db, str(body.lesson_id)) is None:
        raise _not_found("Lesson not found")
    return SessionCreated(session_id=sessions.insert_session(db, str(body.lesson_id), user.id))


@router.post("/{session_id}/events", response_model=ClassEventResult)
def create_event(
    session_id: UUID, body: ClassEventCreate, user: StudentUser, db: Client = Depends(get_supabase)
):
    if sessions.get_owned_session(db, str(session_id), user.id) is None:
        raise _not_found("Session not found")
    sessions.insert_lost_event(
        db, str(session_id), user.id, body.t_sec, body.context.t_start, body.context.transcript
    )
    return ClassEventResult(ok=True)

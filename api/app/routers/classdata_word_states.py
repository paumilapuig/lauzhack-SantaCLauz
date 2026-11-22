"""POST /api/sessions/{id}/word-states: end of class — word states, autonomy, and concept processing."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from supabase import Client

from .. import mastery
from ..lost_concepts import process_session
from ..db import get_supabase
from ..roles import StudentUser
from . import classdata_repository as lessons_repo
from . import classdata_session_repository as session_repo
from .classdata_schemas import WordStatesResult, WordStatesSubmit

router = APIRouter()

Db = Annotated[Client, Depends(get_supabase)]


@router.post("/api/sessions/{session_id}/word-states", response_model=WordStatesResult)
def submit_word_states(
    session_id: UUID, body: WordStatesSubmit, user: StudentUser, db: Db, background: BackgroundTasks
) -> WordStatesResult:
    session = session_repo.get_owned_session(db, str(session_id), user.id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    _require_lemmas_in_lesson(db, session["lesson_id"], [entry.lemma for entry in body.states])
    entries = [(entry.lemma, entry.state) for entry in body.states]
    session_repo.upsert_word_states(db, str(session_id), user.id, entries)
    background.add_task(process_session, str(session_id))
    return WordStatesResult(ok=True, autonomy=mastery.autonomy(session_repo.session_states(db, str(session_id), user.id)))


def _require_lemmas_in_lesson(db: Client, lesson_id: str, lemmas: list[str]) -> None:
    known = {term["lemma"] for term in lessons_repo.list_terms(db, lesson_id)}
    unknown = sorted(set(lemmas) - known)
    if unknown:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Unknown lemmas for this lesson: {unknown}")

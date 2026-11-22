"""Home practice result (docs/API.md POST /api/practice). Never calls the LLM."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from .. import mastery
from .. import practice_repository as repo
from ..db import get_supabase
from ..practice_schemas import PracticeIn, PracticeOut
from ..roles import StudentUser

router = APIRouter(prefix="/api", tags=["practice"])

Db = Annotated[Client, Depends(get_supabase)]


def _lesson_of_clip(db: Client, student_id: str, clip_id: str | None) -> str | None:
    if clip_id is None:
        return None
    lesson_id = repo.find_student_clip_lesson(db, student_id, clip_id)
    if lesson_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Clip not found")
    return lesson_id


@router.post("/practice", response_model=PracticeOut)
def submit_practice(body: PracticeIn, user: StudentUser, db: Db) -> PracticeOut:
    clip_id = str(body.clip_id) if body.clip_id else None
    lesson_id = _lesson_of_clip(db, user.id, clip_id)
    transparent = repo.find_term_transparent(db, body.lemma, lesson_id)
    if transparent is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown lemma")
    repo.insert_practice_result(db, user.id, body.lemma, clip_id, body.passed)
    stored = repo.fetch_level(db, user.id, body.lemma)
    current = mastery.initial_level(transparent) if stored is None else stored
    new_level = mastery.apply_practice(current, body.passed)
    if body.passed:
        repo.upsert_level(db, user.id, body.lemma, new_level, datetime.now(UTC))
    return PracticeOut(lemma=body.lemma, level=new_level, leveled_up=new_level > current)

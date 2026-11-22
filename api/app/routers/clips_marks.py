"""Words the student marks at home on a clip (docs/API.md POST/DELETE /api/clips/{id}/marks)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel, Field
from supabase import Client

from ..db import get_supabase
from ..roles import StudentUser
from . import classdata_repository as lessons
from . import classdata_session_repository as sessions
from . import clips_marks_levels as levels
from . import clips_marks_repository as marks

router = APIRouter(prefix="/api/clips", tags=["clips"])

Db = Annotated[Client, Depends(get_supabase)]
MAX_WORD_CHARS = 80


class MarkCreate(BaseModel):
    word: str = Field(max_length=MAX_WORD_CHARS)


class MarkResult(BaseModel):
    word: str
    lemma: str | None
    translation_es: str | None
    level: int | None


class UnmarkResult(BaseModel):
    ok: bool
    level: int | None


def _normalized(word: str) -> str:
    normalized = word.strip().lower()
    if not normalized:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Word must not be empty")
    return normalized


def _clip_and_terms(db: Client, clip_id: UUID, student_id: str) -> tuple[dict, list[dict]]:
    clip = marks.get_owned_clip(db, str(clip_id), student_id)
    session = clip and sessions.get_owned_session(db, clip["session_id"], student_id)
    if not session:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Clip not found")
    return clip, lessons.list_terms(db, session["lesson_id"])


def _term_for(terms: list[dict], word: str) -> dict | None:
    return next((term for term in terms if word in term["forms"]), None)


@router.post("/{clip_id}/marks", response_model=MarkResult)
def mark_word(clip_id: UUID, body: MarkCreate, user: StudentUser, db: Db) -> MarkResult:
    word = _normalized(body.word)
    clip, terms = _clip_and_terms(db, clip_id, user.id)
    term = _term_for(terms, word)
    if not marks.has_mark(db, user.id, clip["id"], word):
        marks.insert_mark(db, user.id, clip["id"], word, term["lemma"] if term else None)
    if term is None:
        return MarkResult(word=word, lemma=None, translation_es=None, level=None)
    level = levels.after_mark(db, user.id, clip["session_id"], term)
    return MarkResult(word=word, lemma=term["lemma"], translation_es=term["translation_es"], level=level)


@router.delete("/{clip_id}/marks/{word}", response_model=UnmarkResult)
def unmark_word(
    clip_id: UUID, word: Annotated[str, Path(max_length=MAX_WORD_CHARS)], user: StudentUser, db: Db
) -> UnmarkResult:
    word = _normalized(word)
    clip, terms = _clip_and_terms(db, clip_id, user.id)
    term = _term_for(terms, word)
    removed = marks.delete_mark(db, user.id, clip["id"], word)
    if term is None:
        return UnmarkResult(ok=True, level=None)
    if not removed:
        return UnmarkResult(ok=True, level=levels.level_of(db, user.id, term))
    return UnmarkResult(ok=True, level=levels.after_unmark(db, user.id, clip["session_id"], term))

"""POST /api/concepts/{id}/words: a word tapped inside a concept explanation (docs/API.md › Concept gaps)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from supabase import Client

from .. import concept_words_repository as repo
from ..db import get_supabase
from ..roles import StudentUser
from . import classdata_repository as lessons
from . import clips_marks_levels as levels

router = APIRouter(prefix="/api/concepts", tags=["concepts"])

Db = Annotated[Client, Depends(get_supabase)]


class ConceptWordIn(BaseModel):
    word: str = Field(max_length=40)
    key_phrase: str = Field(default="", max_length=300)


class ConceptWordOut(BaseModel):
    word: str
    lemma: str | None
    translation_es: str | None
    level: int | None


def _step_translation(explanation: list, word: str) -> str | None:
    for step in explanation:
        for gloss in step.get("words", []) if isinstance(step, dict) else []:
            if str(gloss.get("fr", "")).strip().lower() == word:
                return gloss.get("es")
    return None


@router.post("/{gap_id}/words", response_model=ConceptWordOut)
def tap_concept_word(gap_id: UUID, body: ConceptWordIn, user: StudentUser, db: Db) -> ConceptWordOut:
    word = body.word.strip().lower()
    if not word:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Word must not be empty")
    gap = repo.get_owned_gap(db, str(gap_id), user.id)
    if gap is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Concept gap not found")
    term = next((t for t in lessons.list_terms(db, gap["lesson_id"]) if word in t["forms"]), None)
    translation = term["translation_es"] if term else _step_translation(gap["explanation"], word)
    if not repo.has_mark(db, user.id, gap["id"], word):
        repo.insert_mark(db, {
            "student_id": user.id, "gap_id": gap["id"], "lesson_id": gap["lesson_id"], "word": word,
            "lemma": term["lemma"] if term else None, "translation_es": translation,
            "key_phrase": body.key_phrase.strip() or word,
        })
    level = levels.after_mark(db, user.id, gap["session_id"], term) if term else None
    return ConceptWordOut(word=word, lemma=term["lemma"] if term else None, translation_es=translation, level=level)

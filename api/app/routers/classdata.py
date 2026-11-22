"""Lessons list and class-pack endpoints (docs/API.md)."""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from ..auth import AuthenticatedUser
from ..db import get_supabase
from ..mastery import initial_level
from ..roles import StudentUser
from . import classdata_repository as repo
from .classdata_schemas import ClassPack, LessonListItem, LessonSummary, LessonTerm

router = APIRouter(prefix="/api/lessons", tags=["classdata"])

SupabaseClient = Annotated[Client, Depends(get_supabase)]


@router.get("", response_model=list[LessonListItem])
def list_lessons(_user: AuthenticatedUser, client: SupabaseClient) -> list[dict]:
    return repo.list_lessons(client)


@router.get("/{lesson_id}/class-pack", response_model=ClassPack)
def get_class_pack(lesson_id: UUID, user: StudentUser, client: SupabaseClient) -> ClassPack:
    lesson = repo.get_lesson(client, str(lesson_id))
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    terms = [LessonTerm(**row) for row in repo.list_terms(client, lesson["id"])]
    lemmas = [term.lemma for term in terms]
    stored = repo.mastery_rows(client, user.id, lemmas)
    mastery = {
        term.lemma: stored[term.lemma]["level"] if term.lemma in stored
        else initial_level(term.transparent)
        for term in terms
    }
    tapped = repo.tapped_lemmas(client, user.id, lemmas)
    return ClassPack(
        lesson=LessonSummary(**lesson),
        terms=terms,
        mastery=mastery,
        previously_tapped=[lemma for lemma in lemmas if lemma in tapped],
    )

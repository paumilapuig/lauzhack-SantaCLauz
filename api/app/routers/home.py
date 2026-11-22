"""GET /api/home/review (docs/API.md, section HomeReview)."""

from functools import partial
from typing import Annotated

from fastapi import APIRouter, Depends
from supabase import Client

from .. import concept_words_repository as concept_words
from .. import home_repository as repo
from ..home_concept_words import build_concept_words
from ..db import get_supabase
from ..home_review import build_clips, build_concepts, build_words
from ..home_schemas import HomeReview
from ..roles import StudentUser

router = APIRouter(prefix="/api/home", tags=["home"])

SupabaseClient = Annotated[Client, Depends(get_supabase)]


@router.get("/review", response_model=HomeReview)
def get_home_review(user: StudentUser, client: SupabaseClient) -> HomeReview:
    clips = repo.fetch_student_clips(client, user.id)
    sessions = repo.fetch_sessions(client, sorted({c["session_id"] for c in clips}))
    lesson_ids = sorted({s["lesson_id"] for s in sessions})
    lesson_terms = repo.fetch_lesson_terms(client, lesson_ids)
    marks = repo.fetch_clip_marks(client, user.id)
    concept_marks = concept_words.fetch_student_marks(client, user.id)
    concept_terms = repo.fetch_lesson_terms(client, sorted({m["lesson_id"] for m in concept_marks}))
    tapped_lemmas = {m["lemma"] for m in [*marks, *concept_marks] if m["lemma"]}
    mastery = repo.fetch_mastery(client, user.id, sorted(tapped_lemmas))
    gaps = repo.fetch_concept_gaps(client, user.id)
    gap_lessons = repo.fetch_lessons(client, sorted({g["lesson_id"] for g in gaps}))
    return HomeReview(
        clips=build_clips(
            clips,
            sessions,
            repo.fetch_lessons(client, lesson_ids),
            lesson_terms,
            partial(repo.sign_audio, client),
        ),
        words_to_practice=[
            *build_concept_words(concept_marks, concept_terms, mastery),
            *build_words(marks, clips, sessions, lesson_terms, mastery),
        ],
        concepts_to_learn=build_concepts(gaps, {row["id"]: row["title"] for row in gap_lessons}),
    )

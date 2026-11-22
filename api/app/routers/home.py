"""GET /api/home/review (docs/API.md, section HomeReview)."""

from functools import partial
from typing import Annotated

from fastapi import APIRouter, Depends
from supabase import Client

from .. import home_repository as repo
from ..db import get_supabase
from ..home_review import build_clips, build_words
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
    mastery = repo.fetch_mastery(client, user.id, sorted({m["lemma"] for m in marks if m["lemma"]}))
    return HomeReview(
        clips=build_clips(
            clips,
            repo.fetch_passed_clip_ids(client, user.id),
            sessions,
            repo.fetch_lessons(client, lesson_ids),
            lesson_terms,
            partial(repo.sign_audio, client),
        ),
        words_to_practice=build_words(marks, clips, sessions, lesson_terms, mastery),
    )

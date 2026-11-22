"""GET /api/me/progress: encouraging messages, never percentages (docs/API.md)."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from supabase import Client

from .. import progress_repository as repo
from ..db import get_supabase
from ..progress_messages import build_progress_messages
from ..progress_schemas import MessageOut, ProgressOut
from ..roles import StudentUser

router = APIRouter(prefix="/api/me", tags=["progress"])

SupabaseClient = Annotated[Client, Depends(get_supabase)]


def get_now() -> datetime:
    return datetime.now(UTC)


Now = Annotated[datetime, Depends(get_now)]


@router.get("/progress", response_model=ProgressOut)
def get_progress(user: StudentUser, client: SupabaseClient, now: Now) -> ProgressOut:
    passed = repo.fetch_passed_practices(client, user.id)
    mark_lemmas = repo.fetch_mark_lemmas(client, user.id)
    lemmas = sorted({lemma for lemma, _ in passed} | set(mark_lemmas))
    levels = repo.fetch_levels(client, user.id, lemmas)
    messages = build_progress_messages(passed, mark_lemmas, levels, now)
    return ProgressOut(messages=[MessageOut(kind=m.kind, text=m.text) for m in messages])

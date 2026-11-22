"""POST /api/clips/{id}/reviewed: the student finished picking the hard words of a clip (docs/API.md › Clips)."""

from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from ..config import get_settings
from ..db import get_supabase
from ..mark_translations import translate_clip_marks
from ..roles import StudentUser

router = APIRouter(prefix="/api/clips", tags=["clips"])


class ReviewedResult(BaseModel):
    ok: bool


@router.post("/{clip_id}/reviewed", response_model=ReviewedResult)
def mark_clip_reviewed(clip_id: UUID, user: StudentUser, db: Annotated[Client, Depends(get_supabase)]) -> ReviewedResult:
    owned = db.table("clips").select("id").eq("id", str(clip_id)).eq("student_id", user.id).execute().data
    if not owned:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Clip not found")
    now = datetime.now(timezone.utc).isoformat()
    db.table("clips").update({"reviewed_at": now}).eq("id", str(clip_id)).execute()
    translate_clip_marks(db, str(clip_id), user.id, get_settings())  # 1 LLM call; never fails the request
    return ReviewedResult(ok=True)

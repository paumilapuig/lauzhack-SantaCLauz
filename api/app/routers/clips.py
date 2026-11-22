"""Student clip upload: "No he entendido" (docs/API.md POST /api/clips)."""

import logging
from typing import Annotated, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from supabase import Client

from ..db import get_supabase
from ..roles import StudentUser
from . import classdata_repository as lessons
from . import classdata_session_repository as sessions
from .. import storage
from . import clips_repository
from .classdata_schemas import ClipCreated
from .clips_validation import check_duration, read_audio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/clips", tags=["clips"])


def _store_audio(db: Client, path: str, data: bytes) -> None:
    try:
        storage.upload_clip(db, path, data)
    except Exception as error:
        logger.exception("Could not upload clip %s", path)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not store audio") from error


def _check_lemma(db: Client, lesson_id: str, lemma: str | None) -> None:
    if lemma is not None and lemma not in {t["lemma"] for t in lessons.list_terms(db, lesson_id)}:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown lemma for this lesson")


def _save_rows(db: Client, clip: dict, event_t_sec: float) -> None:
    """Insert the clip row, then (concept only) the `unclear` event; roll back on failure."""
    path = clip["audio_path"]
    try:
        clips_repository.insert_clip(db, **clip)
    except Exception as error:
        logger.exception("Could not insert clip row %s", clip["clip_id"])
        storage.remove_clip(db, path)
        raise _save_failed() from error
    if clip["kind"] != "concept":
        return
    try:
        sessions.insert_event(db, clip["session_id"], clip["student_id"], event_t_sec, "unclear", None)
    except Exception as error:
        logger.exception("Could not insert unclear event for clip %s", clip["clip_id"])
        clips_repository.delete_clip(db, clip["clip_id"])
        storage.remove_clip(db, path)
        raise _save_failed() from error


def _save_failed() -> HTTPException:
    return HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not save clip")


@router.post("", response_model=ClipCreated)
def create_clip(
    user: StudentUser,
    audio: Annotated[UploadFile, File()],
    session_id: Annotated[UUID, Form()],
    t_start: Annotated[float, Form(ge=0, allow_inf_nan=False)],
    t_end: Annotated[float, Form(gt=0, allow_inf_nan=False)],
    transcript: Annotated[str, Form(max_length=5000)] = "",
    kind: Annotated[Literal["word", "concept"], Form()] = "word",
    lemma: Annotated[str | None, Form(min_length=1)] = None,
    db: Client = Depends(get_supabase),
):
    check_duration(kind, t_start, t_end)
    data = read_audio(audio)
    session = sessions.get_owned_session(db, str(session_id), user.id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    _check_lemma(db, session["lesson_id"], lemma)
    clip_id = str(uuid4())
    path = storage.clip_object_path(user.id, clip_id)
    _store_audio(db, path, data)
    clip = {
        "clip_id": clip_id,
        "session_id": str(session_id),
        "student_id": user.id,
        "t_start": t_start,
        "t_end": t_end,
        "transcript": transcript,
        "audio_path": path,
        "kind": kind,
        "lemma": lemma,
    }
    _save_rows(db, clip, t_end)
    return ClipCreated(clip_id=clip_id, audio_path=path)

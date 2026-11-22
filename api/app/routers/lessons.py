from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError
from starlette.datastructures import UploadFile

from app.roles import TeacherUser
from app.config import Settings, get_settings
from app.glossary.errors import InputError, TooLarge, UnsupportedType
from app.glossary.generate import generate_glossary
from app.glossary.openrouter_client import OpenRouterError
from app.glossary.parser import GlossaryParseError
from app.glossary import upload as upload_limits
from app.glossary.upload import normalize_upload
from app.db import get_supabase
from app.lessons_service import LessonSaveError, create_lesson
from app.routers.teacher_courses_repository import is_her_course
from app.schemas import CreateLessonJson, CreateLessonJsonRequest, CreateLessonResponse

router = APIRouter()

MULTIPART_OVERHEAD_BYTES = 1024 * 1024

LessonInput = tuple[CreateLessonJson, list[bytes]]


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def _validated_meta[M: CreateLessonJson](model: type[M], fields: dict) -> M:
    try:
        return model.model_validate(fields)
    except ValidationError as error:
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error


async def _read_json(request: Request) -> LessonInput:
    try:
        body = await request.json()
    except ValueError as error:
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, "Malformed JSON body") from error
    return _validated_meta(CreateLessonJsonRequest, body if isinstance(body, dict) else {}), []


def _extract_upload(filename: str, content_type: str, data: bytes) -> tuple[str, list[bytes]]:
    try:
        return normalize_upload(filename, content_type, data)
    except UnsupportedType as error:
        raise _error(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, str(error)) from error
    except TooLarge as error:
        raise _error(status.HTTP_413_CONTENT_TOO_LARGE, str(error)) from error
    except InputError as error:
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error


def _declared_size(header: str | None) -> int:
    if not header:
        return 0
    if not header.isdigit():
        raise _error(status.HTTP_400_BAD_REQUEST, "Invalid Content-Length header")
    return int(header)


async def _read_multipart(request: Request) -> LessonInput:
    declared_size = _declared_size(request.headers.get("content-length"))
    if declared_size > upload_limits.MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES:
        raise _error(status.HTTP_413_CONTENT_TOO_LARGE, "Upload too large")
    form = await request.form()
    upload = form.get("file")
    if not isinstance(upload, UploadFile):
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, "Missing file field")
    data = await upload.read(upload_limits.MAX_UPLOAD_BYTES + 1)
    source_text, images = await run_in_threadpool(
        _extract_upload, upload.filename or "", upload.content_type or "", data
    )
    if not source_text.strip() and not images:
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, "File has no usable content")
    fields = {key: form.get(key) for key in ("title", "subject", "lesson_date")}
    fields["course_id"] = form.get("course_id") or None
    return _validated_meta(CreateLessonJson, {**fields, "source_text": source_text}), images


async def _read_input(request: Request) -> LessonInput:
    content_type = request.headers.get("content-type", "").split(";")[0].strip().lower()
    if content_type == "application/json":
        return await _read_json(request)
    if content_type == "multipart/form-data":
        return await _read_multipart(request)
    raise _error(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Unsupported content type: {content_type}")


@router.post("/api/lessons", response_model=CreateLessonResponse)
async def post_lesson(
    request: Request,
    user: TeacherUser,
    settings: Annotated[Settings, Depends(get_settings)],
) -> CreateLessonResponse:
    if not settings.openrouter_api_key:
        raise _error(status.HTTP_503_SERVICE_UNAVAILABLE, "LLM not configured")
    meta, images = await _read_input(request)
    if meta.course_id and not await run_in_threadpool(is_her_course, get_supabase(), str(meta.course_id), user.id):
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown course")
    try:
        result, _metrics = await run_in_threadpool(
            generate_glossary,
            meta.source_text, images, settings.model_for(has_images=bool(images)), settings.openrouter_api_key,
        )
    except GlossaryParseError as error:
        raise _error(status.HTTP_502_BAD_GATEWAY, "Could not parse the glossary") from error
    except OpenRouterError as error:
        raise _error(status.HTTP_502_BAD_GATEWAY, "Glossary generation failed") from error
    try:
        return await run_in_threadpool(create_lesson, user, meta, result.terms)
    except LessonSaveError as error:
        raise _error(status.HTTP_500_INTERNAL_SERVER_ERROR, str(error)) from error

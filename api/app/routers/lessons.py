from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError
from starlette.datastructures import UploadFile

from app.auth_roles import TeacherUser
from app.config import Settings, get_settings
from app.glossary.errors import InputError, TooLarge, UnsupportedType
from app.glossary.generate import generate_glossary
from app.glossary.openrouter_client import OpenRouterError
from app.glossary.parser import GlossaryParseError
from app.glossary.upload import normalize_upload
from app.lessons_service import LessonSaveError, create_lesson
from app.schemas import CreateLessonJson, CreateLessonResponse

router = APIRouter()

LessonInput = tuple[CreateLessonJson, list[bytes]]


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def _validated_meta(fields: dict) -> CreateLessonJson:
    try:
        return CreateLessonJson.model_validate(fields)
    except ValidationError as error:
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error


async def _read_json(request: Request) -> LessonInput:
    try:
        body = await request.json()
    except ValueError as error:
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, "Malformed JSON body") from error
    return _validated_meta(body if isinstance(body, dict) else {}), []


def _extract_upload(filename: str, content_type: str, data: bytes) -> tuple[str, list[bytes]]:
    try:
        return normalize_upload(filename, content_type, data)
    except UnsupportedType as error:
        raise _error(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, str(error)) from error
    except TooLarge as error:
        raise _error(status.HTTP_413_CONTENT_TOO_LARGE, str(error)) from error
    except InputError as error:
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error


async def _read_multipart(request: Request) -> LessonInput:
    form = await request.form()
    upload = form.get("file")
    if not isinstance(upload, UploadFile):
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, "Missing file field")
    data = await upload.read()
    source_text, images = _extract_upload(upload.filename or "", upload.content_type or "", data)
    fields = {key: form.get(key) for key in ("title", "subject", "lesson_date")}
    return _validated_meta({**fields, "source_text": source_text}), images


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
    try:
        result, _metrics = await run_in_threadpool(
            generate_glossary,
            meta.source_text, images, settings.resolved_model(), settings.openrouter_api_key,
        )
    except ValueError as error:
        if isinstance(error, GlossaryParseError):
            raise _error(status.HTTP_502_BAD_GATEWAY, "Could not parse the glossary") from error
        raise _error(status.HTTP_422_UNPROCESSABLE_CONTENT, str(error)) from error
    except OpenRouterError as error:
        raise _error(status.HTTP_502_BAD_GATEWAY, "Glossary generation failed") from error
    try:
        return await run_in_threadpool(create_lesson, user, meta, result.terms)
    except LessonSaveError as error:
        raise _error(status.HTTP_500_INTERNAL_SERVER_ERROR, str(error)) from error

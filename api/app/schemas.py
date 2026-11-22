"""Pydantic models mirroring docs/API.md. Update API.md first, then this file."""

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, field_validator

Role = Literal["student", "teacher"]


class Health(BaseModel):
    ok: bool


class Profile(BaseModel):
    display_name: str | None
    role: Role


class Me(BaseModel):
    id: str
    email: str
    display_name: str | None
    role: Role


class CurrentUser(BaseModel):
    id: str
    email: str


class LessonTermInput(BaseModel):
    lemma: str
    forms: list[str]
    translation_es: str
    definition_fr: str
    transparent: bool
    key_phrase: str


class LessonTerm(LessonTermInput):
    id: str
    lesson_id: str


class CreateLessonJson(BaseModel):
    title: str
    subject: str
    lesson_date: date
    source_text: str
    course_id: UUID | None = None


class CreateLessonJsonRequest(CreateLessonJson):
    """JSON body: the text is the only content, so it must not be blank."""

    @field_validator("source_text")
    @classmethod
    def source_text_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("source_text must not be blank")
        return value


class CreateLessonResponse(BaseModel):
    lesson_id: str
    terms: list[LessonTerm]

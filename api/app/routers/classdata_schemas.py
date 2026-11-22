"""Pydantic models for the class-data endpoints (docs/API.md)."""

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

WordState = Literal["green", "yellow", "orange"]


class LessonSummary(BaseModel):
    id: str
    title: str
    subject: str | None
    lesson_date: date | None


class LessonTerm(BaseModel):
    id: str
    lesson_id: str
    lemma: str
    forms: list[str]
    translation_es: str | None
    definition_fr: str | None
    transparent: bool
    key_phrase: str | None


class ClassPack(BaseModel):
    lesson: LessonSummary
    terms: list[LessonTerm]
    mastery: dict[str, int]
    previously_tapped: list[str]


class SessionCreate(BaseModel):
    lesson_id: UUID


class SessionCreated(BaseModel):
    session_id: str


class ClipCreated(BaseModel):
    clip_id: str
    audio_path: str


LOST_WINDOW_TOLERANCE_SEC = 70
MAX_TRANSCRIPT_CHARS = 5000


class LostContext(BaseModel):
    """Text-only context of a "Me he perdido" moment: the last <= 60 s of transcript."""

    t_start: float = Field(ge=0, allow_inf_nan=False)
    transcript: str = Field(max_length=MAX_TRANSCRIPT_CHARS)


class ClassEventCreate(BaseModel):
    """Only `lost` events come from the client; words are marked at home (clip_marks)."""

    t_sec: float = Field(ge=0, allow_inf_nan=False)
    type: Literal["lost"]
    lemma: None = None
    context: LostContext

    @model_validator(mode="after")
    def check_context_window(self) -> "ClassEventCreate":
        window = self.t_sec - self.context.t_start
        if window < 0 or window > LOST_WINDOW_TOLERANCE_SEC:
            raise ValueError(f"context.t_start must be within {LOST_WINDOW_TOLERANCE_SEC} s before t_sec")
        return self


class ClassEventResult(BaseModel):
    ok: bool


class WordStateEntry(BaseModel):
    lemma: str
    state: WordState


class WordStatesSubmit(BaseModel):
    states: list[WordStateEntry]

    @model_validator(mode="after")
    def check_unique_lemmas(self) -> "WordStatesSubmit":
        lemmas = [entry.lemma for entry in self.states]
        if len(lemmas) != len(set(lemmas)):
            raise ValueError("duplicate lemmas in states")
        return self


class WordStatesResult(BaseModel):
    ok: bool
    autonomy: float

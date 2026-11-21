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


class ClassEventCreate(BaseModel):
    t_sec: float = Field(ge=0)
    type: Literal["word", "lost"]
    lemma: str | None = None

    @model_validator(mode="after")
    def check_lemma_matches_type(self) -> "ClassEventCreate":
        if self.type == "word" and not self.lemma:
            raise ValueError("lemma is required for a word event")
        if self.type == "lost":
            self.lemma = None
        return self


class ClassEventResult(BaseModel):
    ok: bool
    level: int | None


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

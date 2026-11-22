"""Response models for GET /api/me/progress (docs/API.md)."""

from pydantic import BaseModel


class MessageOut(BaseModel):
    kind: str
    text: str


class WordOut(BaseModel):
    lemma: str
    translation_es: str | None
    level: int


class DayOut(BaseModel):
    date: str
    practised: bool


class ProgressOut(BaseModel):
    messages: list[MessageOut]
    words: list[WordOut]
    week: list[DayOut]

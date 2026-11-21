"""Response models of GET /api/home/review (mirror docs/API.md, section HomeReview)."""

from typing import Literal

from pydantic import BaseModel


class ReviewClip(BaseModel):
    id: str
    lesson_title: str
    created_at: str
    t_start: float
    t_end: float
    transcript: str
    audio_url: str
    terms: list[str]
    kind: Literal["word", "concept"]
    lemma: str | None


class WordToPractice(BaseModel):
    word: str
    lemma: str | None
    translation_es: str | None
    definition_fr: str | None
    key_phrase: str
    level: int | None
    clip_id: str


class HomeReview(BaseModel):
    clips: list[ReviewClip]
    words_to_practice: list[WordToPractice]

from uuid import UUID

from pydantic import BaseModel


class PracticeIn(BaseModel):
    lemma: str
    clip_id: UUID | None
    passed: bool


class PracticeOut(BaseModel):
    lemma: str
    level: int
    leveled_up: bool

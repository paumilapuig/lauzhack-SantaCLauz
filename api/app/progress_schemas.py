"""Response models for GET /api/me/progress (docs/API.md)."""

from pydantic import BaseModel


class MessageOut(BaseModel):
    kind: str
    text: str


class ProgressOut(BaseModel):
    messages: list[MessageOut]

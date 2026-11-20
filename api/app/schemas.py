"""Pydantic models mirroring docs/API.md. Update API.md first, then this file."""

from pydantic import BaseModel


class Health(BaseModel):
    ok: bool


class Me(BaseModel):
    id: str
    email: str


class CurrentUser(BaseModel):
    id: str
    email: str

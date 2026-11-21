"""Pydantic models mirroring docs/API.md. Update API.md first, then this file."""

from typing import Literal

from pydantic import BaseModel

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

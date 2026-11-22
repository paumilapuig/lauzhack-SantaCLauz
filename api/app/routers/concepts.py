"""POST /api/concepts/{id}/answers: grade a student's concept exercises (no LLM)."""

from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from ..concept_answers import grade
from ..db import get_supabase
from ..roles import StudentUser

router = APIRouter(prefix="/api/concepts", tags=["concepts"])

SupabaseClient = Annotated[Client, Depends(get_supabase)]


class ConceptAnswers(BaseModel):
    answers: list[int]


class ConceptResult(BaseModel):
    correct: list[bool]
    status: Literal["understood", "review"]


def _fetch_own_gap(client: Client, gap_id: UUID, student_id: str) -> dict:
    response = (
        client.table("concept_gaps")
        .select("*")
        .eq("id", str(gap_id))
        .eq("student_id", student_id)
        .maybe_single()
        .execute()
    )
    if response is None or not response.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Concept gap not found")
    return response.data


@router.post("/{gap_id}/answers", response_model=ConceptResult)
def submit_answers(
    gap_id: UUID, body: ConceptAnswers, user: StudentUser, client: SupabaseClient
) -> ConceptResult:
    gap = _fetch_own_gap(client, gap_id, user.id)
    if gap["status"] == "understood":
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Concept already understood")
    try:
        correct, new_status = grade(gap["exercises"], body.answers)
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error
    client.table("concept_gaps").update(
        {
            "status": new_status,
            "attempts": gap["attempts"] + 1,
            "answered_at": datetime.now(UTC).isoformat(),
        }
    ).eq("id", str(gap_id)).execute()
    return ConceptResult(correct=correct, status=new_status)

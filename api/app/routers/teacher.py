"""Teacher Dashboard of a lesson (docs/API.md GET /api/teacher/lessons/{id}/dashboard). Never calls the LLM."""

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from ..db import get_supabase
from ..roles import TeacherUser
from . import teacher_dashboard as dash
from . import teacher_repository as repo

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

Db = Annotated[Client, Depends(get_supabase)]


class DashboardLesson(BaseModel):
    id: str
    title: str


class LostPeak(BaseModel):
    minute: int
    count: int


class DashboardConceptGap(BaseModel):
    student: str
    concept: str
    minutes: list[int]
    lemmas: list[str]
    status: Literal["pending", "review", "understood"]
    attempts: int


class TopWord(BaseModel):
    lemma: str
    taps: int


class WeeklyAutonomy(BaseModel):
    week: str
    autonomy: float


class DashboardStudent(BaseModel):
    name: str
    autonomy: float | None
    weekly: list[WeeklyAutonomy]


class Dashboard(BaseModel):
    lesson: DashboardLesson
    lost_peaks: list[LostPeak]
    unclear_peaks: list[LostPeak]
    concept_gaps: list[DashboardConceptGap]
    top_words: list[TopWord]
    students: list[DashboardStudent]


@router.get("/lessons/{lesson_id}/dashboard", response_model=Dashboard)
def get_dashboard(lesson_id: UUID, user: TeacherUser, db: Db) -> Dashboard:
    lesson = repo.get_lesson(db, str(lesson_id))
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")
    if lesson["teacher_id"] != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your lesson")
    sessions = repo.lesson_sessions(db, lesson["id"])
    session_ids = [session["id"] for session in sessions]
    gaps = repo.concept_gaps(db, lesson["id"])
    names = repo.display_names(db, sorted({s["student_id"] for s in sessions} | {g["student_id"] for g in gaps}))
    return Dashboard(
        lesson=DashboardLesson(id=lesson["id"], title=lesson["title"]),
        lost_peaks=dash.lost_peaks(repo.lost_events(db, session_ids)),
        unclear_peaks=dash.unclear_peaks(repo.clip_starts(db, session_ids)),
        concept_gaps=dash.concept_gaps(gaps, names),
        top_words=dash.top_words(repo.marks(db, session_ids)),
        students=dash.students(sessions, repo.word_states(db, session_ids), names),
    )

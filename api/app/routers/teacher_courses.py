"""A teacher's courses — groups of lessons such as "Biologie 1re" (docs/API.md › /api/teacher/courses)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, StringConstraints
from supabase import Client

from ..db import get_supabase
from ..roles import TeacherUser
from . import teacher_courses_repository as courses
from . import teacher_repository as lessons

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

Db = Annotated[Client, Depends(get_supabase)]
CourseName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]


class Course(BaseModel):
    id: str
    name: str
    lesson_count: int


class NewCourse(BaseModel):
    name: CourseName


class LessonCourse(BaseModel):
    course_id: UUID | None = Field(...)


class LessonCourseOut(BaseModel):
    id: str
    course_id: str | None


@router.get("/courses", response_model=list[Course])
def list_courses(user: TeacherUser, db: Db) -> list[Course]:
    rows = courses.list_courses(db, user.id)
    counts = courses.lesson_counts(db, [row["id"] for row in rows])
    return [Course(id=row["id"], name=row["name"], lesson_count=counts[row["id"]]) for row in rows]


@router.post("/courses", response_model=Course)
def create_course(body: NewCourse, user: TeacherUser, db: Db) -> Course:
    row = courses.insert_course(db, user.id, body.name)
    return Course(id=str(row["id"]), name=row["name"], lesson_count=0)


@router.patch("/lessons/{lesson_id}", response_model=LessonCourseOut)
def move_lesson(lesson_id: UUID, body: LessonCourse, user: TeacherUser, db: Db) -> LessonCourseOut:
    lesson = lessons.get_lesson(db, str(lesson_id))
    if lesson is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Lesson not found")
    if lesson["teacher_id"] != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your lesson")
    course_id = str(body.course_id) if body.course_id else None
    if course_id and not courses.is_her_course(db, course_id, user.id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown course")
    courses.set_lesson_course(db, lesson["id"], course_id)
    return LessonCourseOut(id=lesson["id"], course_id=course_id)

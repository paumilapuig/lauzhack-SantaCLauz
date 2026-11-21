from supabase import Client

from .db import get_supabase
from .glossary.schema import GlossaryTerm
from .schemas import CreateLessonJson, CreateLessonResponse, CurrentUser, LessonTerm


class LessonSaveError(Exception):
    """The lesson or its glossary terms could not be stored."""


def create_lesson(
    user: CurrentUser,
    meta: CreateLessonJson,
    terms: list[GlossaryTerm],
    db: Client | None = None,
) -> CreateLessonResponse:
    """Store a lesson and its terms; remove the lesson if the terms fail."""
    db = db or get_supabase()
    lesson_id = _insert_lesson(db, user, meta)
    try:
        rows = _insert_terms(db, lesson_id, terms)
    except Exception as error:
        db.table("lessons").delete().eq("id", lesson_id).execute()
        raise LessonSaveError("could not save lesson terms") from error
    return CreateLessonResponse(
        lesson_id=lesson_id, terms=[LessonTerm(**row) for row in rows]
    )


def _insert_lesson(db: Client, user: CurrentUser, meta: CreateLessonJson) -> str:
    row = {
        "teacher_id": user.id,
        "title": meta.title,
        "subject": meta.subject,
        "lesson_date": meta.lesson_date.isoformat(),
        "source_text": meta.source_text,
    }
    try:
        return str(db.table("lessons").insert(row).execute().data[0]["id"])
    except Exception as error:
        raise LessonSaveError("could not save lesson") from error


def _insert_terms(db: Client, lesson_id: str, terms: list[GlossaryTerm]) -> list[dict]:
    payload = [{**term.model_dump(), "lesson_id": lesson_id} for term in terms]
    rows = db.table("lesson_terms").insert(payload).execute().data
    return [{**row, "id": str(row["id"]), "lesson_id": str(row["lesson_id"])} for row in rows]

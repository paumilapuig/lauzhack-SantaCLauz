"""Reads and writes of a teacher's courses (groups of lessons) and of lessons.course_id."""
from collections import Counter

from supabase import Client


def list_courses(db: Client, teacher_id: str) -> list[dict]:
    return db.table("courses").select("id, name").eq("teacher_id", teacher_id).order("name").execute().data


def lesson_counts(db: Client, course_ids: list[str]) -> Counter:
    if not course_ids:
        return Counter()
    rows = db.table("lessons").select("course_id").in_("course_id", course_ids).execute().data
    return Counter(row["course_id"] for row in rows)


def insert_course(db: Client, teacher_id: str, name: str) -> dict:
    return db.table("courses").insert({"teacher_id": teacher_id, "name": name}).execute().data[0]


def is_her_course(db: Client, course_id: str, teacher_id: str) -> bool:
    response = db.table("courses").select("teacher_id").eq("id", course_id).maybe_single().execute()
    return bool(response and response.data and response.data["teacher_id"] == teacher_id)


def set_lesson_course(db: Client, lesson_id: str, course_id: str | None) -> None:
    db.table("lessons").update({"course_id": course_id}).eq("id", lesson_id).execute()

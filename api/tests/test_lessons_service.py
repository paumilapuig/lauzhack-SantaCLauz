from datetime import date
from types import SimpleNamespace

import pytest

from app.glossary.schema import GlossaryTerm
from app.lessons_service import LessonSaveError, create_lesson
from app.schemas import CreateLessonJson, CurrentUser

USER = CurrentUser(id="teacher-1", email="t@example.com")
META = CreateLessonJson(
    title="La respiration",
    subject="Biologie",
    lesson_date=date(2026, 11, 21),
    source_text="Les poumons...",
)


def make_term(lemma: str) -> GlossaryTerm:
    return GlossaryTerm(
        lemma=lemma,
        forms=[lemma],
        translation_es="es",
        definition_fr="def",
        transparent=False,
        key_phrase="phrase",
    )


class FakeQuery:
    def __init__(self, db: "FakeSupabase", table: str):
        self.db = db
        self.table_name = table
        self.action = ""
        self.payload = None

    def insert(self, payload):
        self.action, self.payload = "insert", payload
        return self

    def delete(self):
        self.action = "delete"
        return self

    def eq(self, column, value):
        self.payload = (column, value)
        return self

    def execute(self):
        self.db.calls.append((self.table_name, self.action, self.payload))
        if (self.table_name, self.action) in self.db.failing:
            raise RuntimeError("boom")
        if self.action != "insert":
            return SimpleNamespace(data=[])
        rows = self.payload if isinstance(self.payload, list) else [self.payload]
        stored = [{**row, "id": f"{self.table_name}-{i}"} for i, row in enumerate(rows)]
        return SimpleNamespace(data=stored)


class FakeSupabase:
    def __init__(self, failing=()):
        self.calls: list[tuple] = []
        self.failing = set(failing)

    def table(self, name):
        return FakeQuery(self, name)


def test_happy_path_sets_teacher_and_inserts_terms_once():
    db = FakeSupabase()
    response = create_lesson(USER, META, [make_term("poumon"), make_term("air")], db)

    lesson_insert = db.calls[0]
    assert lesson_insert[:2] == ("lessons", "insert")
    assert lesson_insert[2] == {
        "teacher_id": "teacher-1",
        "title": "La respiration",
        "subject": "Biologie",
        "lesson_date": "2026-11-21",
        "source_text": "Les poumons...",
    }
    term_inserts = [c for c in db.calls if c[0] == "lesson_terms"]
    assert len(term_inserts) == 1
    assert [row["lesson_id"] for row in term_inserts[0][2]] == ["lessons-0"] * 2
    assert response.lesson_id == "lessons-0"
    assert [t.lemma for t in response.terms] == ["poumon", "air"]
    assert response.terms[0].id == "lesson_terms-0"
    assert response.terms[0].lesson_id == "lessons-0"


def test_terms_insert_failure_deletes_lesson_and_raises():
    db = FakeSupabase(failing=[("lesson_terms", "insert")])
    with pytest.raises(LessonSaveError):
        create_lesson(USER, META, [make_term("poumon")], db)
    assert db.calls[-1] == ("lessons", "delete", ("id", "lessons-0"))


def test_lesson_insert_failure_skips_terms_insert():
    db = FakeSupabase(failing=[("lessons", "insert")])
    with pytest.raises(LessonSaveError):
        create_lesson(USER, META, [make_term("poumon")], db)
    assert all(call[0] != "lesson_terms" for call in db.calls)


def test_cleanup_failure_does_not_mask_the_original_terms_error():
    db = FakeSupabase(failing=[("lesson_terms", "insert"), ("lessons", "delete")])
    with pytest.raises(LessonSaveError) as error:
        create_lesson(USER, META, [make_term("poumon")], db)
    assert str(error.value.__cause__) == "boom"
    assert db.calls[-1][:2] == ("lessons", "delete")


def test_lesson_in_a_course_stores_its_course_id():
    db = FakeSupabase()
    create_lesson(USER, META.model_copy(update={"course_id": "60000000-0000-4000-8000-000000000001"}), [make_term("air")], db)
    assert db.calls[0][2]["course_id"] == "60000000-0000-4000-8000-000000000001"

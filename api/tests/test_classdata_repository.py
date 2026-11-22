from app.routers import classdata_repository as repo
from tests.classdata_seed import L0, L1, OTHER_STUDENT, STUDENT, seeded_fake

L1_LEMMAS = ["mitochondrie", "déchet", "chaleur"]


def test_list_lessons_newest_first():
    lessons = repo.list_lessons(seeded_fake())
    assert [lesson["id"] for lesson in lessons] == [L1, L0]
    assert set(lessons[0]) == {"id", "title", "subject", "lesson_date", "course_id"}


def test_get_lesson_returns_row_or_none():
    client = seeded_fake()
    assert repo.get_lesson(client, L1)["title"] == "La chaleur"
    assert repo.get_lesson(client, "10000000-0000-4000-8000-0000000000ff") is None


def test_list_terms_ordered_by_lemma():
    terms = repo.list_terms(seeded_fake(), L1)
    assert [t["lemma"] for t in terms] == sorted(L1_LEMMAS)
    assert set(terms[0]) == {"id", "lesson_id", "lemma", "forms", "translation_es",
                             "definition_fr", "transparent", "key_phrase"}


def test_mastery_rows_only_for_student_and_lemmas():
    rows = repo.mastery_rows(seeded_fake(), STUDENT, L1_LEMMAS)
    assert rows == {"déchet": {"level": 1, "times_tapped": 2}}


def test_mastery_rows_empty_lemmas_skips_query():
    assert repo.mastery_rows(object(), STUDENT, []) == {}


def test_tapped_lemmas_come_from_home_marks_of_the_student():
    client = seeded_fake()
    assert repo.tapped_lemmas(client, STUDENT, L1_LEMMAS) == {"déchet"}
    assert repo.tapped_lemmas(client, OTHER_STUDENT, L1_LEMMAS) == {"chaleur"}


def test_tapped_lemmas_ignore_words_outside_the_requested_lemmas():
    assert repo.tapped_lemmas(seeded_fake(), STUDENT, ["chaleur"]) == set()


def test_tapped_lemmas_empty_lemmas_skips_query():
    assert repo.tapped_lemmas(object(), STUDENT, []) == set()


def test_upsert_mastery_updates_without_duplicating():
    client = seeded_fake()
    repo.upsert_mastery(client, STUDENT, "déchet", 0, 3, "2026-11-21T10:00:00+00:00")
    repo.upsert_mastery(client, STUDENT, "chaleur", 2, 1, "2026-11-21T10:00:00+00:00")
    rows = client.tables["word_mastery"]
    assert len(rows) == 2
    assert repo.mastery_rows(client, STUDENT, ["déchet"]) == {"déchet": {"level": 0, "times_tapped": 3}}


def test_list_lessons_puts_null_dates_last():
    client = seeded_fake()
    client.table("lessons").insert({"title": "Sans date", "subject": None, "lesson_date": None,
                                    "created_at": "2026-11-23T00:00:00+00:00"}).execute()

    titles = [lesson["title"] for lesson in repo.list_lessons(client)]

    assert titles[-1] == "Sans date"

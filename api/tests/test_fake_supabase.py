import pytest

from tests.classdata_seed import L0, L1, OTHER_STUDENT, STUDENT, seeded_fake
from tests.fake_supabase import FakeSupabase


def test_unknown_table_raises_key_error():
    with pytest.raises(KeyError):
        FakeSupabase({}).table("nope")


def test_select_projects_columns_and_filters_with_eq():
    rows = seeded_fake().table("lesson_terms").select("lemma").eq("lesson_id", L1).execute().data
    assert sorted(r["lemma"] for r in rows) == ["chaleur", "déchet", "mitochondrie"]
    assert all(set(r) == {"lemma"} for r in rows)


def test_in_filters_on_membership():
    rows = seeded_fake().table("lesson_terms").select("lemma").in_("lemma", ["chaleur", "x"]).execute().data
    assert [r["lemma"] for r in rows] == ["chaleur"]


def test_order_desc_nulls_last_then_chained_order_is_stable():
    fake = FakeSupabase({"t": [
        {"a": 1, "b": 1}, {"a": None, "b": 2}, {"a": 2, "b": 1}, {"a": 2, "b": 3},
    ]})
    rows = fake.table("t").select("*").order("a", desc=True, nullsfirst=False).order("b", desc=True).execute().data
    assert [(r["a"], r["b"]) for r in rows] == [(2, 3), (2, 1), (1, 1), (None, 2)]


def test_lessons_order_newest_first():
    rows = seeded_fake().table("lessons").select("id").order("lesson_date", desc=True).execute().data
    assert [r["id"] for r in rows] == [L1, L0]


def test_limit_truncates():
    assert len(seeded_fake().table("lesson_terms").select("*").limit(2).execute().data) == 2


def test_maybe_single_returns_none_when_no_row():
    query = seeded_fake().table("lessons").select("*").eq("id", "missing").maybe_single()
    assert query.execute() is None


def test_maybe_single_returns_the_row():
    response = seeded_fake().table("lessons").select("*").eq("id", L1).maybe_single().execute()
    assert response.data["id"] == L1


def test_insert_fills_defaults_and_returns_rows():
    fake = seeded_fake()
    row = fake.table("class_sessions").insert({"lesson_id": L1, "student_id": STUDENT}).execute().data[0]
    assert row["id"] and row["started_at"]
    assert row in fake.tables["class_sessions"]


def test_insert_accepts_a_list():
    fake = seeded_fake()
    rows = fake.table("class_events").insert([{"type": "lost"}, {"type": "lost"}]).execute().data
    assert len(rows) == 2 and rows[0]["created_at"] and rows[0]["id"] != rows[1]["id"]


def test_upsert_updates_in_place_without_duplicating():
    fake = seeded_fake()
    before = len(fake.tables["word_mastery"])
    row = {"student_id": STUDENT, "lemma": "déchet", "level": 0, "times_tapped": 3}
    fake.table("word_mastery").upsert(row, on_conflict="student_id,lemma").execute()
    rows = fake.tables["word_mastery"]
    assert len(rows) == before
    assert [r["level"] for r in rows if r["lemma"] == "déchet" and r["student_id"] == STUDENT] == [0]


def test_upsert_inserts_when_no_key_match():
    fake = seeded_fake()
    row = {"student_id": OTHER_STUDENT, "lemma": "déchet", "level": 1, "times_tapped": 1}
    fake.table("word_mastery").upsert([row], on_conflict="student_id,lemma").execute()
    assert len(fake.tables["word_mastery"]) == 2


def test_seed_sessions_and_events():
    fake = seeded_fake()
    sessions = {s["student_id"]: s["lesson_id"] for s in fake.tables["class_sessions"]}
    assert sessions == {STUDENT: L0, OTHER_STUDENT: L1}
    assert {e["lemma"] for e in fake.tables["class_events"]} == {"chaleur", "déchet"}


def test_order_desc_defaults_to_postgres_nulls_first():
    fake = FakeSupabase({"t": [{"a": 1}, {"a": None}, {"a": 2}]})
    rows = fake.table("t").select("*").order("a", desc=True).execute().data
    assert [r["a"] for r in rows] == [None, 2, 1]

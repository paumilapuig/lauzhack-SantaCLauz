from app.routers import classdata_session_repository as repo
from tests.classdata_seed import L1, OTHER_SESSION, OTHER_STUDENT, STUDENT, STUDENT_SESSION, seeded_fake


def test_get_owned_session_returns_own_session():
    session = repo.get_owned_session(seeded_fake(), STUDENT_SESSION, STUDENT)
    assert session["id"] == STUDENT_SESSION


def test_get_owned_session_hides_foreign_session():
    assert repo.get_owned_session(seeded_fake(), OTHER_SESSION, STUDENT) is None


def test_get_owned_session_unknown_id_is_none():
    assert repo.get_owned_session(seeded_fake(), "nope", STUDENT) is None


def test_insert_session_stores_student_id():
    db = seeded_fake()
    session_id = repo.insert_session(db, L1, STUDENT)
    stored = [r for r in db.tables["class_sessions"] if r["id"] == session_id]
    assert stored[0]["student_id"] == STUDENT
    assert stored[0]["lesson_id"] == L1


def test_insert_event_stores_student_id():
    db = seeded_fake()
    repo.insert_event(db, STUDENT_SESSION, STUDENT, 7.5, "word", "chaleur")
    stored = db.tables["class_events"][-1]
    assert (stored["student_id"], stored["session_id"], stored["t_sec"]) == (STUDENT, STUDENT_SESSION, 7.5)
    assert (stored["type"], stored["lemma"]) == ("word", "chaleur")


def test_insert_lost_event_stores_context():
    db = seeded_fake()
    repo.insert_lost_event(db, STUDENT_SESSION, STUDENT, 100.0, 40.0, "Elle produit des déchets.")
    stored = db.tables["class_events"][-1]
    assert (stored["type"], stored["lemma"], stored["t_sec"]) == ("lost", None, 100.0)
    assert (stored["context_t_start"], stored["context_transcript"]) == (40.0, "Elle produit des déchets.")


def test_insert_event_allows_null_lemma():
    db = seeded_fake()
    repo.insert_event(db, STUDENT_SESSION, STUDENT, 1.0, "lost", None)
    assert db.tables["class_events"][-1]["lemma"] is None


def test_upsert_word_states_resend_keeps_row_count():
    db = seeded_fake()
    entries = [("chaleur", "green"), ("déchet", "yellow")]
    repo.upsert_word_states(db, STUDENT_SESSION, STUDENT, entries)
    repo.upsert_word_states(db, STUDENT_SESSION, STUDENT, [("chaleur", "orange"), ("déchet", "yellow")])
    assert len(db.tables["word_states_log"]) == 2
    assert sorted(repo.session_states(db, STUDENT_SESSION, STUDENT)) == ["orange", "yellow"]


def test_session_states_excludes_other_students():
    db = seeded_fake()
    repo.upsert_word_states(db, STUDENT_SESSION, STUDENT, [("chaleur", "green")])
    repo.upsert_word_states(db, OTHER_SESSION, OTHER_STUDENT, [("chaleur", "yellow")])
    assert repo.session_states(db, STUDENT_SESSION, STUDENT) == ["green"]


def test_upsert_empty_entries_is_noop():
    db = seeded_fake()
    repo.upsert_word_states(db, STUDENT_SESSION, STUDENT, [])
    assert db.tables["word_states_log"] == []

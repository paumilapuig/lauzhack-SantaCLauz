from tests.test_home_concepts import make_gap
from tests.test_home_review import (
    OTHER_STUDENT,
    STUDENT,
    URL as HOME_URL,
    client_for,  # noqa: F401  (pytest fixture)
    make_term,
    role,  # noqa: F401  (pytest fixture)
    seed,
)

GAP = make_gap(1)
WORDS_URL = f"/api/concepts/{GAP['id']}/words"
STEP_WITH_WORDS = {"fr": "La cellule libère de l'énergie.", "es": "La célula libera energía.",
                   "nodes": [], "links": [], "words": [{"fr": "libère", "es": "libera"}]}


def db_with(gap=GAP, terms=None):
    db = seed(terms=terms)
    db.tables["concept_gaps"] = [{**gap, "explanation": [STEP_WITH_WORDS]}]
    db.tables["concept_word_marks"] = []
    db.tables["mark_level_changes"] = []
    return db


def tap(client_for, db, word, key_phrase="La cellule libère de l'énergie."):  # noqa: F811
    return client_for(db).post(WORDS_URL, json={"word": word, "key_phrase": key_phrase})


def test_a_word_of_the_step_gets_its_spanish_and_is_saved(client_for):  # noqa: F811
    db = db_with()

    response = tap(client_for, db, " Libère ")

    assert response.status_code == 200
    assert response.json() == {"word": "libère", "lemma": None, "translation_es": "libera", "level": None}
    row = db.tables["concept_word_marks"][0]
    assert (row["student_id"], row["gap_id"], row["word"], row["translation_es"]) == (STUDENT, GAP["id"], "libère", "libera")
    assert row["key_phrase"] == "La cellule libère de l'énergie."


def test_a_glossary_word_uses_the_glossary_and_lowers_the_level_once(client_for):  # noqa: F811
    db = db_with(terms=[make_term("mitochondrie")])

    first = tap(client_for, db, "mitochondries").json()
    second = tap(client_for, db, "mitochondries").json()

    assert first == {"word": "mitochondries", "lemma": "mitochondrie", "translation_es": "es-mitochondrie", "level": 0}
    assert second["level"] == 0
    assert len(db.tables["concept_word_marks"]) == 1
    assert len(db.tables["mark_level_changes"]) == 1


def test_an_unknown_word_is_saved_without_translation(client_for):  # noqa: F811
    db = db_with()

    assert tap(client_for, db, "cellule").json()["translation_es"] is None
    assert db.tables["concept_word_marks"][0]["word"] == "cellule"


def test_other_students_gap_is_404_and_empty_word_is_422(client_for):  # noqa: F811
    assert tap(client_for, db_with(make_gap(1, student=OTHER_STUDENT)), "libère").status_code == 404
    assert tap(client_for, db_with(), "   ").status_code == 422


def test_tapped_concept_words_join_the_practice_list(client_for):  # noqa: F811
    db = db_with(terms=[make_term("mitochondrie")])
    tap(client_for, db, "libère")

    words = client_for(db).get(HOME_URL).json()["words_to_practice"]

    assert words == [{"word": "libère", "lemma": None, "translation_es": "libera", "definition_fr": None,
                      "key_phrase": "La cellule libère de l'énergie.", "level": None, "clip_id": None}]


def test_a_mastered_glossary_word_from_a_concept_leaves_the_practice_list(client_for):  # noqa: F811
    db = db_with(terms=[make_term("mitochondrie", transparent=True)])
    tap(client_for, db, "mitochondrie")
    db.tables["word_mastery"] = [{"student_id": STUDENT, "lemma": "mitochondrie", "level": 3, "times_tapped": 1}]

    assert client_for(db).get(HOME_URL).json()["words_to_practice"] == []

from tests.test_home_concepts import make_gap
from tests.test_home_review import (
    OTHER_STUDENT,
    client_for,  # noqa: F401  (pytest fixture)
    role,  # noqa: F401  (pytest fixture)
    seed,
)

GAP_ID = make_gap(1)["id"]
URL = f"/api/concepts/{GAP_ID}/answers"
RIGHT = [0, 2]
WRONG = [1, 2]


def db_with(*gaps):
    db = seed()
    db.tables["concept_gaps"] = list(gaps)
    return db


def post(client_for, db, answers, url=URL):  # noqa: F811
    return client_for(db).post(url, json={"answers": answers})


def test_all_right_marks_understood(client_for):  # noqa: F811
    db = db_with(make_gap(1))
    response = post(client_for, db, RIGHT)
    assert response.status_code == 200
    assert response.json() == {"correct": [True, True], "status": "understood"}
    row = db.tables["concept_gaps"][0]
    assert (row["status"], row["attempts"]) == ("understood", 1)
    assert row["answered_at"]


def test_wrong_answer_goes_to_review(client_for):  # noqa: F811
    db = db_with(make_gap(1))
    response = post(client_for, db, WRONG)
    assert response.json() == {"correct": [False, True], "status": "review"}
    assert db.tables["concept_gaps"][0]["status"] == "review"


def test_two_attempts_count_two(client_for):  # noqa: F811
    db = db_with(make_gap(1))
    post(client_for, db, WRONG)
    post(client_for, db, WRONG)
    assert db.tables["concept_gaps"][0]["attempts"] == 2


def test_other_students_gap_is_404(client_for):  # noqa: F811
    db = db_with(make_gap(1, student=OTHER_STUDENT))
    assert post(client_for, db, RIGHT).status_code == 404


def test_missing_gap_is_404(client_for):  # noqa: F811
    assert post(client_for, db_with(), RIGHT).status_code == 404


def test_already_understood_is_409(client_for):  # noqa: F811
    db = db_with(make_gap(1, status="understood"))
    assert post(client_for, db, RIGHT).status_code == 409


def test_wrong_length_is_422(client_for):  # noqa: F811
    assert post(client_for, db_with(make_gap(1)), [0]).status_code == 422


def test_index_out_of_range_is_422(client_for):  # noqa: F811
    assert post(client_for, db_with(make_gap(1)), [0, 3]).status_code == 422


def test_teacher_is_403(client_for, role):  # noqa: F811
    role["role"] = "teacher"
    assert post(client_for, db_with(make_gap(1)), RIGHT).status_code == 403


def test_no_token_is_401():
    from fastapi.testclient import TestClient

    import app.main as main

    assert TestClient(main.app).post(URL, json={"answers": RIGHT}).status_code == 401

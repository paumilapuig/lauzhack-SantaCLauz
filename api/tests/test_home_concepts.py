from tests.test_home_review import (
    LESSON,
    OTHER_STUDENT,
    STUDENT,
    URL,
    client_for,  # noqa: F401  (pytest fixture)
    make_clip,
    role,  # noqa: F401  (pytest fixture)
    seed,
)

STEP = {"fr": "La cellule reçoit du sucre.", "es": "La célula recibe azúcar.", "visual": "🍞 → 🔋"}


def make_gap(n, status="pending", student=STUDENT, day=15, lesson=LESSON):
    return {
        "id": f"50000000-0000-4000-8000-{n:012d}",
        "session_id": "20000000-0000-4000-8000-000000000001",
        "student_id": student,
        "lesson_id": lesson,
        "concept": f"concept {n}",
        "minutes": [12],
        "lemmas": ["mitochondrie"],
        "explanation": [STEP],
        "exercises": [
            {"question": "Que fabrique la mitochondrie ?", "options": ["énergie", "sucre"], "answer": 0},
            {"question": "Et après ?", "options": ["eau", "air", "feu"], "answer": 2},
        ],
        "status": status,
        "attempts": 0,
        "created_at": f"2026-11-{day:02d}T10:00:00+00:00",
    }


def home_with(client_for, gaps, **seed_kwargs):  # noqa: F811
    db = seed(**seed_kwargs)
    db.tables["concept_gaps"] = list(gaps)
    return client_for(db).get(URL).json()


def test_pending_and_review_gaps_appear(client_for):  # noqa: F811
    gaps = [make_gap(1, "pending"), make_gap(2, "review"), make_gap(3, "understood")]
    body = home_with(client_for, gaps)
    assert {c["id"][-1] for c in body["concepts_to_learn"]} == {"1", "2"}


def test_other_students_gaps_are_excluded(client_for):  # noqa: F811
    body = home_with(client_for, [make_gap(1, student=OTHER_STUDENT)])
    assert body["concepts_to_learn"] == []


def test_exercises_never_contain_answer(client_for):  # noqa: F811
    body = home_with(client_for, [make_gap(1)])
    exercises = body["concepts_to_learn"][0]["exercises"]
    assert len(exercises) == 2
    assert all(set(e) == {"question", "options"} for e in exercises)
    assert "answer" not in str(body["concepts_to_learn"])


def test_newest_first_with_lesson_title_and_shape(client_for):  # noqa: F811
    body = home_with(client_for, [make_gap(1, day=14), make_gap(2, day=16)])
    concepts = body["concepts_to_learn"]
    assert [c["concept"] for c in concepts] == ["concept 2", "concept 1"]
    first = concepts[0]
    assert first["lesson_title"] == "La cellule"
    assert first["status"] == "pending"
    assert first["lemmas"] == ["mitochondrie"]
    assert first["explanation"] == [{**STEP, "nodes": [], "links": [], "words": []}]


def test_words_and_clips_are_unchanged_by_gaps(client_for):  # noqa: F811
    body = home_with(client_for, [make_gap(1)], clips=[make_clip(1)])
    assert [c["id"][-1] for c in body["clips"]] == ["1"]
    assert body["words_to_practice"] == []


def test_student_without_gaps_gets_empty_list(client_for):  # noqa: F811
    assert home_with(client_for, [])["concepts_to_learn"] == []


def test_a_diagram_step_reaches_the_student_with_from_as_key():
    from app.home_schemas import ConceptStep

    step = ConceptStep.model_validate({
        "fr": "Le glucose entre dans la cellule.", "es": "La glucosa entra en la célula.",
        "nodes": [{"id": "glucose", "fr": "Glucose", "kind": "input", "inside": None}],
        "links": [{"from": "glucose", "to": "glucose", "fr": "entre"}],
        "words": [{"fr": "entre", "es": "entra"}],
    })

    dumped = step.model_dump(by_alias=True)
    assert dumped["links"][0]["from"] == "glucose"
    assert dumped["visual"] == ""

import json

import httpx

from app.config import Settings
from app.lost_concepts import process_session
from tests.fake_supabase import FakeSupabase

SESSION = "s1"
STUDENT = "student-1"
LESSON = "lesson-1"


def settings(api_key: str | None = "sk-test") -> Settings:
    return Settings(
        _env_file=None,
        supabase_url="https://example.supabase.co",
        supabase_secret_key="x",
        openrouter_api_key=api_key,
    )


def llm_reply() -> str:
    step = {"fr": "La cellule respire.", "es": "La célula respira.", "visual": "🫁 → 🔋"}
    exercise = {"question": "Qui respire ?", "options": ["la cellule", "la pierre"], "answer": 1}
    concept = {"concept": "La respiration", "moments": [1, 2], "lemmas": ["mitochondrie", "soleil"],
               "explanation": [step, step, step], "exercises": [exercise, exercise]}
    return json.dumps({"concepts": [concept]})


def client(seen: list, content: str | None = None, status: int = 200) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(json.loads(request.content))
        if status != 200:
            return httpx.Response(status, text="down")
        return httpx.Response(200, json={"choices": [{"message": {"content": content or llm_reply()}}], "usage": {}})

    return httpx.Client(transport=httpx.MockTransport(handler))


def lost(session_id: str, t_sec: float, transcript: str | None) -> dict:
    return {"session_id": session_id, "student_id": STUDENT, "t_sec": t_sec, "type": "lost",
            "context_t_start": max(0.0, t_sec - 60), "context_transcript": transcript}


def database(events: list[dict], gaps: list[dict] | None = None) -> FakeSupabase:
    return FakeSupabase({
        "class_sessions": [{"id": SESSION, "lesson_id": LESSON, "student_id": STUDENT},
                           {"id": "other", "lesson_id": LESSON, "student_id": "student-2"}],
        "class_events": events,
        "lesson_terms": [{"lesson_id": LESSON, "lemma": "mitochondrie"}, {"lesson_id": "x", "lemma": "soleil"}],
        "concept_gaps": gaps if gaps is not None else [],
    })


def two_lost_moments() -> list[dict]:
    return [
        lost(SESSION, 150, "Elle produit aussi des déchets."),
        lost(SESSION, 70, "Les mitochondries fabriquent l'énergie."),
        {"session_id": SESSION, "student_id": STUDENT, "t_sec": 90, "type": "unclear", "context_transcript": None},
    ]


def test_two_lost_moments_make_one_call_and_store_pending_gaps_with_answers():
    db, seen = database(two_lost_moments()), []

    inserted = process_session(SESSION, db=db, settings=settings(), http=client(seen))

    assert inserted == 1
    assert len(seen) == 1
    prompt = seen[0]["messages"][1]["content"]
    assert prompt.index("Les mitochondries") < prompt.index("des déchets")
    row = db.tables["concept_gaps"][0]
    assert (row["session_id"], row["student_id"], row["lesson_id"]) == (SESSION, STUDENT, LESSON)
    assert row["concept"] == "La respiration"
    assert row["minutes"] == [1, 2]
    assert row["lemmas"] == ["mitochondrie"]
    assert row["status"] == "pending"
    assert row["exercises"][0]["answer"] == 1
    assert row["explanation"][0] == {"fr": "La cellule respire.", "es": "La célula respira.", "visual": "🫁 → 🔋",
                                     "nodes": [], "links": [], "words": []}


def test_no_lost_moment_with_text_makes_no_call():
    db, seen = database([lost(SESSION, 30, "   "), lost(SESSION, 40, None)]), []

    assert process_session(SESSION, db=db, settings=settings(), http=client(seen)) == 0
    assert seen == []
    assert db.tables["concept_gaps"] == []


def test_existing_gaps_for_the_session_make_no_call():
    db, seen = database(two_lost_moments(), gaps=[{"id": "g0", "session_id": SESSION}]), []

    assert process_session(SESSION, db=db, settings=settings(), http=client(seen)) == 0
    assert seen == []
    assert len(db.tables["concept_gaps"]) == 1


def test_only_events_of_the_requested_session_are_used():
    events = [lost("other", 50, "Autre élève."), lost(SESSION, 70, "Les mitochondries.")]
    db, seen = database(events), []

    process_session(SESSION, db=db, settings=settings(), http=client(seen))

    prompt = seen[0]["messages"][1]["content"]
    assert "Les mitochondries." in prompt
    assert "Autre élève." not in prompt


def test_without_api_key_nothing_is_called_or_raised():
    db, seen = database(two_lost_moments()), []

    assert process_session(SESSION, db=db, settings=settings(api_key=None), http=client(seen)) == 0
    assert seen == []


def test_llm_failure_stores_nothing_and_does_not_raise():
    db = database(two_lost_moments())

    assert process_session(SESSION, db=db, settings=settings(), http=client([], status=500)) == 0
    assert db.tables["concept_gaps"] == []


def test_unreadable_llm_reply_stores_nothing_and_does_not_raise():
    db = database(two_lost_moments())

    assert process_session(SESSION, db=db, settings=settings(), http=client([], content="not json")) == 0
    assert db.tables["concept_gaps"] == []


def test_unknown_session_makes_no_call():
    db, seen = database(two_lost_moments()), []

    assert process_session("missing", db=db, settings=settings(), http=client(seen)) == 0
    assert seen == []

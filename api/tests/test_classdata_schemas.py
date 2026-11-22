import pytest
from pydantic import ValidationError

from app.routers.classdata_schemas import (
    ClassEventCreate,
    ClassPack,
    LessonSummary,
    LessonTerm,
    WordStatesSubmit,
)

LESSON_ID = "8c1e0000-0000-0000-0000-000000000001"


CONTEXT = {"t_start": 40.0, "transcript": "Elle produit des déchets."}


def test_lost_event_keeps_context():
    event = ClassEventCreate(t_sec=100.0, type="lost", lemma=None, context=CONTEXT)
    assert (event.context.t_start, event.context.transcript) == (40.0, "Elle produit des déchets.")


def test_lost_event_accepts_empty_transcript():
    assert ClassEventCreate(t_sec=5.0, type="lost", context={"t_start": 0, "transcript": ""}).context.transcript == ""


@pytest.mark.parametrize("body", [
    {"t_sec": 1.0, "type": "word", "lemma": "déchet", "context": CONTEXT},
    {"t_sec": 1.0, "type": "unclear", "context": CONTEXT},
    {"t_sec": 100.0, "type": "lost"},
    {"t_sec": 100.0, "type": "lost", "lemma": "déchet", "context": CONTEXT},
    {"t_sec": -1, "type": "lost", "context": {"t_start": 0, "transcript": ""}},
    {"t_sec": 30.0, "type": "lost", "context": {"t_start": 40.0, "transcript": ""}},
    {"t_sec": 100.0, "type": "lost", "context": {"t_start": 29.0, "transcript": ""}},
    {"t_sec": 100.0, "type": "lost", "context": {"t_start": -1, "transcript": ""}},
    {"t_sec": 100.0, "type": "lost", "context": {"t_start": 40.0, "transcript": "a" * 5001}},
], ids=["word", "unclear", "no-context", "lemma", "negative-t", "start-after-t",
        "over-70s", "negative-start", "long-transcript"])
def test_invalid_lost_event_rejected(body):
    with pytest.raises(ValidationError):
        ClassEventCreate(**body)


def test_duplicate_lemmas_rejected():
    states = [{"lemma": "a", "state": "green"}, {"lemma": "a", "state": "yellow"}]
    with pytest.raises(ValidationError):
        WordStatesSubmit(states=states)


def test_empty_states_valid_and_bad_state_rejected():
    assert WordStatesSubmit(states=[]).states == []
    with pytest.raises(ValidationError):
        WordStatesSubmit(states=[{"lemma": "a", "state": "red"}])


def test_class_pack_dumps_api_keys():
    pack = ClassPack(
        lesson=LessonSummary(
            id=LESSON_ID, title="T", subject=None, lesson_date=None
        ),
        terms=[
            LessonTerm(
                id="t1",
                lesson_id=LESSON_ID,
                lemma="déchet",
                forms=["déchet"],
                translation_es=None,
                definition_fr=None,
                transparent=False,
                key_phrase=None,
            )
        ],
        mastery={"déchet": 0},
        previously_tapped=[],
    )
    dumped = pack.model_dump()
    assert set(dumped) == {"lesson", "terms", "mastery", "previously_tapped"}
    assert set(dumped["lesson"]) == {"id", "title", "subject", "lesson_date"}
    assert set(dumped["terms"][0]) == {
        "id", "lesson_id", "lemma", "forms", "translation_es",
        "definition_fr", "transparent", "key_phrase",
    }

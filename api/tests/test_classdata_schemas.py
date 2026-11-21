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


def test_word_event_requires_lemma():
    with pytest.raises(ValidationError):
        ClassEventCreate(t_sec=1.0, type="word", lemma=None)
    with pytest.raises(ValidationError):
        ClassEventCreate(t_sec=1.0, type="word", lemma="")


def test_word_event_keeps_lemma():
    event = ClassEventCreate(t_sec=12.4, type="word", lemma="déchet")
    assert event.lemma == "déchet"


def test_lost_event_drops_lemma():
    event = ClassEventCreate(t_sec=1.0, type="lost", lemma="déchet")
    assert event.lemma is None


def test_negative_t_sec_rejected():
    with pytest.raises(ValidationError):
        ClassEventCreate(t_sec=-1, type="lost")


def test_unclear_type_rejected():
    with pytest.raises(ValidationError):
        ClassEventCreate(t_sec=1.0, type="unclear")


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

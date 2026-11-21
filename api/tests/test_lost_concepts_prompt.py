from app.glossary.schema import GlossaryTerm
from app.lost_concepts.prompt import (
    MAX_CONTEXTS,
    MAX_TRANSCRIPT_CHARS,
    build_messages,
    select_contexts,
)
from app.lost_concepts.schema import LostContext

GLOSSARY = [
    GlossaryTerm(
        lemma="respirer",
        forms=["respire"],
        translation_es="respirar",
        definition_fr="Prendre de l'air.",
        transparent=True,
        key_phrase="Nous respirons.",
    ),
    GlossaryTerm(
        lemma="poumon",
        forms=["poumons"],
        translation_es="pulmón",
        definition_fr="Organe de la respiration.",
        transparent=False,
        key_phrase="Les poumons se remplissent.",
    ),
]


def _contexts(count: int) -> list[LostContext]:
    return [
        LostContext(event_id=f"evt-{i}", t_sec=i, transcript=f"texte {i}") for i in range(count)
    ]


def _user_text(messages: list[dict]) -> str:
    return messages[1]["content"]


def test_messages_contain_event_ids_transcripts_and_glossary():
    messages = build_messages(_contexts(3), GLOSSARY)

    assert [m["role"] for m in messages] == ["system", "user"]
    user = _user_text(messages)
    for i in range(3):
        assert f"evt-{i}" in user
        assert f"texte {i}" in user
    assert "respirer — respirar" in user
    assert "poumon — pulmón" in user


def test_only_the_most_recent_contexts_are_kept():
    messages = build_messages(_contexts(25), GLOSSARY)

    user = _user_text(messages)
    present = [i for i in range(25) if f"[evt-{i}]" in user]
    assert present == list(range(5, 25))
    assert len(present) == MAX_CONTEXTS


def test_select_contexts_returns_ascending_by_time():
    shuffled = list(reversed(_contexts(25)))

    selected = select_contexts(shuffled)

    assert [c.t_sec for c in selected] == list(range(5, 25))


def test_long_transcript_keeps_only_its_end():
    long_text = "START" + "x" * 2990 + "END!!"
    context = LostContext(event_id="evt-long", t_sec=1, transcript=long_text)

    [selected] = select_contexts([context])

    assert len(selected.transcript) == MAX_TRANSCRIPT_CHARS
    assert selected.transcript.endswith("END!!")
    assert "START" not in selected.transcript

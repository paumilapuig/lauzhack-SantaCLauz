from app.lost_concepts.prompt import (
    MAX_CONTEXTS,
    MAX_TRANSCRIPT_CHARS,
    SYSTEM_PROMPT,
    build_messages,
    select_moments,
)
from app.lost_concepts.schema import LostMoment

LEMMAS = ["mitochondrie", "dioxyde de carbone"]


def moment(n: int, t_sec: float, transcript: str) -> LostMoment:
    return LostMoment(n=n, t_sec=t_sec, transcript=transcript)


def user_text(messages: list[dict]) -> str:
    return messages[1]["content"]


def test_messages_contain_every_moment_number_transcript_and_lemma():
    moments = [moment(1, 60, "Les mitochondries."), moment(2, 120, "Le dioxyde de carbone sort.")]

    messages = build_messages(moments, LEMMAS)

    assert messages[0] == {"role": "system", "content": SYSTEM_PROMPT}
    text = user_text(messages)
    for expected in ("[1]", "Les mitochondries.", "[2]", "Le dioxyde de carbone sort.", *LEMMAS):
        assert expected in text


def test_system_prompt_asks_for_the_concept_gap_shape():
    for expected in ('"concepts"', '"moments"', '"explanation"', '"nodes"', '"links"', '"words"', '"kind"',
                     '"inside"', '"exercises"', '"answer"', "EXACTLY ONE option"):
        assert expected in SYSTEM_PROMPT


def test_system_prompt_no_longer_asks_for_emoji():
    assert '"visual"' not in SYSTEM_PROMPT
    assert "Do not use emoji" in SYSTEM_PROMPT


def test_select_keeps_the_most_recent_moments_and_renumbers_them():
    moments = [moment(i + 1, float(i), f"fragment-{i}") for i in range(25)]

    selected = select_moments(moments)

    assert len(selected) == MAX_CONTEXTS == 20
    assert [m.n for m in selected] == list(range(1, 21))
    assert [m.t_sec for m in selected] == [float(i) for i in range(5, 25)]


def test_select_sorts_by_time_whatever_the_input_order():
    selected = select_moments([moment(1, 200, "b"), moment(2, 100, "a")])

    assert [(m.n, m.t_sec, m.transcript) for m in selected] == [(1, 100, "a"), (2, 200, "b")]


def test_select_keeps_the_end_of_a_long_transcript():
    transcript = "START" + "x" * 3000 + "END"

    selected = select_moments([moment(1, 10, transcript)])

    assert len(selected[0].transcript) == MAX_TRANSCRIPT_CHARS
    assert selected[0].transcript.endswith("END")
    assert "START" not in selected[0].transcript

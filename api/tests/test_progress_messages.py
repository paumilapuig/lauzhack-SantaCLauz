import re
from datetime import UTC, datetime, timedelta

from app.progress_messages import ProgressMessage, build_progress_messages

NOW = datetime(2026, 11, 20, 15, 0, tzinfo=UTC)  # Friday
THIS_WEEK = datetime(2026, 11, 16, 0, 0, tzinfo=UTC)  # Monday 00:00
LAST_WEEK = THIS_WEEK - timedelta(seconds=1)
DEFAULT_KEEP_GOING = ProgressMessage("keep_going", "Sigue así, vas muy bien")


def texts(messages):
    return [m.text for m in messages]


def test_twelve_distinct_lemmas_are_counted_in_plural():
    passed = [(f"mot{i}", NOW) for i in range(12)]
    messages = build_progress_messages(passed, [], {}, NOW)
    assert messages[0] == ProgressMessage(
        "learned_this_week", "Esta semana has aprendido 12 palabras nuevas"
    )


def test_same_lemma_three_times_counts_once_in_singular():
    passed = [("mot", NOW)] * 3
    messages = build_progress_messages(passed, [], {}, NOW)
    assert messages[0].text == "Esta semana has aprendido 1 palabra nueva"


def test_last_week_practices_are_not_counted():
    passed = [("mot", THIS_WEEK), ("vieux", LAST_WEEK)]
    messages = build_progress_messages(passed, [], {}, NOW)
    assert messages[0].text == "Esta semana has aprendido 1 palabra nueva"
    only_old = build_progress_messages([("vieux", LAST_WEEK)], [], {}, NOW)
    assert only_old[0].kind != "learned_this_week"


def test_no_help_needed_picks_newest_passed_lemma_at_level_two_or_more():
    passed = [("a", NOW), ("b", NOW), ("c", NOW)]
    levels = {"a": 1, "b": 2, "c": 3}
    messages = build_progress_messages(passed, [], levels, NOW)
    assert messages[1] == ProgressMessage(
        "no_help_needed", "Ya no necesitas ayuda con «b»"
    )


def test_no_help_needed_is_omitted_when_no_lemma_is_learned():
    messages = build_progress_messages([("a", NOW)], [], {"a": 1}, NOW)
    assert [m.kind for m in messages] == ["learned_this_week", "keep_going"]


def test_keep_going_picks_newest_pending_mark():
    marks = ["done", "pending1", "pending2"]
    levels = {"done": 2, "pending1": 1}
    messages = build_progress_messages([], marks, levels, NOW)
    assert messages == [
        ProgressMessage("keep_going", "Sigue así: mañana repasamos «pending1»")
    ]


def test_keep_going_falls_back_when_all_marks_are_learned():
    messages = build_progress_messages([], ["a"], {"a": 2}, NOW)
    assert messages == [DEFAULT_KEEP_GOING]


def test_no_data_gives_only_default_keep_going():
    assert build_progress_messages([], [], {}, NOW) == [DEFAULT_KEEP_GOING]


def test_texts_never_contain_percentages_or_out_of_totals():
    passed = [(f"mot{i}", NOW) for i in range(12)]
    levels = {f"mot{i}": 3 for i in range(12)}
    cases = [
        build_progress_messages(passed, ["x"], levels, NOW),
        build_progress_messages(passed[:1], [], {}, NOW),
        build_progress_messages([], [], {}, NOW),
    ]
    for messages in cases:
        for text in texts(messages):
            assert "%" not in text
            assert not re.search(r"\d+ de \d+", text)

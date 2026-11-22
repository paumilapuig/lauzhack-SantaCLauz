from datetime import datetime

import pytest

from app import mastery


def test_initial_level():
    assert mastery.initial_level(True) == 3
    assert mastery.initial_level(False) == 0


@pytest.mark.parametrize(
    "level,tapped,expected",
    [
        (3, False, "green"),
        (2, True, "green"),
        (1, True, "orange"),
        (0, True, "orange"),
        (1, False, "yellow"),
        (0, False, "yellow"),
    ],
)
def test_state(level, tapped, expected):
    assert mastery.state(level, tapped) == expected


@pytest.mark.parametrize("level,delta,expected", [(1, -1, 2), (0, 0, 0), (3, -1, 3), (0, -1, 1)])
def test_revert_mark_gives_back_exactly_what_was_subtracted(level, delta, expected):
    assert mastery.revert_mark(level, delta) == expected


def test_apply_tap_bounds():
    assert mastery.apply_tap(3) == 2
    assert mastery.apply_tap(0) == 0


def test_apply_practice_bounds():
    assert mastery.apply_practice(1, True) == 2
    assert mastery.apply_practice(1, False) == 1
    assert mastery.apply_practice(3, True) == 3


def test_apply_preview_bounds():
    assert mastery.apply_preview(0) == 1
    assert mastery.apply_preview(3) == 3


@pytest.mark.parametrize(
    "level,level_delta,expected",
    [(0, 0, 0), (1, -1, 2), (3, -1, 3), (2, 0, 2)],
)
def test_revert_mark(level, level_delta, expected):
    assert mastery.revert_mark(level, level_delta) == expected


def test_autonomy():
    assert mastery.autonomy([]) == 0.0
    assert mastery.autonomy(["green", "yellow", "orange", "green"]) == 0.5


def test_weekly_autonomy_year_end_week_53():
    result = mastery.weekly_autonomy([(datetime(2026, 12, 31), 0.4)])
    assert result == [{"week": "2026-W53", "autonomy": 0.4}]


def test_weekly_autonomy_zero_padded_mean_and_sorted():
    sessions = [
        (datetime(2026, 1, 14), 0.8),
        (datetime(2026, 1, 5), 0.2),
        (datetime(2026, 1, 6), 0.4),
    ]
    result = mastery.weekly_autonomy(sessions)
    assert [r["week"] for r in result] == ["2026-W02", "2026-W03"]
    assert result[0]["autonomy"] == pytest.approx(0.3)
    assert result[1]["autonomy"] == pytest.approx(0.8)

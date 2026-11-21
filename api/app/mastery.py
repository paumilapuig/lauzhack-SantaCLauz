"""Pure mastery and autonomy logic. Levels run 0..3; no I/O."""

from collections import defaultdict
from datetime import datetime

MAX_LEVEL = 3
GREEN_FROM_LEVEL = 2


def initial_level(transparent: bool) -> int:
    """Starting level: transparent words (cognates) start mastered."""
    return MAX_LEVEL if transparent else 0


def state(level: int, previously_tapped: bool) -> str:
    """Subtitle state: green (no help), orange (tapped before), else yellow."""
    if level >= GREEN_FROM_LEVEL:
        return "green"
    return "orange" if previously_tapped else "yellow"


def apply_tap(level: int) -> int:
    """A tap means the student needed help: level drops by 1, min 0."""
    return max(0, level - 1)


def apply_practice(level: int, passed: bool) -> int:
    """Passing a practice activity raises the level by 1, max 3."""
    return min(MAX_LEVEL, level + 1) if passed else level


def apply_preview(level: int) -> int:
    """Previewing the word raises the level by 1, max 3."""
    return min(MAX_LEVEL, level + 1)


def autonomy(states: list[str]) -> float:
    """Share of words shown green; 0.0 for no words."""
    if not states:
        return 0.0
    return states.count("green") / len(states)


def _iso_week(moment: datetime) -> str:
    year, week, _ = moment.isocalendar()
    return f"{year}-W{week:02d}"


def weekly_autonomy(sessions: list[tuple[datetime, float]]) -> list[dict]:
    """Unweighted mean autonomy per ISO week, sorted by week."""
    by_week: dict[str, list[float]] = defaultdict(list)
    for moment, value in sessions:
        by_week[_iso_week(moment)].append(value)
    return [
        {"week": week, "autonomy": sum(values) / len(values)}
        for week, values in sorted(by_week.items())
    ]

"""Encouraging progress messages for the student. Pure: no I/O, never percentages."""

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone

from app.mastery import GREEN_FROM_LEVEL

DEFAULT_KEEP_GOING = "Sigue así, vas muy bien"
PENDING_BELOW_LEVEL = 2


@dataclass(frozen=True)
class ProgressMessage:
    kind: str
    text: str


def _week_start(now: datetime) -> datetime:
    utc_now = now.astimezone(timezone.utc)
    monday = utc_now.date() - timedelta(days=utc_now.weekday())
    return datetime.combine(monday, time.min, tzinfo=timezone.utc)


def _learned_this_week(
    passed: list[tuple[str, datetime]], now: datetime
) -> ProgressMessage | None:
    start = _week_start(now)
    count = len({lemma for lemma, created_at in passed if created_at >= start})
    if count == 0:
        return None
    noun = "palabra nueva" if count == 1 else "palabras nuevas"
    return ProgressMessage(
        "learned_this_week", f"Esta semana has aprendido {count} {noun}"
    )


def _no_help_needed(
    passed: list[tuple[str, datetime]], levels: Mapping[str, int]
) -> ProgressMessage | None:
    for lemma, _ in passed:
        if levels.get(lemma, 0) >= GREEN_FROM_LEVEL:
            return ProgressMessage(
                "no_help_needed", f"Ya no necesitas ayuda con «{lemma}»"
            )
    return None


def _keep_going(mark_lemmas: list[str], levels: Mapping[str, int]) -> ProgressMessage:
    for lemma in mark_lemmas:
        if levels.get(lemma, 0) < PENDING_BELOW_LEVEL:
            return ProgressMessage("keep_going", f"Sigue así: mañana repasamos «{lemma}»")
    return ProgressMessage("keep_going", DEFAULT_KEEP_GOING)


def build_progress_messages(
    passed: list[tuple[str, datetime]],
    mark_lemmas: list[str],
    levels: Mapping[str, int],
    now: datetime,
) -> list[ProgressMessage]:
    optional = [_learned_this_week(passed, now), _no_help_needed(passed, levels)]
    messages = [message for message in optional if message is not None]
    return [*messages, _keep_going(mark_lemmas, levels)]

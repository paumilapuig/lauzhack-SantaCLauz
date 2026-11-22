"""Her word garden and her week for GET /api/me/progress. Pure: no I/O, never percentages."""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass(frozen=True)
class WordGrowth:
    lemma: str
    translation_es: str | None
    level: int


@dataclass(frozen=True)
class WeekDay:
    date: str
    practised: bool


def build_words(
    mark_lemmas: Iterable[str],
    passed_lemmas: Iterable[str],
    levels: Mapping[str, int],
    translations: Mapping[str, str],
) -> list[WordGrowth]:
    """Every glossary word she met, once: the ones she marked first (newest first), then the ones only practised."""
    ordered = list(dict.fromkeys([*mark_lemmas, *passed_lemmas]))
    return [WordGrowth(lemma, translations.get(lemma), levels.get(lemma, 0)) for lemma in ordered]


def build_week(practice_times: Iterable[datetime], now: datetime) -> list[WeekDay]:
    """Monday → Sunday of the current UTC week; a day is practised when she finished a practice on it."""
    today = now.astimezone(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())
    days = {t.astimezone(timezone.utc).date() for t in practice_times}
    week = [monday + timedelta(days=offset) for offset in range(7)]
    return [WeekDay(day.isoformat(), day in days) for day in week]

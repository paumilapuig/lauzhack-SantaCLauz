"""Level changes of home marks (docs/API.md › Rules › Changes): −1 once per lemma and session, undo reverts it."""

from datetime import datetime, timezone

from supabase import Client

from .. import mastery
from . import classdata_repository as lessons
from . import clips_marks_repository as marks


def _stored(db: Client, student_id: str, term: dict) -> tuple[int, int]:
    row = lessons.mastery_rows(db, student_id, [term["lemma"]]).get(term["lemma"])
    if row is None:
        return mastery.initial_level(term["transparent"]), 0
    return row["level"], row["times_tapped"]


def _save(db: Client, student_id: str, lemma: str, level: int, times_tapped: int) -> None:
    now = datetime.now(timezone.utc).isoformat()
    lessons.upsert_mastery(db, student_id, lemma, level, times_tapped, now)


def level_of(db: Client, student_id: str, term: dict) -> int:
    return _stored(db, student_id, term)[0]


def after_mark(db: Client, student_id: str, session_id: str, term: dict) -> int:
    """Apply the session's single −1 for this lemma if not applied yet; return the current level."""
    level, taps = _stored(db, student_id, term)
    if marks.get_level_change(db, student_id, session_id, term["lemma"]) is not None:
        return level
    new_level = mastery.apply_tap(level)
    _save(db, student_id, term["lemma"], new_level, taps + 1)
    marks.insert_level_change(db, student_id, session_id, term["lemma"], new_level - level)
    return new_level


def after_unmark(db: Client, student_id: str, session_id: str, term: dict) -> int:
    """Revert the session's −1 once no mark of this lemma remains in the session; return the current level."""
    level, taps = _stored(db, student_id, term)
    if marks.lemma_marked_in_session(db, student_id, session_id, term["lemma"]):
        return level
    change = marks.get_level_change(db, student_id, session_id, term["lemma"])
    if change is None:
        return level
    new_level = mastery.revert_mark(level, change["level_delta"])
    _save(db, student_id, term["lemma"], new_level, max(0, taps - 1))
    marks.delete_level_change(db, student_id, session_id, term["lemma"])
    return new_level

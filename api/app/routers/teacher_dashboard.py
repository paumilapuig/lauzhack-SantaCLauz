"""Pure aggregation of a lesson's class data for the teacher Dashboard (docs/API.md › Dashboard)."""

from collections import Counter, defaultdict
from datetime import datetime

from .. import mastery

MAX_TOP_WORDS = 10
UNKNOWN_STUDENT = "Élève"


def lost_peaks(lost_events: list[dict]) -> list[dict]:
    """`lost` events bucketed per minute, most first (ties: earlier minute first)."""
    counts = Counter(int(event["t_sec"] // 60) for event in lost_events)
    return [{"minute": minute, "count": count}
            for minute, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))]


def unclear_peaks(clips: list[dict]) -> list[dict]:
    """«Je n'ai pas compris» clips bucketed per minute of their start (what she heard), most first."""
    counts = Counter(int(clip["t_start"] // 60) for clip in clips)
    return [{"minute": minute, "count": count}
            for minute, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))]


def top_words(marks: list[dict]) -> list[dict]:
    """Home marks of glossary words counted per lemma, most first, max 10."""
    counts = Counter(mark["lemma"] for mark in marks if mark["lemma"])
    ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:MAX_TOP_WORDS]
    return [{"lemma": lemma, "taps": taps} for lemma, taps in ranked]


def students(sessions: list[dict], word_states: list[dict], names: dict[str, str]) -> list[dict]:
    """Per student: autonomy of the latest finished session and weekly evolution; unfinished sessions skipped."""
    states_by_session: dict[str, list[str]] = defaultdict(list)
    for row in word_states:
        states_by_session[row["session_id"]].append(row["state"])
    finished: dict[str, list[tuple[datetime, float]]] = defaultdict(list)
    for session in sorted(sessions, key=lambda s: s["started_at"]):
        finished.setdefault(session["student_id"], [])
        if states_by_session[session["id"]]:
            started = datetime.fromisoformat(session["started_at"])
            finished[session["student_id"]].append((started, mastery.autonomy(states_by_session[session["id"]])))
    result = [
        {"name": names.get(student_id, UNKNOWN_STUDENT),
         "autonomy": autonomies[-1][1] if autonomies else None,
         "weekly": mastery.weekly_autonomy(autonomies)}
        for student_id, autonomies in finished.items()
    ]
    return sorted(result, key=lambda student: student["name"])


def concept_gaps(gaps: list[dict], names: dict[str, str]) -> list[dict]:
    """Concept gaps of the lesson, sorted by first minute (gaps without minutes last)."""
    shaped = [
        {"student": names.get(gap["student_id"], UNKNOWN_STUDENT), "concept": gap["concept"],
         "minutes": sorted(gap["minutes"]), "lemmas": gap["lemmas"], "status": gap["status"],
         "attempts": gap["attempts"]}
        for gap in gaps
    ]
    return sorted(shaped, key=lambda gap: (not gap["minutes"], gap["minutes"][:1], gap["concept"]))

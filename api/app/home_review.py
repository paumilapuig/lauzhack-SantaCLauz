"""Pure assembly of the /home review payload (no DB, no FastAPI)."""

import re
from collections.abc import Callable

from app import mastery as mastery_rules
from app.home_schemas import ConceptExerciseForStudent, ConceptGapForStudent, ReviewClip, WordToPractice
from app.term_matching import find_lemmas

SignAudio = Callable[[str, str], str | None]

SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?;])\s+")


def _lesson_ids_by_session(sessions: list[dict]) -> dict[str, str]:
    return {row["id"]: row["lesson_id"] for row in sessions}


def _terms_by_lesson(terms: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for term in terms:
        grouped.setdefault(term["lesson_id"], []).append(term)
    return grouped


def build_clips(
    clips: list[dict],
    passed_clip_ids: set[str],
    sessions: list[dict],
    lessons: list[dict],
    lesson_terms: list[dict],
    sign_audio: SignAudio,
) -> list[ReviewClip]:
    """Pending clips (input order kept) with title, matched terms and signed audio.

    Clips whose audio cannot be signed are left out.
    """
    lesson_by_session = _lesson_ids_by_session(sessions)
    titles = {row["id"]: row["title"] for row in lessons}
    terms = _terms_by_lesson(lesson_terms)
    review: list[ReviewClip] = []
    for clip in clips:
        if clip["id"] in passed_clip_ids:
            continue
        audio_url = sign_audio(clip["id"], clip["audio_path"])
        if audio_url is None:
            continue
        lesson_id = lesson_by_session.get(clip["session_id"])
        review.append(
            ReviewClip(
                id=clip["id"],
                lesson_title=titles.get(lesson_id, ""),
                created_at=clip["created_at"],
                t_start=clip["t_start"],
                t_end=clip["t_end"],
                transcript=clip["transcript"],
                audio_url=audio_url,
                terms=find_lemmas(clip["transcript"], terms.get(lesson_id, [])),
                kind="word",
                lemma=None,
            )
        )
    return review


def find_key_phrase(transcript: str, word: str) -> str:
    """First sentence containing the word (case-insensitive), else the whole transcript."""
    needle = word.lower()
    for sentence in SENTENCE_BOUNDARY.split(transcript):
        if needle in sentence.lower():
            return sentence.strip()
    return transcript.strip()


def _glossary_entry(mark: dict, lesson_terms: list[dict]) -> dict | None:
    if mark["lemma"] is None:
        return None
    return next((t for t in lesson_terms if t["lemma"] == mark["lemma"]), None)


def build_words(
    marks: list[dict],
    clips: list[dict],
    sessions: list[dict],
    lesson_terms: list[dict],
    mastery: dict[str, int],
) -> list[WordToPractice]:
    """One entry per mark on the student's clips (input order kept), skipping mastered words."""
    clip_by_id = {clip["id"]: clip for clip in clips}
    lesson_by_session = _lesson_ids_by_session(sessions)
    terms = _terms_by_lesson(lesson_terms)
    words: list[WordToPractice] = []
    for mark in marks:
        clip = clip_by_id.get(mark["clip_id"])
        if clip is None:
            continue
        term = _glossary_entry(mark, terms.get(lesson_by_session.get(clip["session_id"]), []))
        level = None
        if term is not None:
            level = mastery.get(term["lemma"], mastery_rules.initial_level(term["transparent"]))
            if level >= mastery_rules.GREEN_FROM_LEVEL:
                continue
        words.append(
            WordToPractice(
                word=mark["word"],
                lemma=term["lemma"] if term else None,
                translation_es=term["translation_es"] if term else None,
                definition_fr=term["definition_fr"] if term else None,
                key_phrase=find_key_phrase(clip["transcript"], mark["word"]),
                level=level,
                clip_id=clip["id"],
            )
        )
    return words


def build_concepts(gaps: list[dict], lessons_by_id: dict[str, str]) -> list[ConceptGapForStudent]:
    """Gaps (input order kept) with the lesson title; exercise answers are never copied."""
    return [
        ConceptGapForStudent(
            id=gap["id"],
            lesson_title=lessons_by_id.get(gap["lesson_id"], ""),
            concept=gap["concept"],
            lemmas=gap["lemmas"],
            explanation=gap["explanation"],
            exercises=[
                ConceptExerciseForStudent(question=e["question"], options=e["options"])
                for e in gap["exercises"]
            ],
            status=gap["status"],
        )
        for gap in gaps
    ]

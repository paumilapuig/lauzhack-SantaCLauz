"""Words tapped inside concept explanations, shaped as practice words for /home (pure, no I/O)."""

from app import mastery as mastery_rules
from app.home_schemas import WordToPractice


def build_concept_words(marks: list[dict], lesson_terms: list[dict], mastery: dict[str, int]) -> list[WordToPractice]:
    """One entry per concept_word_marks row (input order kept), skipping glossary words already at level >= 2."""
    terms = {(t["lesson_id"], t["lemma"]): t for t in lesson_terms}
    words: list[WordToPractice] = []
    for mark in marks:
        term = terms.get((mark["lesson_id"], mark["lemma"])) if mark["lemma"] else None
        level = None
        if term is not None:
            level = mastery.get(term["lemma"], mastery_rules.initial_level(term["transparent"]))
            if level >= mastery_rules.GREEN_FROM_LEVEL:
                continue
        words.append(WordToPractice(
            word=mark["word"],
            lemma=term["lemma"] if term else None,
            translation_es=term["translation_es"] if term else mark["translation_es"],
            definition_fr=term["definition_fr"] if term else None,
            key_phrase=mark["key_phrase"],
            level=level,
            clip_id=None,
        ))
    return words

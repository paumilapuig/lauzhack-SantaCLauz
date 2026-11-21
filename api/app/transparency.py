import unicodedata
from difflib import SequenceMatcher

SIMILARITY_THRESHOLD = 0.7


def norm(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text.lower())
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, norm(a), norm(b)).ratio()


def is_transparent(llm_flag: bool, lemma: str, translation_es: str) -> bool:
    return llm_flag and similarity(lemma, translation_es) >= SIMILARITY_THRESHOLD

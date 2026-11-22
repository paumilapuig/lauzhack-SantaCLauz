"""Spanish translation + simple French definition for words a student marked outside the glossary.

Called once per clip when the student presses Done (POST /api/clips/{id}/reviewed): one LLM call for all
of that clip's untranslated, non-glossary marks. Never raises: without a key or on any error nothing is stored.
"""

import json
import logging
from collections.abc import Callable

from supabase import Client

from app.config import Settings
from app.glossary.openrouter_client import call_openrouter

logger = logging.getLogger(__name__)

MAX_TRANSLATION_CHARS = 60
MAX_DEFINITION_CHARS = 160

Llm = Callable[..., tuple[str, dict]]

SYSTEM_PROMPT = (
    "You help a 14-year-old Spanish speaker (French level A1-A2) understand French words heard in class. "
    "For each word, as it is used in the sentence, give its Spanish translation (1-3 words) and a very simple "
    "French definition (at most 12 words). Answer only with JSON: "
    '{"words": [{"word": "...", "translation_es": "...", "definition_fr": "..."}]}'
)


def build_messages(words: list[str], transcript: str) -> list[dict]:
    user = f"Sentence: {transcript}\nWords: {json.dumps(words, ensure_ascii=False)}"
    return [{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user}]


def _text(value: object, limit: int) -> str | None:
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        return None
    return value.strip()


def parse_translations(content: str, asked: set[str]) -> dict[str, tuple[str, str]]:
    """word → (translation_es, definition_fr), only for asked words with both texts valid."""
    try:
        items = json.loads(content).get("words", [])
    except (ValueError, AttributeError):
        return {}
    result: dict[str, tuple[str, str]] = {}
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        word = str(item.get("word", "")).strip().lower()
        translation = _text(item.get("translation_es"), MAX_TRANSLATION_CHARS)
        definition = _text(item.get("definition_fr"), MAX_DEFINITION_CHARS)
        if word in asked and translation and definition:
            result[word] = (translation, definition)
    return result


def _pending_words(db: Client, clip_id: str, student_id: str) -> list[str]:
    marks = db.table("clip_marks").select("word, lemma, translation_es").eq("clip_id", clip_id).eq("student_id", student_id).execute().data
    return [m["word"] for m in marks if m["lemma"] is None and not m["translation_es"]]


def _transcript(db: Client, clip_id: str) -> str:
    rows = db.table("clips").select("transcript").eq("id", clip_id).execute().data
    return rows[0]["transcript"] if rows else ""


def translate_clip_marks(
    db: Client, clip_id: str, student_id: str, settings: Settings, llm: Llm = call_openrouter
) -> int:
    """Translate and store the clip's pending marks; return how many rows were updated."""
    if not settings.openrouter_api_key:
        return 0
    try:
        words = _pending_words(db, clip_id, student_id)
        if not words:
            return 0
        content, _usage = llm(build_messages(words, _transcript(db, clip_id)), settings.resolved_model(), settings.openrouter_api_key)
        translations = parse_translations(content, set(words))
        for word, (translation, definition) in translations.items():
            db.table("clip_marks").update({"translation_es": translation, "definition_fr": definition}).eq(
                "clip_id", clip_id
            ).eq("student_id", student_id).eq("word", word).execute()
        return len(translations)
    except Exception:  # Done must never fail because of the LLM
        logger.warning("mark translations failed clip=%s", clip_id, exc_info=True)
        return 0

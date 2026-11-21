"""Build the single LLM request that summarises what the teacher explained at each lost moment."""

from app.glossary.schema import GlossaryTerm
from app.lost_concepts.schema import LostContext

PROMPT_VERSION = "v1"
MAX_CONTEXTS = 20
MAX_TRANSCRIPT_CHARS = 1500

SYSTEM_PROMPT = """You help a 14-year-old Spanish-speaking newcomer with A1-A2 French.
She pressed "I got lost" during a live class. For each transcript fragment (the French
speech just before she pressed), say which concept the teacher was explaining.

Reply with strict JSON only (no prose, no markdown) shaped exactly like:
{"concepts": [{"event_id": str, "concept_fr": str, "explanation_es": str, "lemmas": [str, ...]}]}

Rules:
- Copy event_id verbatim from the fragment.
- concept_fr is one sentence in very simple French (A1-A2), at most about 20 words:
  the concept the teacher was explaining.
- explanation_es is 1 to 2 Spanish sentences for a 14-year-old girl. Add nothing that is
  not in the fragment.
- lemmas lists only glossary lemmas that appear in, or are key to, the fragment.
- If a fragment is noise or has no teaching content, omit its item or set concept_fr to "".
"""


def select_contexts(contexts: list[LostContext]) -> list[LostContext]:
    """Keep the most recent contexts, oldest first, each transcript cut to its last chars."""
    most_recent = sorted(contexts, key=lambda c: c.t_sec)[-MAX_CONTEXTS:]
    return [
        c.model_copy(update={"transcript": c.transcript[-MAX_TRANSCRIPT_CHARS:]})
        for c in most_recent
    ]


def _glossary_lines(glossary: list[GlossaryTerm]) -> str:
    return "\n".join(f"{term.lemma} — {term.translation_es}" for term in glossary)


def _fragment_blocks(contexts: list[LostContext]) -> str:
    return "\n\n".join(f"[{c.event_id}]\n{c.transcript}" for c in contexts)


def build_messages(contexts: list[LostContext], glossary: list[GlossaryTerm]) -> list[dict]:
    """Return chat messages listing the glossary and the selected transcript fragments."""
    user_text = (
        f"Glossary:\n{_glossary_lines(glossary)}\n\n"
        f"Fragments:\n{_fragment_blocks(select_contexts(contexts))}"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]

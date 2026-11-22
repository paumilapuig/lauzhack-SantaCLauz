"""Build the single after-class LLM request that turns a session's lost moments into concept gaps."""

from app.lost_concepts.diagram import MAX_NODES_PER_STEP, MAX_WORDS_PER_STEP
from app.lost_concepts.schema import (
    MAX_CONCEPTS,
    MAX_EXERCISES,
    MAX_OPTIONS,
    MAX_STEPS,
    MIN_EXERCISES,
    MIN_OPTIONS,
    PROMPT_MIN_STEPS,
    LostMoment,
)

PROMPT_VERSION = "v4"
MAX_CONTEXTS = 20
MAX_TRANSCRIPT_CHARS = 1500

SYSTEM_PROMPT = f"""You help a 14-year-old Spanish-speaking newcomer with A1-A2 French at school.
During a live class she pressed "I got lost" at some moments. Each numbered fragment is the
French speech just before one press. Find the concepts (ideas, not single words) she did not
follow, and prepare a short visual lesson for each one so she can learn it at home.

Reply with strict JSON only (no prose, no markdown) shaped exactly like:
{{"concepts": [{{"concept": str, "moments": [int], "lemmas": [str],
  "explanation": [{{"fr": str, "es": str,
    "nodes": [{{"id": str, "fr": str, "kind": "input"|"process"|"output"|"place", "inside": str|null}}],
    "links": [{{"from": str, "to": str, "fr": str|null}}],
    "words": [{{"fr": str, "es": str}}]}}],
  "exercises": [{{"question": str, "options": [str], "answer": int}}]}}]}}

Rules:
- At most {MAX_CONCEPTS} concepts. Group fragments about the same idea into one concept.
- concept: a short French label for the teacher, e.g. "Comment la cellule fabrique de l'énergie".
- moments: the numbers of the fragments this concept comes from, only numbers listed below.
- lemmas: only lemmas from the glossary below that appear in those fragments and are key to the concept.
- explanation: {PROMPT_MIN_STEPS} to {MAX_STEPS} steps that build the idea little by little, like a textbook
  process diagram explained box by box. fr is one short sentence in very simple French (A1-A2);
  es is the same sentence in simple Spanish.
  - nodes: the 1 to {MAX_NODES_PER_STEP} boxes this step adds to ONE shared diagram. id is a short lowercase id,
    unique in the concept. fr is a label of 1 to 4 words IN FRENCH (never Spanish). kind: "input" (what goes in, e.g. glucose,
    oxygène), "process" (what happens, e.g. la respiration cellulaire), "output" (what comes out, e.g. énergie,
    chaleur), "place" (where it happens, e.g. la mitochondrie). inside: the id of an earlier "place" box this
    box sits in, else null.
  - links: the arrows this step adds between boxes of this or earlier steps; fr is an optional 1-3 word French
    label (e.g. "entre dans", "produit").
  - words: the harder French words of this step (sentence, box and arrow labels) with their Spanish
    translation, at most {MAX_WORDS_PER_STEP}.
  - Do not use emoji anywhere.
- exercises: {MIN_EXERCISES} to {MAX_EXERCISES} multiple-choice questions in simple French that check she
  understood the idea (not vocabulary). {MIN_OPTIONS} to {MAX_OPTIONS} short options each, and EXACTLY ONE option
  must be true according to the fragments (every other option clearly false). answer is the 0-based index
  of the true option. Do not always put the true option first.
- Use only what the fragments say. If a fragment is noise or has no teaching content, ignore it.
"""


def select_moments(moments: list[LostMoment]) -> list[LostMoment]:
    """Keep the most recent moments, oldest first, each cut to the end of its transcript and renumbered."""
    most_recent = sorted(moments, key=lambda m: m.t_sec)[-MAX_CONTEXTS:]
    return [
        m.model_copy(update={"n": number, "transcript": m.transcript[-MAX_TRANSCRIPT_CHARS:]})
        for number, m in enumerate(most_recent, start=1)
    ]


def build_messages(moments: list[LostMoment], glossary_lemmas: list[str]) -> list[dict]:
    """Return chat messages with the glossary and the already-selected numbered fragments."""
    fragments = "\n\n".join(f"[{m.n}]\n{m.transcript}" for m in moments)
    user_text = f"Glossary lemmas:\n{', '.join(glossary_lemmas)}\n\nFragments:\n{fragments}"
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]

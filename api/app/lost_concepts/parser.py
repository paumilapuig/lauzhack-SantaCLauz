"""Parse the LLM reply into validated concept gaps, dropping anything unusable."""

import json
import re
from dataclasses import dataclass

from pydantic import ValidationError

from app.lost_concepts.errors import LostConceptsParseError
from app.lost_concepts.repair import decode_byte_tokens, repair_concept
from app.lost_concepts.schema import MAX_CONCEPTS, ConceptGap, LlmConcept

FENCE_PATTERN = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)
SECONDS_PER_MINUTE = 60


@dataclass(frozen=True)
class ParsedConceptGaps:
    gaps: list[ConceptGap]
    dropped: int


def _strip_fences(content: str) -> str:
    stripped = content.strip()
    match = FENCE_PATTERN.match(stripped)
    return match.group(1) if match else stripped


def _load_concepts(content: str) -> list:
    try:
        data = json.loads(decode_byte_tokens(_strip_fences(content)))
    except json.JSONDecodeError as error:
        raise LostConceptsParseError(f"LLM returned non-JSON content: {error}") from error
    if not isinstance(data, dict) or not isinstance(data.get("concepts"), list):
        raise LostConceptsParseError("LLM reply is not an object with a `concepts` list")
    return data["concepts"]


def _canonical_lemmas(lemmas: list[str], glossary_lemmas: list[str]) -> list[str]:
    canonical_by_key = {lemma.strip().lower(): lemma for lemma in glossary_lemmas}
    kept: list[str] = []
    for lemma in lemmas:
        canonical = canonical_by_key.get(str(lemma).strip().lower())
        if canonical is not None and canonical not in kept:
            kept.append(canonical)
    return kept


def _to_gap(raw: object, t_sec_by_n: dict[int, float], glossary_lemmas: list[str]) -> ConceptGap | None:
    if not isinstance(raw, dict):
        return None
    try:
        concept = LlmConcept.model_validate(repair_concept(raw, set(t_sec_by_n)))
    except ValidationError:
        return None
    minutes = sorted({int(t_sec_by_n[n] // SECONDS_PER_MINUTE) for n in concept.moments})
    return ConceptGap(
        concept=concept.concept,
        minutes=minutes,
        lemmas=_canonical_lemmas(concept.lemmas, glossary_lemmas),
        explanation=concept.explanation,
        exercises=concept.exercises,
    )


def parse_concept_gaps(content: str, t_sec_by_n: dict[int, float], glossary_lemmas: list[str]) -> ParsedConceptGaps:
    """Validate each concept on its own and keep at most MAX_CONCEPTS; fatal only if the reply is unreadable."""
    raw_concepts = _load_concepts(content)
    valid = [gap for raw in raw_concepts if (gap := _to_gap(raw, t_sec_by_n, glossary_lemmas)) is not None]
    gaps = valid[:MAX_CONCEPTS]
    return ParsedConceptGaps(gaps=gaps, dropped=len(raw_concepts) - len(gaps))

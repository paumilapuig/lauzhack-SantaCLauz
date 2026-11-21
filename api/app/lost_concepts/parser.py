"""Parse the LLM reply into validated lost concepts, dropping anything unusable."""

import json
import re
from dataclasses import dataclass

from pydantic import ValidationError

from app.lost_concepts.errors import LostConceptsParseError
from app.lost_concepts.schema import LostConcept

FENCE_PATTERN = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)


@dataclass(frozen=True)
class ParsedLostConcepts:
    concepts: list[LostConcept]
    dropped: int


def _strip_fences(content: str) -> str:
    stripped = content.strip()
    match = FENCE_PATTERN.match(stripped)
    return match.group(1) if match else stripped


def _load_object(content: str) -> dict:
    try:
        data = json.loads(_strip_fences(content))
    except json.JSONDecodeError as error:
        raise LostConceptsParseError(f"LLM returned non-JSON content: {error}") from error
    if not isinstance(data, dict):
        raise LostConceptsParseError("LLM reply is not a JSON object")
    if not isinstance(data.get("concepts"), list):
        raise LostConceptsParseError("LLM reply has no `concepts` list")
    return data


def _valid_items(raw_items: list, event_ids: set[str]) -> list[LostConcept]:
    valid = []
    for raw in raw_items:
        if not isinstance(raw, dict):
            continue
        try:
            concept = LostConcept.model_validate(raw)
        except ValidationError:
            continue
        if concept.event_id in event_ids:
            valid.append(concept)
    return valid


def _dedupe_by_event_id(concepts: list[LostConcept]) -> list[LostConcept]:
    seen: set[str] = set()
    unique = []
    for concept in concepts:
        if concept.event_id not in seen:
            seen.add(concept.event_id)
            unique.append(concept)
    return unique


def _canonical_lemmas(lemmas: list[str], glossary_lemmas: list[str]) -> list[str]:
    canonical_by_key = {lemma.strip().lower(): lemma for lemma in glossary_lemmas}
    kept: list[str] = []
    for lemma in lemmas:
        canonical = canonical_by_key.get(lemma.strip().lower())
        if canonical is not None and canonical not in kept:
            kept.append(canonical)
    return kept


def parse_lost_concepts(content: str, event_ids: set[str], glossary_lemmas: list[str]) -> ParsedLostConcepts:
    """Validate each concept on its own; fatal only if the reply is not a `concepts` object."""
    raw_items = _load_object(content)["concepts"]
    concepts = _dedupe_by_event_id(_valid_items(raw_items, event_ids))
    for concept in concepts:
        concept.lemmas = _canonical_lemmas(concept.lemmas, glossary_lemmas)
    return ParsedLostConcepts(concepts=concepts, dropped=len(raw_items) - len(concepts))

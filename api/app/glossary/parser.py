"""Parse the LLM reply into a validated glossary and apply the rule-based `transparent` flag."""

import json
import re
from dataclasses import dataclass

from pydantic import ValidationError

from app.glossary.schema import MAX_KEY_PHRASES, GlossaryResult, GlossaryTerm, KeyPhrase
from app.transparency import is_transparent

FENCE_PATTERN = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)


class GlossaryParseError(ValueError):
    pass


@dataclass(frozen=True)
class ParsedGlossary:
    result: GlossaryResult
    overrides: int
    dropped_terms: int


def _strip_fences(content: str) -> str:
    stripped = content.strip()
    match = FENCE_PATTERN.match(stripped)
    return match.group(1) if match else stripped


def _load_object(content: str) -> dict:
    try:
        data = json.loads(_strip_fences(content))
    except json.JSONDecodeError as error:
        raise GlossaryParseError(f"LLM returned non-JSON content: {error}") from error
    if not isinstance(data, dict):
        raise GlossaryParseError("LLM reply is not a JSON object")
    return data


def _valid_items(raw_items: list, model) -> tuple[list, int]:
    valid = []
    for raw in raw_items:
        try:
            valid.append(model.model_validate(raw))
        except ValidationError:
            continue
    return valid, len(raw_items) - len(valid)


def _parse_key_phrases(raw: object) -> list[KeyPhrase]:
    if not isinstance(raw, list):
        return []
    phrases, _ = _valid_items(raw, KeyPhrase)
    return phrases[:MAX_KEY_PHRASES]


def _dedupe_by_lemma(terms: list[GlossaryTerm]) -> list[GlossaryTerm]:
    seen: set[str] = set()
    unique = []
    for term in terms:
        if term.lemma not in seen:
            seen.add(term.lemma)
            unique.append(term)
    return unique


def _apply_transparency_rule(terms: list[GlossaryTerm]) -> int:
    overrides = 0
    for term in terms:
        rule_flag = is_transparent(term.transparent, term.lemma, term.translation_es)
        overrides += rule_flag != term.transparent
        term.transparent = rule_flag
    return overrides


def parse_glossary(content: str) -> ParsedGlossary:
    """Validate each term on its own, dropping invalid ones; fatal only if nothing usable remains."""
    data = _load_object(content)
    raw_terms = data.get("terms")
    if not isinstance(raw_terms, list):
        raise GlossaryParseError("LLM reply has no `terms` list")
    valid_terms, dropped = _valid_items(raw_terms, GlossaryTerm)
    terms = _dedupe_by_lemma(valid_terms)
    if not terms:
        raise GlossaryParseError("LLM reply contains no valid terms")
    overrides = _apply_transparency_rule(terms)
    result = GlossaryResult(terms=terms, key_phrases=_parse_key_phrases(data.get("key_phrases")))
    return ParsedGlossary(result=result, overrides=overrides, dropped_terms=dropped)

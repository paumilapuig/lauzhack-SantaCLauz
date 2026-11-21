"""Parse the LLM reply into a validated glossary and apply the rule-based `transparent` flag."""

import json
import re

from pydantic import ValidationError

from app.glossary.schema import GlossaryResult
from app.transparency import is_transparent

FENCE_PATTERN = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)


class GlossaryParseError(ValueError):
    pass


def _strip_fences(content: str) -> str:
    stripped = content.strip()
    match = FENCE_PATTERN.match(stripped)
    return match.group(1) if match else stripped


def _dedupe_by_lemma(result: GlossaryResult) -> None:
    seen: set[str] = set()
    unique = []
    for term in result.terms:
        if term.lemma not in seen:
            seen.add(term.lemma)
            unique.append(term)
    result.terms = unique


def parse_glossary(content: str) -> tuple[GlossaryResult, int]:
    """Return the glossary and how many LLM `transparent` flags the rule overrode."""
    try:
        result = GlossaryResult.model_validate(json.loads(_strip_fences(content)))
    except (json.JSONDecodeError, ValidationError) as error:
        raise GlossaryParseError(f"LLM returned invalid glossary: {error}") from error
    _dedupe_by_lemma(result)
    overrides = 0
    for term in result.terms:
        rule_flag = is_transparent(term.transparent, term.lemma, term.translation_es)
        overrides += rule_flag != term.transparent
        term.transparent = rule_flag
    return result, overrides

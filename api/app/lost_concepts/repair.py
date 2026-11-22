"""Fix the small, predictable mistakes LLMs make in a concept before it is validated.

Measured on Sun 22 Nov with the demo lesson: about 1 call in 4 lost a whole concept for a detail
(a moment number that does not exist, a `visual` a few characters too long, one bad exercise).
Here those details are repaired or dropped one by one, so the concept itself survives.
"""

import re

from pydantic import ValidationError

from app.lost_concepts.diagram import repair_diagram

from app.lost_concepts.schema import (
    MAX_EXERCISES,
    MAX_STEPS,
    MAX_VISUAL_CHARS,
    ConceptExercise,
    ConceptStep,
)


BYTE_TOKENS = re.compile(r"(?:<0x[0-9A-Fa-f]{2}>)+")


def _decode_run(match: re.Match) -> str:
    data = bytes(int(token[3:5], 16) for token in re.findall(r"<0x[0-9A-Fa-f]{2}>", match.group(0)))
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return ""


def decode_byte_tokens(text: str) -> str:
    """Some models write an emoji as its UTF-8 bytes, e.g. `<0xF0><0x9F><0xA7><0xAC>`: turn it back, or drop it."""
    return BYTE_TOKENS.sub(_decode_run, text)


def shorten_visual(visual: str, limit: int = MAX_VISUAL_CHARS) -> str:
    """Keep whole space-separated pieces while they fit; cut hard only if the first piece is too long."""
    visual = visual.strip()
    if len(visual) <= limit:
        return visual
    kept = ""
    for piece in visual.split():
        candidate = f"{kept} {piece}".strip()
        if len(candidate) > limit:
            break
        kept = candidate
    return kept or visual[:limit]


def _moments(raw: object, known: set[int]) -> list[int]:
    numbers = [n for n in raw if isinstance(n, int) and n in known] if isinstance(raw, list) else []
    return numbers or sorted(known)


def _valid_items(raw: object, model, limit: int) -> list[dict]:
    if not isinstance(raw, list):
        return []
    kept: list[dict] = []
    for item in raw:
        try:
            kept.append(model.model_validate(item).model_dump(by_alias=True))
        except ValidationError:
            continue
    return kept[:limit]


def _steps(raw: object) -> list[dict]:
    if not isinstance(raw, list):
        return []
    shortened = [
        {**step, "visual": shorten_visual(step["visual"])}
        if isinstance(step, dict) and isinstance(step.get("visual"), str) else step
        for step in raw
    ]
    return _valid_items(repair_diagram(shortened), ConceptStep, MAX_STEPS)


def repair_concept(raw: dict, known_moments: set[int]) -> dict:
    """Return a copy of `raw` with unknown moments, long visuals and invalid steps/exercises fixed or removed.

    Unknown moment numbers are dropped; if none is left, the concept is linked to every moment of the session.
    """
    return {
        **raw,
        "moments": _moments(raw.get("moments"), known_moments),
        "explanation": _steps(raw.get("explanation")),
        "exercises": _valid_items(raw.get("exercises"), ConceptExercise, MAX_EXERCISES),
    }

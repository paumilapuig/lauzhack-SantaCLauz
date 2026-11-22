"""Find which glossary lemmas appear in a French text (pure, no DB)."""

import re
from collections.abc import Iterable, Mapping

_ELISION = re.compile(r"\b([ld])'")


def _normalise(text: str) -> str:
    lowered = text.lower().replace("’", "'")
    return _ELISION.sub(r"\1 ", lowered)


def _candidates(term: Mapping) -> list[str]:
    raw = [*(term.get("forms") or []), term["lemma"]]
    return [form for form in map(_normalise, raw) if form.strip()]


def _longest_first(pairs: list[tuple[str, str]]) -> list[tuple[str, str]]:
    return sorted(pairs, key=lambda p: (-len(p[0].split()), -len(p[0])))


def _overlaps(span: tuple[int, int], taken: list[tuple[int, int]]) -> bool:
    return any(span[0] < end and start < span[1] for start, end in taken)


def find_lemmas(text: str, terms: Iterable[Mapping]) -> list[str]:
    """Lemmas whose lemma or forms occur in text, ordered by first position."""
    normalised = _normalise(text)
    pairs = [(form, t["lemma"]) for t in terms for form in _candidates(t)]
    taken: list[tuple[int, int]] = []
    first_position: dict[str, int] = {}
    for form, lemma in _longest_first(pairs):
        pattern = rf"(?<!\w){re.escape(form)}(?!\w)"
        for match in re.finditer(pattern, normalised):
            if _overlaps(match.span(), taken):
                continue
            taken.append(match.span())
            first_position[lemma] = min(
                match.start(), first_position.get(lemma, match.start())
            )
    return sorted(first_position, key=first_position.__getitem__)

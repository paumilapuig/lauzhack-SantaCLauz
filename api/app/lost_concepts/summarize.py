import logging
import time
from dataclasses import dataclass

import httpx

from app.glossary.openrouter_client import call_openrouter
from app.lost_concepts.errors import LostConceptsParseError
from app.lost_concepts.parser import ParsedConceptGaps, parse_concept_gaps
from app.lost_concepts.prompt import build_messages, select_moments
from app.lost_concepts.schema import ConceptGap, LostMoment

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 2  # one call; a second one only if the first reply gave no usable concept


@dataclass(frozen=True)
class Metrics:
    seconds: float
    prompt_tokens: int
    completion_tokens: int
    cost_usd: float
    dropped_items: int
    attempts: int = 1


NO_CALL = Metrics(0.0, 0, 0, 0.0, 0, 0)


def _attempt(messages: list[dict], t_sec_by_n: dict[int, float], lemmas: list[str], model: str, api_key: str,
             http: httpx.Client | None) -> tuple[ParsedConceptGaps | None, dict]:
    content, usage = call_openrouter(messages, model, api_key, http=http)
    try:
        return parse_concept_gaps(content, t_sec_by_n, lemmas), usage
    except LostConceptsParseError:
        return None, usage


def summarize_session(
    moments: list[LostMoment],
    glossary_lemmas: list[str],
    model: str,
    api_key: str,
    http: httpx.Client | None = None,
) -> tuple[list[ConceptGap], Metrics]:
    """One LLM call for all lost moments of a session (none if there are none, a 2nd only if the 1st is unusable).

    Raises LostConceptsParseError when both replies are unreadable.
    """
    if not moments:
        return [], NO_CALL
    started = time.monotonic()
    selected = select_moments(moments)
    messages = build_messages(selected, glossary_lemmas)
    t_sec_by_n = {m.n: m.t_sec for m in selected}
    parsed: ParsedConceptGaps | None = None
    tokens = [0, 0]
    cost = 0.0
    attempts = 0
    while attempts < MAX_ATTEMPTS and (parsed is None or not parsed.gaps):
        attempts += 1
        parsed, usage = _attempt(messages, t_sec_by_n, glossary_lemmas, model, api_key, http)
        tokens[0] += int(usage.get("prompt_tokens") or 0)
        tokens[1] += int(usage.get("completion_tokens") or 0)
        cost += float(usage.get("cost") or 0.0)
    if parsed is None:
        raise LostConceptsParseError("LLM reply unreadable after retry")
    metrics = Metrics(time.monotonic() - started, tokens[0], tokens[1], cost, parsed.dropped, attempts)
    logger.info(
        "concept gaps generated model=%s moments=%d gaps=%d dropped_items=%d attempts=%d seconds=%.2f "
        "prompt_tokens=%d completion_tokens=%d cost_usd=%.6f",
        model, len(selected), len(parsed.gaps), metrics.dropped_items, attempts, metrics.seconds,
        metrics.prompt_tokens, metrics.completion_tokens, metrics.cost_usd,
    )
    return parsed.gaps, metrics

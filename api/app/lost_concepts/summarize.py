import logging
import time
from dataclasses import dataclass

import httpx

from app.glossary.openrouter_client import call_openrouter
from app.lost_concepts.parser import parse_concept_gaps
from app.lost_concepts.prompt import build_messages, select_moments
from app.lost_concepts.schema import ConceptGap, LostMoment

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Metrics:
    seconds: float
    prompt_tokens: int
    completion_tokens: int
    cost_usd: float
    dropped_items: int


NO_CALL = Metrics(0.0, 0, 0, 0.0, 0)


def summarize_session(
    moments: list[LostMoment],
    glossary_lemmas: list[str],
    model: str,
    api_key: str,
    http: httpx.Client | None = None,
) -> tuple[list[ConceptGap], Metrics]:
    """Make exactly one LLM call for all lost moments of a session (none if there are none)."""
    if not moments:
        return [], NO_CALL
    started = time.monotonic()
    selected = select_moments(moments)
    content, usage = call_openrouter(build_messages(selected, glossary_lemmas), model, api_key, http=http)
    parsed = parse_concept_gaps(content, {m.n: m.t_sec for m in selected}, glossary_lemmas)
    metrics = Metrics(
        seconds=time.monotonic() - started,
        prompt_tokens=int(usage.get("prompt_tokens") or 0),
        completion_tokens=int(usage.get("completion_tokens") or 0),
        cost_usd=float(usage.get("cost") or 0.0),
        dropped_items=parsed.dropped,
    )
    logger.info(
        "concept gaps generated model=%s moments=%d gaps=%d dropped_items=%d seconds=%.2f "
        "prompt_tokens=%d completion_tokens=%d cost_usd=%.6f",
        model, len(selected), len(parsed.gaps), metrics.dropped_items, metrics.seconds,
        metrics.prompt_tokens, metrics.completion_tokens, metrics.cost_usd,
    )
    return parsed.gaps, metrics

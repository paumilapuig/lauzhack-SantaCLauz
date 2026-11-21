import logging
import time
from dataclasses import dataclass

import httpx

from app.glossary.openrouter_client import call_openrouter
from app.glossary.schema import GlossaryTerm
from app.lost_concepts.parser import parse_lost_concepts
from app.lost_concepts.prompt import build_messages, select_contexts
from app.lost_concepts.schema import LostConcept, LostContext

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Metrics:
    seconds: float
    prompt_tokens: int
    completion_tokens: int
    cost_usd: float
    dropped_items: int


def summarize_lost_contexts(
    contexts: list[LostContext],
    glossary: list[GlossaryTerm],
    model: str,
    api_key: str,
    http: httpx.Client | None = None,
) -> tuple[list[LostConcept], Metrics]:
    """Make exactly one LLM call for all lost moments and parse the concepts."""
    if not contexts:
        return [], Metrics(0, 0, 0, 0.0, 0)
    started = time.monotonic()
    selected = select_contexts(contexts)
    messages = build_messages(selected, glossary)
    content, usage = call_openrouter(messages, model, api_key, http=http)
    parsed = parse_lost_concepts(
        content,
        {c.event_id for c in selected},
        [term.lemma for term in glossary],
    )
    metrics = Metrics(
        seconds=time.monotonic() - started,
        prompt_tokens=int(usage.get("prompt_tokens") or 0),
        completion_tokens=int(usage.get("completion_tokens") or 0),
        cost_usd=float(usage.get("cost") or 0.0),
        dropped_items=parsed.dropped,
    )
    logger.info(
        "lost concepts summarized model=%s contexts=%d concepts=%d dropped_items=%d seconds=%.2f "
        "prompt_tokens=%d completion_tokens=%d cost_usd=%.6f",
        model, len(selected), len(parsed.concepts), metrics.dropped_items, metrics.seconds,
        metrics.prompt_tokens, metrics.completion_tokens, metrics.cost_usd,
    )
    return parsed.concepts, metrics

import logging
import time
from collections.abc import Sequence
from dataclasses import dataclass

import httpx

from app.glossary.openrouter_client import call_openrouter
from app.glossary.parser import parse_glossary
from app.glossary.prompt import build_messages
from app.glossary.schema import GlossaryResult

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Metrics:
    seconds: float
    prompt_tokens: int
    completion_tokens: int
    cost_usd: float
    overrides: int
    dropped_terms: int


def generate_glossary(
    source_text: str,
    jpeg_images: Sequence[bytes],
    model: str,
    api_key: str,
    http: httpx.Client | None = None,
) -> tuple[GlossaryResult, Metrics]:
    """Build the prompt, make exactly one LLM call and parse the glossary."""
    started = time.monotonic()
    messages = build_messages(source_text, jpeg_images)
    content, usage = call_openrouter(messages, model, api_key, http=http)
    parsed = parse_glossary(content)
    metrics = Metrics(
        seconds=time.monotonic() - started,
        prompt_tokens=int(usage.get("prompt_tokens") or 0),
        completion_tokens=int(usage.get("completion_tokens") or 0),
        cost_usd=float(usage.get("cost") or 0.0),
        overrides=parsed.overrides,
        dropped_terms=parsed.dropped_terms,
    )
    logger.info(
        "glossary generated model=%s seconds=%.2f prompt_tokens=%d completion_tokens=%d "
        "cost_usd=%.6f overrides=%d dropped_terms=%d",
        model, metrics.seconds, metrics.prompt_tokens, metrics.completion_tokens,
        metrics.cost_usd, metrics.overrides, metrics.dropped_terms,
    )
    return parsed.result, metrics

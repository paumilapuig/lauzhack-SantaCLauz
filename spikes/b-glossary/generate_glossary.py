"""One LLM call turns a lesson (text and/or images) into a validated glossary."""

import json
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import httpx
from pydantic import ValidationError

import cache
from glossary_schema import GlossaryResult
from openrouter_client import call_openrouter
from prompt import PROMPT_VERSION, build_messages
from transparency import is_transparent

DEFAULT_CACHE_DIR = Path(__file__).parent / "cache"
FENCE_PATTERN = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)


@dataclass
class Metrics:
    seconds: float
    prompt_tokens: int
    completion_tokens: int
    cost_usd: float
    cached: bool
    image_bytes_before: int
    image_bytes_after: int


def _strip_fences(content: str) -> str:
    stripped = content.strip()
    match = FENCE_PATTERN.match(stripped)
    return match.group(1) if match else stripped


def parse_glossary(content: str) -> GlossaryResult:
    """Parse the LLM reply and replace its `transparent` flags by the rule-based ones."""
    try:
        result = GlossaryResult.model_validate(json.loads(_strip_fences(content)))
    except (json.JSONDecodeError, ValidationError) as error:
        raise ValueError(f"LLM returned invalid glossary: {error}") from error
    for term in result.terms:
        term.transparent = is_transparent(term.transparent, term.lemma, term.translation_es)
    return result


def generate(
    source_text: str,
    image_paths,
    model: str,
    api_key: str,
    http: httpx.Client | None = None,
    cache_dir: Path = DEFAULT_CACHE_DIR,
    max_side: int = 1024,
) -> tuple[GlossaryResult, Metrics]:
    started = time.perf_counter()
    messages, prepared = build_messages(source_text, image_paths, max_side=max_side)
    image_bytes = [image.jpeg_bytes for image in prepared]
    sizes = {
        "image_bytes_before": sum(Path(path).stat().st_size for path in image_paths),
        "image_bytes_after": sum(len(data) for data in image_bytes),
    }
    key = cache.cache_key(model, PROMPT_VERSION, source_text, image_bytes)

    cached = cache.load(key, cache_dir)
    if cached is not None:
        metrics = Metrics(time.perf_counter() - started, 0, 0, 0, True, **sizes)
        return GlossaryResult.model_validate(cached), metrics

    content, usage = call_openrouter(messages, model, api_key, http=http)
    result = parse_glossary(content)
    metrics = Metrics(
        seconds=time.perf_counter() - started,
        prompt_tokens=usage.get("prompt_tokens", 0),
        completion_tokens=usage.get("completion_tokens", 0),
        cost_usd=usage.get("cost", 0),
        cached=False,
        **sizes,
    )
    cache.save(key, result.model_dump(), asdict(metrics), cache_dir)
    return result, metrics


def compare_with_reference(result: GlossaryResult, reference_terms: list[dict]) -> dict:
    """Compare lemmas and transparency flags with a hand-made reference glossary."""
    generated = {term.lemma: term.transparent for term in result.terms}
    reference = {term["lemma"].lower(): term["transparent"] for term in reference_terms}
    matched = [lemma for lemma in reference if lemma in generated]
    return {
        "matched": matched,
        "missing": [lemma for lemma in reference if lemma not in generated],
        "extra": [lemma for lemma in generated if lemma not in reference],
        "transparent_mismatches": [m for m in matched if generated[m] != reference[m]],
    }

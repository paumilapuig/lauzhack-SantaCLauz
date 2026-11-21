"""Compare models on the same lesson: coverage, transparency, cost, latency."""

import argparse
import json
import os
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path

import httpx

from generate_glossary import compare_with_reference, generate

DEFAULT_MODELS = (
    "google/gemini-2.5-flash-lite,openai/gpt-4.1-nano,"
    "meta-llama/llama-4-scout,qwen/qwen2.5-vl-72b-instruct"
)
OUT_DIR = Path(__file__).parent / "out"
REFERENCE_PATH = Path(__file__).parents[2] / "docs" / "demo" / "glossary-respiration.json"
HEADERS = ["model", "matched", "transparent mismatches", "LLM flag overrides",
           "cost USD", "seconds", "prompt tokens"]


@dataclass
class Row:
    model: str
    matched: int = 0
    reference_size: int = 0
    reference_transparent_mismatches: int = 0
    llm_flag_overrides: int = 0
    cost_usd: float = 0.0
    seconds: float = 0.0
    prompt_tokens: int = 0
    error: str | None = None


def _load_reference() -> list[dict]:
    return json.loads(REFERENCE_PATH.read_text(encoding="utf-8"))


def _run_model(model, source_text, image_paths, api_key, http, reference) -> Row:
    try:
        with tempfile.TemporaryDirectory() as fresh_cache:
            result, metrics = generate(
                source_text, image_paths, model, api_key, http=http, cache_dir=Path(fresh_cache)
            )
    except Exception as error:  # one bad model must not stop the comparison
        return Row(model=model, reference_size=len(reference), error=str(error))
    comparison = compare_with_reference(result, reference)
    return Row(
        model=model,
        matched=len(comparison["matched"]),
        reference_size=len(reference),
        reference_transparent_mismatches=len(comparison["reference_transparent_mismatches"]),
        llm_flag_overrides=metrics.llm_flag_overrides,
        cost_usd=metrics.cost_usd,
        seconds=metrics.seconds,
        prompt_tokens=metrics.prompt_tokens,
    )


def run_benchmark(
    models: list[str],
    source_text: str,
    image_paths,
    api_key: str,
    http: httpx.Client | None = None,
) -> list[Row]:
    """Call every model for real (fresh cache each time) and collect one row per model."""
    reference = _load_reference()
    return [_run_model(m, source_text, list(image_paths), api_key, http, reference) for m in models]


def _format_row(row: Row) -> str:
    if row.error:
        return f"| {row.model} | ERROR: {row.error.splitlines()[0]} | | | | | |"
    cells = [row.model, f"{row.matched}/{row.reference_size}", row.reference_transparent_mismatches,
             row.llm_flag_overrides, f"{row.cost_usd:.5f}", f"{row.seconds:.1f}", row.prompt_tokens]
    return "| " + " | ".join(str(cell) for cell in cells) + " |"


def format_table(rows: list[Row]) -> str:
    header = "| " + " | ".join(HEADERS) + " |"
    separator = "|" + "|".join("---" for _ in HEADERS) + "|"
    return "\n".join([header, separator, *(_format_row(row) for row in rows)])


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Benchmark glossary generation across models")
    parser.add_argument("--models", default=DEFAULT_MODELS, help="comma-separated OpenRouter models")
    parser.add_argument("--text", type=Path, help="file with the lesson text")
    parser.add_argument("--image", type=Path, action="append", default=[], help="lesson photo")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = _parse_args(argv)
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit("OPENROUTER_API_KEY is not set: export it (see api/.env.example)")
    source_text = args.text.read_text(encoding="utf-8") if args.text else ""
    models = [name.strip() for name in args.models.split(",") if name.strip()]

    table = format_table(run_benchmark(models, source_text, args.image, api_key))
    OUT_DIR.mkdir(exist_ok=True)
    path = OUT_DIR / f"benchmark-{time.strftime('%Y%m%d-%H%M%S')}.md"
    path.write_text(table + "\n", encoding="utf-8")
    print(table)
    print(f"written: {path}")


if __name__ == "__main__":
    main()

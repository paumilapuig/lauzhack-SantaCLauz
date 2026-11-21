"""Command line for the glossary spike: python cli.py --text lesson.txt --image page.jpg"""

import argparse
import json
import os
import time
from dataclasses import asdict
from pathlib import Path

from generate_glossary import compare_with_reference, generate

DEFAULT_MODEL = "google/gemini-2.5-flash-lite"
OUT_DIR = Path(__file__).parent / "out"
REFERENCE_PATH = Path(__file__).parents[2] / "docs" / "demo" / "glossary-respiration.json"


def _parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a lesson glossary with one LLM call")
    parser.add_argument("--text", type=Path, help="file with the lesson text")
    parser.add_argument("--image", type=Path, action="append", default=[], help="lesson photo")
    parser.add_argument("--max-side", type=int, default=1024, help="longest image side in px")
    return parser.parse_args(argv)


def _write_output(result, metrics, comparison) -> Path:
    OUT_DIR.mkdir(exist_ok=True)
    path = OUT_DIR / f"glossary-{time.strftime('%Y%m%d-%H%M%S')}.json"
    payload = {"glossary": result.model_dump(), "metrics": asdict(metrics), "comparison": comparison}
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def main(argv: list[str] | None = None) -> None:
    args = _parse_args(argv)
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit("OPENROUTER_API_KEY is not set: export it (see api/.env.example)")
    model = os.environ.get("OPENROUTER_MODEL", DEFAULT_MODEL)
    source_text = args.text.read_text(encoding="utf-8") if args.text else ""

    result, metrics = generate(source_text, args.image, model, api_key, max_side=args.max_side)
    reference = json.loads(REFERENCE_PATH.read_text(encoding="utf-8"))
    comparison = compare_with_reference(result, reference)
    path = _write_output(result, metrics, comparison)

    print(f"model={model} terms={len(result.terms)} matched={len(comparison['matched'])}/{len(reference)}")
    print(f"metrics: {asdict(metrics)}")
    print(f"written: {path}")


if __name__ == "__main__":
    main()

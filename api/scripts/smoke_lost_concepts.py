"""Manual drill for the concept gaps: one real LLM call on the demo lesson (costs money).

Usage (from api/):
    uv run python -m scripts.smoke_lost_concepts

Environment (set in the shell, never read from .env files by this script):
    OPENROUTER_API_KEY  OpenRouter key
    OPENROUTER_MODEL    optional, defaults to app.config.DEFAULT_OPENROUTER_MODEL
Splits the demo lesson text into 3 consecutive chunks, treats each as one "Me he perdido"
press (t_sec 60/120/180) and prints each concept gap (minutes, steps, exercises), seconds and
cost_usd. Nothing is stored.
"""

import json
import os
from pathlib import Path

from app.config import DEFAULT_OPENROUTER_MODEL
from app.lost_concepts.schema import ConceptGap, LostMoment
from app.lost_concepts.summarize import summarize_session

DEMO_DIR = Path(__file__).resolve().parents[2] / "docs" / "demo"
LESSON_TEXT = DEMO_DIR / "lesson-respiration.md"
GLOSSARY = DEMO_DIR / "glossary-respiration.json"
TEXT_HEADING = "## Texte à lire"
CHUNK_SIZES = (4, 4, 3)
SECONDS_BETWEEN_PRESSES = 60


def read_lesson_sentences(path: Path) -> list[str]:
    sentences: list[str] = []
    in_text = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            if in_text:
                break
            in_text = line.strip() == TEXT_HEADING
        elif in_text and line.strip():
            sentences.append(line.replace("**", "").strip())
    return sentences


def split_into_chunks(sentences: list[str], sizes: tuple[int, ...]) -> list[str]:
    chunks, start = [], 0
    for size in sizes:
        chunks.append(" ".join(sentences[start : start + size]))
        start += size
    return chunks


def build_moments(chunks: list[str]) -> list[LostMoment]:
    return [
        LostMoment(n=i, t_sec=i * SECONDS_BETWEEN_PRESSES, transcript=chunk)
        for i, chunk in enumerate(chunks, start=1)
    ]


def load_glossary_lemmas(path: Path) -> list[str]:
    return [item["lemma"] for item in json.loads(path.read_text(encoding="utf-8"))]


def print_gap(gap: ConceptGap) -> None:
    print(f"\n{gap.concept}  (minutes {gap.minutes}, lemmas: {', '.join(gap.lemmas) or '-'})")
    for number, step in enumerate(gap.explanation, start=1):
        print(f"  {number}. {step.visual}  {step.fr}  /  {step.es}")
    for exercise in gap.exercises:
        options = " | ".join(f"*{o}*" if i == exercise.answer else o for i, o in enumerate(exercise.options))
        print(f"  ? {exercise.question}  [{options}]")


def main() -> None:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit("Set OPENROUTER_API_KEY in the shell first")

    model = os.environ.get("OPENROUTER_MODEL") or DEFAULT_OPENROUTER_MODEL
    moments = build_moments(split_into_chunks(read_lesson_sentences(LESSON_TEXT), CHUNK_SIZES))
    gaps, metrics = summarize_session(moments, load_glossary_lemmas(GLOSSARY), model, api_key)

    for gap in gaps:
        print_gap(gap)
    print(f"\n{len(gaps)} concept gaps in {metrics.seconds:.1f}s, cost_usd={metrics.cost_usd}, dropped={metrics.dropped_items}")


if __name__ == "__main__":
    main()

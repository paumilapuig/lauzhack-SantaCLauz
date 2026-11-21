"""Manual drill for the lost-concepts summary: real LLM call on the demo lesson (costs money).

Usage (from api/):
    uv run python -m scripts.smoke_lost_concepts

Environment (set in the shell, never read from .env files by this script):
    OPENROUTER_API_KEY  OpenRouter key
Splits the demo lesson text into 3 consecutive chunks, treats each as one "Me he perdido"
press (t_sec 60/120/180) and prints the concepts, seconds and cost_usd.
"""

import json
import os
from pathlib import Path

from app.config import get_settings
from app.glossary.schema import GlossaryTerm
from app.lost_concepts.schema import LostContext
from app.lost_concepts.summarize import summarize_lost_contexts

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


def build_contexts(chunks: list[str]) -> list[LostContext]:
    return [
        LostContext(event_id=f"smoke-{i}", t_sec=i * SECONDS_BETWEEN_PRESSES, transcript=chunk)
        for i, chunk in enumerate(chunks, start=1)
    ]


def load_glossary(path: Path) -> list[GlossaryTerm]:
    return [GlossaryTerm.model_validate(item) for item in json.loads(path.read_text(encoding="utf-8"))]


def main() -> None:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit("Set OPENROUTER_API_KEY in the shell first")

    contexts = build_contexts(split_into_chunks(read_lesson_sentences(LESSON_TEXT), CHUNK_SIZES))
    concepts, metrics = summarize_lost_contexts(contexts, load_glossary(GLOSSARY), get_settings().resolved_model(), api_key)

    for concept in concepts:
        print(f"[{concept.event_id}] {concept.concept_fr}\n    {concept.explanation_es}\n    lemmas: {', '.join(concept.lemmas)}")
    print(f"{len(concepts)} concepts in {metrics.seconds:.1f}s, cost_usd={metrics.cost_usd}, dropped={metrics.dropped_items}")


if __name__ == "__main__":
    main()

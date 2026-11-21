"""On-disk cache of LLM glossary results, keyed by every input that affects the output."""

import hashlib
import json
from pathlib import Path


def cache_key(model: str, prompt_version: str, source_text: str, image_bytes: list[bytes]) -> str:
    digest = hashlib.sha256()
    parts = [model.encode(), prompt_version.encode(), source_text.encode(), *image_bytes]
    for part in parts:
        digest.update(len(part).to_bytes(8, "big"))
        digest.update(part)
    return digest.hexdigest()


def load(key: str, cache_dir: Path) -> dict | None:
    path = _entry_path(key, cache_dir)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))["result"]


def save(key: str, result_dict: dict, metrics_dict: dict, cache_dir: Path) -> None:
    cache_dir = Path(cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    entry = {"result": result_dict, "metrics": metrics_dict}
    _entry_path(key, cache_dir).write_text(json.dumps(entry, ensure_ascii=False), encoding="utf-8")


def _entry_path(key: str, cache_dir: Path) -> Path:
    return Path(cache_dir) / f"{key}.json"

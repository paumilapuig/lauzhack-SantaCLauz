import json
import sys
from pathlib import Path

import pytest

SPIKE_DIR = Path(__file__).parent
REFERENCE_PATH = SPIKE_DIR.parents[1] / "docs" / "demo" / "glossary-respiration.json"

sys.path.insert(0, str(SPIKE_DIR))


@pytest.fixture
def reference_terms() -> list[dict]:
    return json.loads(REFERENCE_PATH.read_text(encoding="utf-8"))

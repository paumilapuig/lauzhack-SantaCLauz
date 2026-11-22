"""Clean the process diagram the LLM attaches to a concept's steps (docs/API.md › Concept gaps › Diagram).

Each step adds a few boxes (`nodes`) and arrows (`links`) to one diagram, plus Spanish for its harder words.
Everything the client cannot draw safely is dropped here, one item at a time; the step itself is never lost.
"""

import re

MAX_NODES_PER_STEP = 3
MAX_NODES = 10
MAX_WORDS_PER_STEP = 8
MAX_NODE_CHARS = 40
MAX_LINK_CHARS = 30
MAX_WORD_CHARS = 40
MAX_GLOSS_CHARS = 60
MAX_ID_CHARS = 24
KINDS = frozenset({"input", "process", "output", "place"})
DEFAULT_KIND = "process"

_NOT_ID = re.compile(r"[^a-z0-9]+")


def node_id(raw: object) -> str:
    """Lowercase, runs of other characters become one `-`, trimmed, at most 24 characters."""
    return _NOT_ID.sub("-", str(raw).lower()).strip("-")[:MAX_ID_CHARS].strip("-")


def _text(value: object, limit: int) -> str | None:
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit:
        return None
    return value.strip()


def _node(raw: object, known: dict[str, str], places: set[str]) -> dict | None:
    if not isinstance(raw, dict):
        return None
    identifier, label = node_id(raw.get("id", "")), _text(raw.get("fr"), MAX_NODE_CHARS)
    if not identifier or label is None or identifier in known.values():
        return None
    kind = raw.get("kind") if raw.get("kind") in KINDS else DEFAULT_KIND
    inside = node_id(raw.get("inside")) if raw.get("inside") else None
    return {"id": identifier, "fr": label, "kind": kind, "inside": inside if inside in places else None}


def _link(raw: object, ids: set[str]) -> dict | None:
    if not isinstance(raw, dict):
        return None
    start, end = node_id(raw.get("from", "")), node_id(raw.get("to", ""))
    if start not in ids or end not in ids or start == end:
        return None
    return {"from": start, "to": end, "fr": _text(raw.get("fr"), MAX_LINK_CHARS)}


def _word(raw: object) -> dict | None:
    if not isinstance(raw, dict):
        return None
    french, spanish = _text(raw.get("fr"), MAX_WORD_CHARS), _text(raw.get("es"), MAX_GLOSS_CHARS)
    return {"fr": french, "es": spanish} if french and spanish else None


def _list(raw: object) -> list:
    return raw if isinstance(raw, list) else []


def repair_diagram(steps: list) -> list:
    """Return the steps with clean `nodes`, `links` and `words` lists (empty when missing or invalid)."""
    known: dict[str, str] = {}
    places: set[str] = set()
    seen_links: set[tuple[str, str]] = set()
    repaired = []
    for step in steps:
        if not isinstance(step, dict):
            repaired.append(step)
            continue
        nodes = []
        for raw in _list(step.get("nodes")):
            if len(nodes) == MAX_NODES_PER_STEP or len(known) == MAX_NODES:
                break
            node = _node(raw, known, places)
            if node is not None:
                known[str(raw.get("id"))] = node["id"]
                places |= {node["id"]} if node["kind"] == "place" else set()
                nodes.append(node)
        links = []
        for raw in _list(step.get("links")):
            link = _link(raw, set(known.values()))
            if link is not None and (link["from"], link["to"]) not in seen_links:
                seen_links.add((link["from"], link["to"]))
                links.append(link)
        words = [word for word in map(_word, _list(step.get("words"))) if word][:MAX_WORDS_PER_STEP]
        repaired.append({**step, "nodes": nodes, "links": links, "words": words})
    return repaired

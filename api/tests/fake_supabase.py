"""In-memory stand-in for the supabase-py 2.x query chain used by the class-data repositories."""
import uuid
from copy import deepcopy
from datetime import UTC, datetime
from types import SimpleNamespace

from tests.fake_storage import FakeStorage

_TABLES_WITH_TIMESTAMP = {
    "class_sessions": "started_at",
    "class_events": "created_at",
    "clips": "created_at",
}


def _now() -> str:
    return datetime.now(UTC).isoformat()


class _Query:
    def __init__(self, table_name: str, rows: list[dict]):
        self._table_name = table_name
        self._rows = rows
        self._mode = "select"
        self._columns: list[str] | None = None
        self._filters: list = []
        self._orders: list[tuple[str, bool, bool | None]] = []
        self._limit: int | None = None
        self._single = False
        self._payload: list[dict] = []
        self._conflict: list[str] = []
        self._update_payload: dict = {}

    def select(self, columns: str = "*"):
        self._mode = "select"
        self._columns = None if columns.strip() == "*" else [c.strip() for c in columns.split(",")]
        return self

    def eq(self, column: str, value):
        self._filters.append(lambda row: row.get(column) == value)
        return self

    def in_(self, column: str, values: list):
        self._filters.append(lambda row: row.get(column) in values)
        return self

    def order(self, column: str, desc: bool = False, nullsfirst: bool | None = None):
        self._orders.append((column, desc, nullsfirst))
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    def maybe_single(self):
        self._single = True
        return self

    def insert(self, payload):
        self._mode = "insert"
        self._payload = [payload] if isinstance(payload, dict) else list(payload)
        return self

    def upsert(self, payload, on_conflict: str):
        self._mode = "upsert"
        self._payload = [payload] if isinstance(payload, dict) else list(payload)
        self._conflict = [c.strip() for c in on_conflict.split(",")]
        return self

    def delete(self):
        self._mode = "delete"
        return self

    def update(self, payload: dict):
        self._mode = "update"
        self._update_payload = payload
        return self

    def execute(self):
        if self._mode == "update":
            return SimpleNamespace(data=self._update_matching())
        if self._mode == "delete":
            return SimpleNamespace(data=self._remove_matching())
        if self._mode == "insert":
            return SimpleNamespace(data=[self._store(row) for row in self._payload])
        if self._mode == "upsert":
            return SimpleNamespace(data=[self._merge(row) for row in self._payload])
        return self._read()

    def _remove_matching(self) -> list[dict]:
        removed = [r for r in self._rows if all(f(r) for f in self._filters)]
        self._rows[:] = [r for r in self._rows if r not in removed]
        return deepcopy(removed)

    def _update_matching(self) -> list[dict]:
        matching = [r for r in self._rows if all(f(r) for f in self._filters)]
        for row in matching:
            row.update(deepcopy(self._update_payload))
        return deepcopy(matching)

    def _store(self, row: dict) -> dict:
        stored = deepcopy(row)
        stored.setdefault("id", str(uuid.uuid4()))
        timestamp_column = _TABLES_WITH_TIMESTAMP.get(self._table_name)
        if timestamp_column:
            stored.setdefault(timestamp_column, _now())
        self._rows.append(stored)
        return deepcopy(stored)

    def _merge(self, row: dict) -> dict:
        for existing in self._rows:
            if all(existing.get(key) == row.get(key) for key in self._conflict):
                existing.update(deepcopy(row))
                return deepcopy(existing)
        stored = deepcopy(row)
        self._rows.append(stored)
        return deepcopy(stored)

    def _read(self):
        rows = [r for r in self._rows if all(f(r) for f in self._filters)]
        for column, desc, nullsfirst in reversed(self._orders):
            present = sorted((r for r in rows if r.get(column) is not None),
                             key=lambda r: r[column], reverse=desc)
            missing = [r for r in rows if r.get(column) is None]
            first = desc if nullsfirst is None else nullsfirst
            rows = missing + present if first else present + missing
        if self._limit is not None:
            rows = rows[: self._limit]
        if self._columns is not None:
            rows = [{c: r.get(c) for c in self._columns} for r in rows]
        rows = deepcopy(rows)
        if self._single:
            return SimpleNamespace(data=rows[0]) if rows else None
        return SimpleNamespace(data=rows)


class FakeSupabase:
    def __init__(self, tables: dict[str, list[dict]]):
        self.tables = tables
        self.storage = FakeStorage()

    def table(self, name: str) -> _Query:
        return _Query(name, self.tables[name])

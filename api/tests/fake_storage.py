"""In-memory stand-in for supabase-py `db.storage` (private buckets only, no public URLs)."""


class FakeStorageError(Exception):
    pass


class _FakeBucket:
    def __init__(self, objects: dict[str, dict]):
        self._objects = objects

    def upload(self, path: str, file: bytes, file_options: dict | None = None):
        options = file_options or {}
        if path in self._objects and options.get("upsert") != "true":
            raise FakeStorageError(f"Duplicate object: {path}")
        self._objects[path] = {"data": file, "content_type": options.get("content-type")}
        return {"path": path}

    def create_signed_url(self, path: str, expires_in: int) -> dict:
        if path not in self._objects:
            raise FakeStorageError(f"Object not found: {path}")
        return {"signedURL": f"https://fake.storage/clips/{path}?token=fake&expires={expires_in}"}

    def remove(self, paths: list[str]) -> list:
        for path in paths:
            self._objects.pop(path, None)
        return []


class FakeStorage:
    def __init__(self):
        self.objects: dict[str, dict[str, dict]] = {}

    def from_(self, bucket: str) -> _FakeBucket:
        return _FakeBucket(self.objects.setdefault(bucket, {}))

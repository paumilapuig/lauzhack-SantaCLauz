# Spec: api-lessons — `POST /api/lessons` (teacher uploads a lesson, ONE LLM call builds the glossary)

## Goal
A teacher posts a lesson (JSON text, or multipart txt/PDF/photo) and gets back `{lesson_id, terms}` saved in `lessons` + `lesson_terms`, from exactly one OpenRouter call.
Demo check: as prof-demo, `curl -F file=@respiration.pdf ... /api/lessons` returns 200 with ~15–30 terms (transparent flags set) and the rows appear in Supabase.

## Contract changes
- This branch: none. `POST /api/lessons` already exists in `docs/API.md` (JSON or multipart PDF/txt).
- T0 (separate branch `docs/api-lessons-images`, owner A, docs-only PR): in the `POST /api/lessons` row change `(PDF/txt)` to `(PDF/txt/png/jpg, max 10 MB)` and add errors line: `401 no token · 403 not teacher · 413 > 10 MB · 415 unsupported type · 422 empty input / unreadable PDF · 502 invalid LLM output · 503 LLM not configured`, plus note "LLM key phrases are not stored (F3 only)". Code here already accepts images; T0 only documents it.
- Not stored: the 5–8 key phrases returned by the LLM (no table; reserved for F3). Parsed, then discarded.

## Tasks
**T0 / API.md image + error codes** — Files: `docs/API.md` only (branch `docs/api-lessons-images`). Test first: n/a (docs). Depends: none. Size: ~5 lines.

**T1 / deps + config** — Files: `api/pyproject.toml`, `api/uv.lock`, `api/app/config.py`, `api/.env.example`, `api/tests/test_config.py`.
Add `pillow`, `pymupdf`, `httpx` (explicit; `python-multipart` already via `fastapi[standard]`); `uv lock && uv sync`. Settings: `openrouter_api_key: str|None=None`, `openrouter_model: str|None=None`; helper `resolved_model()` → `google/gemini-2.5-flash-lite` when None.
Test first: `test_config.py` asserts defaults are None and `resolved_model()` fallback/override. Depends: none. Size: ~40.

**T2 / require_teacher + schemas** — Files: `api/app/auth_roles.py`, `api/app/schemas.py`, `api/tests/test_auth_roles.py`.
`require_teacher(user: AuthenticatedUser) -> CurrentUser` uses `fetch_profile`; 403 if missing or role != teacher. `TeacherUser = Annotated[...]`. Schemas: `LessonTermInput`, `LessonTerm` (+id, lesson_id), `CreateLessonJson` (title, subject, lesson_date: date, source_text), `CreateLessonResponse`.
Test first: teacher passes; student → 403; no profile → 403 (monkeypatch `app.auth_roles.fetch_profile`). Depends: none. Size: ~70.

**T3 / glossary core port** — Files: `api/app/glossary/__init__.py`, `prompt.py`, `schema.py`, `parser.py`, `openrouter_client.py`, `api/tests/test_glossary_parser.py`, `api/tests/test_openrouter_client.py`.
Port from `git show feat/spike-b-pdf:spikes/b-glossary/<file>`; imports → `app.glossary.*`; parser uses `app.transparency.is_transparent`; drop cache.py; no temp files. Parser dedupes lemmas, raises `GlossaryParseError` on invalid JSON/shape. Client takes injectable `httpx.Client`; images passed as bytes → data URLs.
Test first: parser (valid, duplicate lemmas, malformed → error, transparency set); client with `httpx.MockTransport` asserts one POST, model + auth header, image parts. Depends: none. Size: ~150 (split prompt/schema verbatim copy if over).

**T4 / input extraction** — Files: `api/app/glossary/image_prep.py`, `api/app/glossary/pdf_input.py`, `api/app/glossary/upload.py`, `api/tests/test_pdf_input.py`, `api/tests/test_upload.py`.
`pdf_input.extract(bytes) -> (text, images)`: text if ≥200 chars else ≤5 pages rendered in memory; bad PDF → `InputError`. `upload.classify(filename, content_type) -> "text"|"pdf"|"image"` else `UnsupportedType`; `MAX_UPLOAD_BYTES = 10 MB` → `TooLarge`; empty → `InputError`.
Test first: PDFs built in-test with PyMuPDF (text PDF, near-empty PDF → images, garbage bytes → error); classify by suffix/content-type; size cap. Depends: T1. Size: ~140.

**T5 / generate orchestration** — Files: `api/app/glossary/generate.py`, `api/tests/test_generate.py`.
`generate_glossary(source_text, image_blobs, model, api_key, http=None) -> (GlossaryResult, Metrics)`: build prompt, ONE call, parse. Raises `LlmOutputError` on parse failure.
Test first: MockTransport returns valid/invalid JSON; assert exactly 1 request, result terms, error on invalid. Depends: T1, T3. Size: ~80.

**T6 / lessons_service** — Files: `api/app/lessons_service.py`, `api/tests/test_lessons_service.py`.
`create_lesson(user, meta, terms, db) -> CreateLessonResponse`: insert `lessons` with `teacher_id=user.id` explicitly, insert `lesson_terms` (dedupe lemma), on terms insert failure delete the lesson and re-raise.
Test first: fake Supabase client records inserts; asserts teacher_id, deduped lemmas, rollback delete on failure, response shape. Depends: T2. Size: ~90.

**T7 / router + endpoint** — Files: `api/app/routers/__init__.py`, `api/app/routers/lessons.py`, `api/app/main.py`, `api/tests/test_lessons_endpoint.py`.
Thin `APIRouter`: branch on `request.headers["content-type"]` (json → `CreateLessonJson`; multipart → `await request.form()`); 503 if `settings.openrouter_api_key` unset (request time); map errors 413/415/422/502; call `generate_glossary` then `create_lesson`. `include_router` in main.py.
Test first: overrides `get_current_user` + `require_teacher`; monkeypatch `generate_glossary`, `create_lesson`, settings. Cases: 401 no token, 403 student, 200 JSON, 200 multipart txt/pdf/png, 413, 415, 422 empty, 502, 503. Depends: T2, T4, T5, T6. Size: ~150.

**T8 / notes** — Files: `docs/STATUS.md` (own line + Requests: "A: add to PLAN Decisions: Pillow + PyMuPDF (AGPL, ok for hackathon) per a lessons/PDF/foto"). Test first: n/a. Depends: T7. Size: ~5.

## Parallel plan
- Wave 1: T1, T2, T3 (T0 in parallel on its own branch, owner A)
- Wave 2: T4, T5, T6
- Wave 3: T7, T8

## Manual verification (not in tests)
With `OPENROUTER_API_KEY` set, log in as prof-demo, POST the respiration PDF and a phone photo; check rows in `lessons`/`lesson_terms`, one OpenRouter request per call.

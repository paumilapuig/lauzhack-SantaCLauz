# Spec: api-lost-concepts / concept_gaps (owner B, branch `laurarebollocrespo/feat/api-lost-concepts`)

## Goal
After class, `app.lost_concepts.process_session(session_id)` turns the session's "Me he perdido" moments into at most 3 `concept_gaps` rows (concept, visual explanation in 3–5 steps, 2–3 exercises), using exactly 1 OpenRouter call per session.
Acceptance: `uv run pytest` is green. `uv run python -m scripts.smoke_lost_concepts` prints up to 3 concepts, each with minutes, steps (fr/es/visual) and exercises (options + answer), then the seconds and the cost.

## Contract changes
None from us. This follows the `concept_gaps` contract of PR #35, so `docs/API.md` is not touched. Miquel calls `process_session` in the background from `POST /api/sessions/{id}/word-states`.
Do not touch: `routers/*`, classdata*, clips*, `storage.py`, `roles.py`, `app/glossary/*`, `api/tests/fake_supabase.py`, `supabase/`, `web/`, `docs/API.md`. `errors.py` stays as it is. No new libraries.

## Numbering decision (applies to every task)
- The service builds `LostMoment`s from all qualifying events with a provisional `n` = 1..N, sorted by ascending `t_sec`.
- Inside `summarize_session`, `prompt.select_moments` keeps the 20 most recent moments (`MAX_CONTEXTS = 20`) and keeps the last `MAX_TRANSCRIPT_CHARS = 1500` chars of each transcript.
- `select_moments` then **renumbers** the kept moments `n = 1..k` in ascending `t_sec`, so `n` is always assigned after selection.
- The parser receives `{n: t_sec}` of the selected moments. It uses it to validate each `n` and to compute `minutes`.

## Tasks
**T1 / schema**
- Files: `api/app/lost_concepts/schema.py`, `api/app/lost_concepts/__init__.py`.
- Add these constants: `MAX_CONCEPTS=3`, `MIN_STEPS=3`, `MAX_STEPS=5`, `MIN_EXERCISES=2`, `MAX_EXERCISES=3`, `MIN_OPTIONS=2`, `MAX_OPTIONS=4`, `MAX_STEP_FR_CHARS=200`, `MAX_STEP_ES_CHARS=300`, `MAX_VISUAL_CHARS=40`.
- Add these models. All strings are stripped (`str_strip_whitespace`).
  - `LostMoment(n: int ge=1, t_sec: float ge=0, transcript: str)`
  - `ConceptStep(fr, es, visual)`: all non-empty, with max lengths from the constants.
  - `ConceptExercise(question non-empty, options: list[non-empty str] 2–4, answer: int)`, with a `model_validator` that enforces `0 <= answer < len(options)`.
  - `ConceptGap(concept non-empty, minutes: list[int], lemmas: list[str], explanation: list[ConceptStep] 3–5, exercises: list[ConceptExercise] 2–3)`.
- Keep `LostContext` and `LostConcept` for now: the old prompt and parser still import them. T4 deletes them.
- Reduce `__init__.py` to a one-line docstring with no imports, so the package can be imported while the other modules change.
- Test first: none of its own (only declarations). T3 covers the validators. Depends on: none. Size: ~60 lines.

**T2 / prompt (rewrite)**
- Files: `api/app/lost_concepts/prompt.py`, `api/tests/test_lost_concepts_prompt.py`.
- Keep `PROMPT_VERSION` (bump it to `"v2"`), `MAX_CONTEXTS` and `MAX_TRANSCRIPT_CHARS`.
- `select_moments(moments) -> list[LostMoment]`: keeps the 20 moments with the highest `t_sec`, sorts them ascending, keeps the end of each transcript (`[-MAX:]`) and renumbers `n` 1..k (`model_copy`).
- `build_messages(moments, glossary_lemmas: list[str]) -> list[dict]`: returns a system message and a user message. It expects already-selected moments. The user message lists the glossary lemmas, then each moment as `n` + transcript.
- `SYSTEM_PROMPT` asks for JSON only, in the shape `{"concepts":[{"concept","moments":[n],"lemmas","explanation":[{"fr","es","visual"}],"exercises":[{"question","options","answer"}]}]}`. It also states:
  - at most 3 concepts
  - French at A1–A2 level, simple Spanish
  - 3–5 steps and 2–3 exercises with 2–4 options; `answer` is a 0-based index
  - `visual` is a small emoji+arrow diagram of 40 chars or less, e.g. `🍞 + 💨 → 🔋`
  - lemmas come only from the glossary
- Test first:
  - The messages contain each `n`, its transcript and every lemma.
  - 25 moments (t_sec 0..24) → 20 kept, with `n` 1..20 ascending; the 5 oldest transcripts are absent.
  - A 3000-char transcript → 1500 chars kept: the end marker is in, the start marker is out.
- Depends on: T1. Size: ~120 lines.

**T3 / parser (rewrite)**
- Files: `api/app/lost_concepts/parser.py`, `api/tests/test_lost_concepts_parser.py`.
- Keep `FENCE_PATTERN`, `_strip_fences` and `_load_object`. Unreadable JSON, a non-object, or a `concepts` value that is not a list → `LostConceptsParseError`.
- `parse_concept_gaps(content, moments: dict[int, float], glossary_lemmas) -> ParsedConceptGaps`, a frozen dataclass of `concepts: list[ConceptGap]` and `dropped: int`.
- Per item, drop the **whole** concept when the item is not a dict, `moments` is empty or not a list of ints, any `n` is not in `moments`, or `ConceptGap.model_validate` raises `ValidationError`.
- `minutes` = `sorted({floor(t_sec/60)})` of the item's moments. The code computes it; the LLM never sends minutes.
- Lemmas: case-insensitive match after strip, written in the glossary's spelling, deduped, order kept.
- If more than 3 concepts are valid, keep the first 3 and count the rest in `dropped`.
- Test first:
  - A valid concept with moments at t_sec 65, 130 and 70 → `minutes == [1, 2]`.
  - A ```` ```json ```` fenced reply parses.
  - Each of these drops the concept: unknown n, 2 steps, 1 exercise, 5 options, answer out of range, a 41-char visual.
  - 4 valid concepts → the first 3.
  - Lemmas are filtered and deduped (e.g. `"OXYGÈNE "` → `"oxygène"`).
  - Unreadable JSON → `LostConceptsParseError`.
  - `dropped` counts are correct.
- Depends on: T1. Size: ~150 lines.

**T4 / summarize + schema cleanup**
- Files: `api/app/lost_concepts/summarize.py`, `api/tests/test_lost_concepts_summarize.py`, `api/app/lost_concepts/schema.py` (delete `LostContext` and `LostConcept` only).
- `Metrics` stays as it is.
- `summarize_session(moments, glossary_lemmas, model, api_key, http=None) -> tuple[list[ConceptGap], Metrics]`:
  - Empty `moments` → `([], Metrics(0,0,0,0.0,0))` with no call.
  - Otherwise: `select_moments` → `build_messages` → exactly ONE `call_openrouter` (imported from `app.glossary.openrouter_client`, never copied) → `parse_concept_gaps(content, {m.n: m.t_sec for m in selected}, glossary_lemmas)`.
  - One `logger.info` with model, moments, concepts, dropped, seconds, tokens and cost. Never log the key.
  - `OpenRouterError` and `LostConceptsParseError` propagate.
- Delete `summarize_lost_contexts`.
- Test first. Use `httpx.MockTransport` with USAGE `{"prompt_tokens":120,"completion_tokens":30,"cost":0.0004}`, and import from `app.lost_concepts.summarize`, not from the package.
  - 4 moments → exactly 1 HTTP request.
  - Empty → 0 requests and `[]`.
  - HTTP 500 → `OpenRouterError`.
  - Metrics tokens and cost come from usage.
  - caplog has exactly one INFO record, and the key is not in it.
- Depends on: T2, T3. Size: ~130 lines.

**T5 / smoke script**
- Files: `api/scripts/smoke_lost_concepts.py` (manual only, no test).
- Keep the env-key check and the text from `docs/demo/lesson-respiration.md` (3 chunks).
- Build 3 `LostMoment`s with n=1..3 and t_sec 60/120/180, take the lemmas from `docs/demo/glossary-respiration.json`, and call `summarize_session`.
- Print each concept with its minutes, steps (fr/es/visual) and exercises (options + answer), then the seconds and `cost_usd`.
- Depends on: T1 (it imports `summarize_session`, so run it after T4). Size: ~70 lines.

**T6 / service + exports**
- Files: `api/app/lost_concepts/service.py`, `api/tests/test_lost_concepts_service.py`, `api/app/lost_concepts/__init__.py`.
- Signature: `process_session(session_id, db=None, *, settings: Settings | None = None, http: httpx.Client | None = None) -> int`.
- Defaults: `db or get_supabase()`, `settings or get_settings()`. Model = `settings.resolved_model()`.
- Small helpers, one job each:
  - `_load_session`: reads `class_sessions` with `eq("id")` and `maybe_single`. Missing → warning, return 0.
  - `_load_moments`: reads `class_events` with `.eq("session_id").eq("type","lost")`, then keeps the rows with a non-empty `context_transcript` in Python (strip; skip `None`). Sorts by t_sec and sets n=1..N.
  - `_has_gaps`: reads `concept_gaps` with `eq("session_id")` and `limit(1)`.
  - `_load_lemmas`: reads `lesson_terms` with `eq("lesson_id")`.
  - `_insert_gaps`: one `insert` of a list of rows `{session_id, student_id, lesson_id, concept, minutes, lemmas, explanation, exercises (model_dump, answer included), status:"pending"}`.
- Order of checks:
  1. No moments → 0, no call.
  2. Gaps already exist → 0, no call.
  3. No key → warning, 0.
  4. Call `summarize_session`.
  5. No concepts → warning, 0.
  6. Insert the rows, return their count.
- `process_session` wraps everything in `except Exception` → `logger.warning` (no key in the message) and return 0. Reason: it runs as a background task, so it must never raise.
- `__init__.py` `__all__`: `process_session`, `summarize_session`, `ConceptGap`, `ConceptStep`, `ConceptExercise`, `LostMoment`, `LostConceptsParseError`.
- Test first. Use FakeSupabase seeded with `concept_gaps: []`, the MockTransport, and `Settings(_env_file=None, supabase_url="https://example.supabase.co", supabase_secret_key="x", openrouter_api_key="sk-test")`.
  - 2 lost events with text → 1 call, and N rows with `status "pending"` and the stored `answer`.
  - Only `""` / `None` lost events plus other event types → 0 calls, 0 rows.
  - Existing gaps for the session → 0 calls.
  - HTTP 500, and separately bad JSON → 0 rows and no exception.
  - No key → 0 calls and no exception.
  - Another session's lost transcript is not in the request body.
  - Missing session → 0.
- Depends on: T4. Size: ~150 lines (service ~90, test ~60+; split the test helpers if it gets close to the limit).

## Parallel plan
- **Wave 1:** T1.
- **Wave 2:** T2 and T3 in parallel (disjoint files).
- **Wave 3:** T4 and T5 in parallel (disjoint files). T5 is only run manually, after T4 is merged.
- **Wave 4:** T6.

Expected red tests between waves (no other test may fail):
- After Wave 1: only `test_lost_concepts_summarize.py` (it imports from the package `__init__`, which is now empty).
- After Wave 2: the same file, because the old `summarize.py` imports names that were removed.
- From Wave 3 on: the whole suite is green.

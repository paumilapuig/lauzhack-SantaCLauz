# Spec: api-practice-progress (owner B — Laura)

## Goal
Students can record a home-practice result (`POST /api/practice`, which levels up a word on success) and read encouraging Spanish progress messages (`GET /api/me/progress`) that never show percentages. Acceptance check: in `/docs`, a passed practice on a level-0 word returns `{"level":1,"leveled_up":true}`. After that, `/api/me/progress` returns "Esta semana has aprendido 1 palabra nueva" plus "Sigue así…", with no "%" and no "X de Y".

## Contract changes
None. The shapes are already in `docs/API.md` L82-83. Do not edit API.md.

## Tasks
Common rules: pytest with `api/tests/fake_supabase.py` only (do not change it). Pass `created_at` explicitly when seeding `practice_results` and `clip_marks`. Insert assertions must tolerate a missing `created_at`. Follow the `test_home_review.py` patterns. Only import from `app/mastery.py` (`initial_level`, `apply_practice`, `GREEN_FROM_LEVEL`).

**T1 — practice repository.** Files: `api/app/practice_repository.py`, `api/tests/test_practice_route.py` (repo section). Plain functions `(db: Client, ...)`:
`find_student_clip_lesson(db, student_id, clip_id) -> str | None` (clip with id and student_id via maybe_single, then `class_sessions.lesson_id`; None if the clip is missing or belongs to someone else);
`find_term_transparent(db, lemma, lesson_id: str | None) -> bool | None` (`lesson_terms` eq lemma, plus eq lesson_id when given, limit 1; None means unknown);
`fetch_level(db, student_id, lemma) -> int | None`; `insert_practice_result(db, student_id, lemma, clip_id, passed) -> None` (no created_at);
`upsert_level(db, student_id, lemma, level, now: datetime) -> None` (`on_conflict="student_id,lemma"`, `last_seen_at=now.isoformat()`).
Test first: each function against a seeded FakeSupabase (own clip returns its lesson, another student's clip returns None, lemma unknown in that lesson returns None, upsert overwrites). Depends on: none. Size: ~70 + ~70 test.

**T2 — progress messages (pure).** Files: `api/app/progress_messages.py`, `api/tests/test_progress_messages.py`. Fixed signature:
`@dataclass(frozen=True) class ProgressMessage: kind: str; text: str`
`build_progress_messages(passed: list[tuple[str, datetime]], mark_lemmas: list[str], levels: Mapping[str, int], now: datetime) -> list[ProgressMessage]`
`passed` is (lemma, created_at) for passed=true practices, newest first, tz-aware. `mark_lemmas` is the clip_marks lemmas, newest first. `levels` holds the current level per lemma, and a missing lemma counts as 0. Week start = Monday 00:00 UTC of `now`'s ISO week. The order and texts are exactly as in the request: learned_this_week, no_help_needed (newest passed lemma with level ≥ `GREEN_FROM_LEVEL`), keep_going (always; newest mark lemma with level < 2, else "Sigue así, vas muy bien").
Test first: 12 distinct lemmas give the "12 palabras nuevas" text; the same lemma 3 times gives "1 palabra nueva"; last week's practices are not counted; no_help_needed picks the newest passed lemma at level ≥ 2; keep_going picks the newest pending mark; no data gives only `[keep_going "Sigue así, vas muy bien"]`; across all cases, no text contains "%" or matches `\d+ de \d+`. Depends on: none. Size: ~60 + ~90 test.

**T3 — progress repository.** Files: `api/app/progress_repository.py`, `api/tests/test_progress_route.py` (repo section).
`fetch_passed_practices(db, student_id) -> list[tuple[str, datetime]]` (passed=true, `order("created_at", desc=True)`, parse ISO and accept a trailing "Z");
`fetch_mark_lemmas(db, student_id) -> list[str]` (clip_marks with non-null lemma, newest first);
`fetch_levels(db, student_id, lemmas: list[str]) -> dict[str, int]`. It uses `word_mastery` (`in_`, guard an empty list). For a lemma with no row it falls back to `initial_level(transparent)` from the first `lesson_terms` row for that lemma, and to 0 if the term is not found.
Test first: only the given student's rows come back, in newest-first order; null-lemma marks are excluded; the fallback returns 3 for a transparent term and 0 for an unknown one. Depends on: none. Size: ~70 + ~70 test.

**T4 — practice router.** Files: `api/app/routers/practice.py`, `api/app/practice_schemas.py`, `api/tests/test_practice_route.py` (route section).
`router = APIRouter(prefix="/api")` with `POST /practice` (StudentUser, SupabaseClient). Body `PracticeIn{lemma, clip_id: UUID | None, passed}`, response `PracticeOut{lemma, level, leveled_up}`.
Flow: if clip_id is set and the clip lesson is None, return 404 "Clip not found". If the transparent lookup is None, return 422 "Unknown lemma". Then insert the result. current = fetch_level, or `initial_level(transparent)` if there is no row. If passed, new = `apply_practice(current, True)` and upsert (with `now=datetime.now(UTC)`); otherwise new = current. `leveled_up = new > current`.
Tests use a local `FastAPI()` that includes `practice.router` (main.py is not wired yet):
- level 0 + pass gives 1 / true, with rows in practice_results and word_mastery=1;
- a transparent term with no row gives 3 / false;
- a fail keeps the level, gives false, and still writes a practice_results row;
- another student's clip gives 404; an unknown lemma gives 422; `clip_id: null` works;
- teacher gives 403; no token gives 401.
Depends on: T1. Size: ~60 + ~120 test.

**T5 — progress router.** Files: `api/app/routers/progress.py`, `api/app/progress_schemas.py`, `api/tests/test_progress_route.py` (route section).
`APIRouter(prefix="/api/me")` with `GET /progress` (StudentUser). It calls the T3 fetches, then `fetch_levels(passed lemmas ∪ mark lemmas)`, then `build_progress_messages(..., now=datetime.now(UTC))`, and maps the result to `ProgressOut{messages: [MessageOut{kind, text}]}`.
Test first (local `FastAPI()` app): teacher gives 403; no token gives 401; with two students seeded, the response reflects only the token student's data. Depends on: T2, T3. Size: ~45 + ~80 test.

**T6 — wire main.py.** Files: `api/app/main.py` (import plus `include_router` only), `api/tests/test_practice_route.py`, `api/tests/test_progress_route.py` (one smoke test each). Test first: `main.app` exposes `POST /api/practice` and `GET /api/me/progress`. The existing `/api/me` keeps working. Depends on: T4, T5. Size: ~4 + ~20 test.

## Parallel plan
- Wave 1 (parallel): T1, T2, T3. No shared files, and T2's signature is fixed above, so T3/T5 code against it.
- Wave 2 (parallel): T4 (needs T1), T5 (needs T2, T3). They touch different files.
- Wave 3: T6 (the only task that edits `api/app/main.py`).
Finish: `cd api && uv run pytest`, then update the B line in `docs/STATUS.md`, then `/ship`.

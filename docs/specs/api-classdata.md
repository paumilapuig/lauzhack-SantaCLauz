# Spec: api-classdata (owner A, branch `feat/api-classdata`)

## Goal
The 5 class-data endpoints of API.md (`GET /api/lessons`, `GET /api/lessons/{id}/class-pack`, `POST /api/sessions`, `POST /api/sessions/{id}/events`, `POST /api/sessions/{id}/word-states`) work exactly per contract, using `api/app/mastery.py`.
Acceptance: `cd api && uv run pytest` is green, with 200/401/403 cases per endpoint (GET /api/lessons: 200 for both roles and 401) plus 404/422 cases, and persistence is asserted on a fake Supabase client. Demo: /class loads the pack for lucia-w4 with chaleur and déchet shown in orange, and a tap returns the new level.

## Contract changes
None. `docs/API.md` is not modified. No DB migration, no new library, no remote Supabase operation.

## Decisions not in API.md
1. **Layout** (stays inside owner A's glob `api/app/routers/classdata*`): `classdata_schemas.py`, `classdata_repository.py` (lessons/terms/mastery), `classdata_session_repository.py` (sessions/events/states), and the routers `classdata.py` (lessons + class-pack), `classdata_sessions.py` (sessions + events), `classdata_word_states.py`. `api/app/roles.py` is new and shared (Laura and /teacher reuse it). Routers get the client through `Depends(get_supabase)`, so tests override it with the fake. Repositories take `client` as their first argument and receive ids as `str`.
2. **Roles**: `require_role(role)` depends on `get_current_user`, so a missing/invalid token gives 401 first. Then `fetch_profile(user.id)`. A missing profile or the wrong role gives `403 "Forbidden: <role> role required"`. "any" (GET /api/lessons) = a valid token only, with no profile lookup.
3. **Ids**: path/body ids are typed `UUID`, so a malformed id gives 422 (never a Postgres 500). Validation 422s keep FastAPI's default list `detail`. Our own 422/404s use a string `detail`.
4. **404**: unknown lesson → `"Lesson not found"`. Unknown session **or a session of another student** → `"Session not found"` (this hides whether it exists). Ownership = `class_sessions.student_id == user.id` (the secret key bypasses RLS, so this check is in code).
5. **GET /api/lessons** order: `lesson_date desc nulls last, created_at desc`. Fields: `id, title, subject, lesson_date`. `subject`, `lesson_date`, `translation_es`, `definition_fr` and `key_phrase` are nullable, as in the DB.
6. **Class-pack**: `terms` ordered by `lemma`. `mastery[lemma]` = the `word_mastery.level` row if one exists, else `initial_level(transparent)`. `previously_tapped` = sorted distinct lemmas of this lesson that have a `type='word'` event by this student in **any** session of any lesson (the pack is loaded before the class starts, so no session is excluded; a reload mid-class shows that class's taps as orange, which is accepted). A lesson with no terms gives `[]`, `{}`, `[]`. With an empty lemma list the repository skips the `in_` query.
7. **Events**: `type` ∈ {word, lost} (`unclear` is created only by /api/clips → 422). `t_sec >= 0`. `word` without a lemma → 422 (schema). `word` with a lemma that is not in the session's lesson → `422 "Unknown lemma for this lesson"`. Lemmas are matched exactly (no normalisation). `lost` + lemma → stored as null. `word` flow: old = existing level or `initial_level(transparent)` → new = `apply_tap(old)` → upsert `word_mastery` (`on_conflict "student_id,lemma"`, `times_tapped = old_taps+1` (0 if no row), `last_seen_at = now UTC ISO`) → insert the `class_events` row (`student_id` = user). Response `{ok: true, level: new | null}`. The read-modify-write is not atomic (one device per student), which is accepted.
8. **Word-states**: lemmas must be unique in the request and belong to the session's lesson, else 422. Upsert on `session_id,student_id,lemma` (a re-send overwrites, so it is idempotent). An empty list is valid and writes nothing. `autonomy = mastery.autonomy(all stored states of that session+student)`, which is 0.0 when there are none.

## Tasks
### T1 — schemas · **Files:** `api/app/routers/__init__.py` (empty), `api/app/routers/classdata_schemas.py`, `api/tests/test_classdata_schemas.py`
Models: `LessonSummary`, `LessonTerm`, `ClassPack`, `SessionCreate{lesson_id: UUID}`, `SessionCreated`, `ClassEventCreate` (validator: word needs a non-empty lemma; lost → lemma None), `ClassEventResult`, `WordState` Literal, `WordStateEntry`, `WordStatesSubmit` (validator: no duplicate lemmas), `WordStatesResult`.
- **Test first:** each validator rejects/normalises as in Decisions 7 and 8, `t_sec=-1` is rejected, `type="unclear"` is rejected, and a ClassPack dumps exactly the API.md keys. **Depends on:** none · **Size:** ~110

### T2 — role dependency · **Files:** `api/app/roles.py`, `api/tests/test_roles.py`
`require_role(role: Role)`, `StudentUser`, `TeacherUser` (Annotated aliases).
- **Test first:** a throwaway FastAPI app with one StudentUser route: no token → 401; teacher → 403; profile None → 403; student → 200. `app.roles.fetch_profile` is monkeypatched. **Depends on:** none · **Size:** ~70

### T3 — fake Supabase + seed data · **Files:** `api/tests/fake_supabase.py`, `api/tests/classdata_seed.py`, `api/tests/test_fake_supabase.py`
`FakeSupabase(tables)` with `table(name)` (unknown table → KeyError). The query chain mirrors supabase-py 2.x: `select(cols)` (projection), `eq`, `in_`, `order(col, desc=False, nullsfirst=False)` (chained, stable), `limit`, `maybe_single` (0 rows → `execute()` returns None), `insert(row|rows)` (fills `id`=uuid4, `started_at`/`created_at` defaults, returns the rows), `upsert(rows, on_conflict="a,b")` (updates in place on a key match), and `execute() → .data`. `seeded_fake()`: lesson L1 (2026-11-22) with terms mitochondrie (transparent), déchet, chaleur; older lesson L0; STUDENT mastery déchet level 1/taps 2; a STUDENT session on L0 with a word event on chaleur; an OTHER_STUDENT session on L1 with a word event on déchet. Fixed uuid constants.
- **Test first:** filters, order, maybe_single None, insert defaults, upsert updates in place without duplicating. **Depends on:** none · **Size:** ~150

### T4 — lessons repository · **Files:** `api/app/routers/classdata_repository.py`, `api/tests/test_classdata_repository.py`
`list_lessons`, `get_lesson`, `list_terms`, `mastery_rows(student, lemmas)->{lemma:{level,times_tapped}}`, `tapped_lemmas(student, lemmas)->set`, `upsert_mastery(student, lemma, level, times_tapped, last_seen_at)`.
- **Test first:** on `seeded_fake()`: order L1 then L0; the terms of L1; `tapped_lemmas(STUDENT, L1 lemmas) == {"chaleur"}` (OTHER_STUDENT's déchet is excluded); an upsert adds no duplicate row. **Depends on:** T3 · **Size:** ~130

### T5 — session repository · **Files:** `api/app/routers/classdata_session_repository.py`, `api/tests/test_classdata_session_repository.py`
`insert_session(lesson, student)->id`, `get_owned_session(session, student)->dict|None`, `insert_event(...)`, `upsert_word_states(session, student, entries)`, `session_states(session, student)->list[str]`.
- **Test first:** a foreign session → None; an inserted event/session is stored with student_id; a word-states re-send keeps the row count. **Depends on:** T3 · **Size:** ~120

### T6 — router: lessons + class-pack · **Files:** `api/app/routers/classdata.py`, `api/tests/test_classdata_lessons.py`
- **Test first** (local `FastAPI()` + `include_router`, override `get_supabase`/`get_current_user`): GET lessons 200 (exact list, teacher too) / 401. Class-pack 200 for STUDENT on L1: `mastery {mitochondrie:3, déchet:1, chaleur:0}`, `previously_tapped ["chaleur"]`; 401; 403 teacher; 404 unknown; 422 malformed id. **Depends on:** T1, T2, T4 · **Size:** ~140

### T7 — router: sessions + events · **Files:** `api/app/routers/classdata_sessions.py`, `api/tests/test_classdata_sessions.py`
- **Test first:** POST sessions 200 + stored row / 401 / 403 / 404 unknown lesson / 422 bad uuid. Events: déchet → level 0, taps 3; mitochondrie (no row) → 2, taps 1; lost+lemma → stored null, level null; 401/403; 404 for unknown and foreign sessions; 422 for unknown lemma, word without lemma, and unclear. **Depends on:** T1, T2, T4, T5 · **Size:** ~150

### T8 — router: word-states · **Files:** `api/app/routers/classdata_word_states.py`, `api/tests/test_classdata_word_states.py`
- **Test first:** 2 green + 1 yellow → autonomy 2/3 and 3 rows stored; a re-send keeps 3 rows; empty → 0.0; 422 for a duplicate or unknown lemma; 404 foreign; 401; 403. **Depends on:** T1, T2, T4, T5 · **Size:** ~120

### T9 — wiring + status · **Files:** `api/app/main.py` (+3 `include_router`), `api/tests/test_classdata_routes.py`, `docs/STATUS.md`
- **Test first:** on `main.app` without a token, each of the 5 paths → 401 (not 404/405). STATUS: Miquel line, plus a note to Laura: new files in `api/tests/`, reuse `app.roles` and `classdata_schemas.LessonTerm`. **Depends on:** T6, T7, T8 · **Size:** ~40

## Parallel plan
- **Wave 1:** T1, T2, T3 · **Wave 2:** T4, T5 · **Wave 3:** T6, T7, T8 · **Wave 4:** T9, then the full `uv run pytest`.
- Optional manual check ONLY if `api/.env` points to 127.0.0.1 (local stack + seed): curl the class-pack as lucia-w4. Never against the shared project.

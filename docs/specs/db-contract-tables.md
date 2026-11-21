# Spec: db-contract-tables (owner A, branch `feat/db-contract-tables`)

## Goal
One migration creates every table/column of `docs/API.md` with RLS + grants + private bucket `clips`, and `GET /api/me` returns `{id, email, display_name, role}`.
Acceptance: `uv run pytest` and `npx supabase test db` (LOCAL stack) pass; after the user runs `npx supabase db push`, `/dashboard` still shows `GET /api/me → 200` and the response contains `role`.

## Contract changes
None. `docs/API.md` already lists these tables and the `/api/me` shape. Interpretations fixed here (not contract changes):
- The browser only reads; all writes to student tables go through the API (service_role). So student-table RLS is SELECT-only and `authenticated` gets `select` only on them. Nobody can forge their own `level`/`role`.
- `profiles.role` cannot be changed by its owner: revoke table-level `update` from `authenticated`, then `grant update (display_name, l1, level)`.
- Extra FKs: `word_states_log.session_id → class_sessions`, `.student_id → profiles`. Session children `on delete cascade`; `practice_results.clip_id` `on delete set null`; every `student_id`/`teacher_id → profiles on delete cascade`.

## Tasks
### T1 — Migration part 1: profiles, helpers, lessons, lesson_terms, word_mastery, practice_results
- **Files:** `supabase/migrations/20261121180000_contract_tables.sql` (create), `supabase/tests/database/01_profiles_lessons.test.sql` (create)
- **Test first (pgTAP):** `has_column` for profiles.role/l1/level; `col_default_is` role='student', l1='es', level='A1'; `has_table` + RLS enabled (`select relrowsecurity from pg_class`) for lessons, lesson_terms, word_mastery, practice_results; `ok(not has_column_privilege('authenticated','public.profiles','role','UPDATE'))` and `ok(has_column_privilege('authenticated','public.profiles','level','UPDATE'))`; `throws_ok` inserting `level=4` into word_mastery; `throws_ok` duplicate (lesson_id, lemma). Wrap in `begin; select plan(n); ... select * from finish(); rollback;`.
- **SQL to write** (conventions of `20261120190000_profiles.sql`: header comment, `if not exists`, policies "<table>: <what>", `(select auth.uid())`):
  - `alter table public.profiles add column if not exists` role text not null default 'student' check in ('student','teacher'), l1 text not null default 'es', level text not null default 'A1' check in ('A1','A2','B1'). `handle_new_user()` unchanged.
  - `public.is_teacher() returns boolean` — `language sql stable security definer set search_path = ''`, `exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'teacher')` (avoids RLS recursion). Revoke execute from public; grant to authenticated, service_role.
  - Policy "profiles: teachers read all" select using `(select public.is_teacher())`.
  - lessons (id uuid pk default gen_random_uuid(), teacher_id not null, title text not null, subject, lesson_date date, source_text, created_at not null default now()). Policies: "all authenticated read" (`using (true)`); "teacher inserts own" with check `teacher_id = (select auth.uid()) and (select public.is_teacher())`; "teacher updates own" using/check `teacher_id = (select auth.uid())`.
  - lesson_terms per API.md (forms text[] not null, transparent bool not null, unique(lesson_id, lemma)). Policies: "all authenticated read"; "lesson teacher writes" for all, using/check `exists(select 1 from public.lessons l where l.id = lesson_id and l.teacher_id = (select auth.uid()))`.
  - word_mastery (pk (student_id, lemma), level int not null check 0–3, times_tapped int not null default 0, last_seen_at timestamptz). practice_results (clip_id uuid null; FK to clips added in T2 via `alter table ... add constraint`). Policy each: "student reads own" `student_id = (select auth.uid())`.
  - Grants: `revoke update on public.profiles from authenticated; grant update (display_name, l1, level) on public.profiles to authenticated;` select to authenticated on all 4 new tables; insert, update on lessons + insert, update, delete on lesson_terms to authenticated; `grant all` on each to service_role.
- **Depends on:** none · **Size:** ~130 lines

### T2 — Migration part 2: class_sessions, class_events, clips, word_states_log, storage
- **Files:** `supabase/migrations/20261121180000_contract_tables.sql` (append), `supabase/tests/database/02_class_data.test.sql` (create)
- **Test first (pgTAP):** tables exist with RLS enabled; `throws_ok` class_events type='other' and word_states_log state='red'; `has_pk` word_states_log on (session_id, student_id, lemma); `fk_ok` practice_results.clip_id → clips.id; `ok(exists(select 1 from storage.buckets where id='clips' and public = false))`; `policies_are('storage','objects', ...)` includes "clips: student reads own folder".
- **SQL to write:**
  - Tables exactly as API.md (ids default gen_random_uuid(), created_at/started_at not null default now(), class_events.lemma null). Indexes: class_sessions(lesson_id), class_sessions(student_id), class_events(session_id), clips(student_id), practice_results(student_id).
  - `public.is_session_teacher(p_session_id uuid) returns boolean` security definer stable, search_path '': session → lesson → `teacher_id = (select auth.uid())`. Same execute grants as is_teacher.
  - Policies, select only: "student reads own" (`student_id = (select auth.uid())`) on all 4; "lesson teacher reads" on class_sessions (via lessons.teacher_id) and on class_events, clips, word_states_log (`(select public.is_session_teacher(session_id))`).
  - `alter table public.practice_results add constraint practice_results_clip_id_fkey foreign key (clip_id) references public.clips(id) on delete set null`.
  - Grants: select to authenticated, all to service_role, on the 4 tables.
  - Storage: `insert into storage.buckets (id, name, public) values ('clips','clips',false) on conflict (id) do nothing;` policy "clips: student reads own folder" on storage.objects for select to authenticated using `bucket_id = 'clips' and (storage.foldername(name))[1] = (select auth.uid())::text`. No insert policy (uploads via API, service_role).
- **Depends on:** T1 · **Size:** ~140 lines (whole migration file must stay < 300)

### T3 — `GET /api/me` returns display_name + role
- **Files:** `api/app/profiles.py` (create), `api/app/schemas.py`, `api/app/main.py`, `api/tests/test_me.py` (create)
- **Test first (pytest, `api/tests/test_me.py`):** override `app.dependency_overrides[get_current_user]` with a fixed `CurrentUser`; monkeypatch `app.main.fetch_profile`. Assert (1) 200 and JSON == `{"id","email","display_name":"lucia-w1","role":"student"}`; (2) `fetch_profile` called with the user id; (3) lookup returns None → 404 `{"detail":"Profile not found"}`. Clear overrides in a fixture teardown.
- **Code:** `schemas.py`: `Role = Literal["student","teacher"]`; `Profile(display_name: str | None, role: Role)`; `Me` adds `display_name: str | None`, `role: Role`. `profiles.py`: `fetch_profile(user_id: str) -> Profile | None` = `get_supabase().table("profiles").select("display_name, role").eq("id", user_id).maybe_single().execute()` (handle `None` response). `main.py`: `read_me` calls `fetch_profile`, 404 if None. Existing tests in `test_main.py` must still pass.
- **Depends on:** none (works against the DB only after push; tests are mocked) · **Size:** ~70 lines

### T4 — web `Me` type + fixture (owner C area, minimal)
- **Files:** `web/lib/api.ts`, `web/lib/api.test.ts`, `docs/STATUS.md`
- **Test first (Vitest):** in `api.test.ts` the first fixture returns `{ id:"u1", email:"a@b.c", display_name:"lucia-w1", role:"student" }` and `expect(me).toEqual(...)` the same object. Run `cd web && npm run test && npm run lint && npm run build`.
- **Code:** `export type Role = "student" | "teacher"; export type Me = { id: string; email: string; display_name: string | null; role: Role };`. No UI change. STATUS: Miquel line + note "A touched web/lib/api.ts (Me type) for Paula".
- **Depends on:** none · **Size:** ~10 lines

## Verification of the migration (never against the shared project)
- If Docker runs: `npx supabase start` then `npx supabase test db` (local stack only). Do NOT run `db push`, `db reset`, or any `--linked` command.
- No Docker: reviewer checks statically: every table has RLS + policies + grants; no table-level `update` on profiles for authenticated; file < 300 lines.

## Parallel plan
- **Wave 1:** T1, T3, T4 (no shared files)
- **Wave 2:** T2

## Hand-off to the user (not a coder task)
Run yourself: `npx supabase db push` then `npx supabase gen types typescript --linked > web/lib/database.types.ts`, and commit the regenerated types.

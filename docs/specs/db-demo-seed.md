# Spec: db-demo-seed (owner A, branch `feat/db-demo-seed`)

## Goal
`supabase/seed.sql` is a single idempotent, pure-SQL script that loads the demo data of API.md "Demo seed" into a LOCAL db. pgTAP proves its contents and exact counts.
Acceptance: run the seed twice against the local stack, then `npx supabase test db` passes 01, 02 and 03. A local login as `lucia-w4@demo.lauzhack` gives a class-pack with `previously_tapped ⊇ [chaleur]`, and on the dashboard w4 goes 0.53 → 0.62 → 0.71 → 0.80.

## Contract changes
None. `docs/API.md` and `supabase/config.toml` are not modified. The interpretations below are fixed by this spec.

## Decisions not in API.md
1. **Fixed ids** (hex `de` prefix): users `de000000-0000-4000-8000-0000000000{01 prof-demo,02 lucia-w1,03 lucia-w4}` (auth.identities.id = user id). Lesson `de100000-0000-4000-8000-000000000001`. Terms `de200000-…-0000000000{01..15}` in JSON order. Sessions `de300000-…-0000000000{01 w1 this week, 11/12/13/14 w4 −3w/−2w/−1w/this week}`. Events `de400000-…-{01..14}`. Practice `de500000-…-{01..12}`.
2. **Idempotency**: `on conflict … do nothing` on every insert. Users: `insert … select … where not exists (email)` + `on conflict (id) do nothing`. Profiles: only `update profiles set role='teacher'` for prof-demo, because the trigger `handle_new_user` creates them (display_name stays the email prefix, as on remote). Child rows use the fixed ids, so an existing user with another id fails loudly on an FK. That is fine: the seed is local-only, after a reset.
3. **seed.sql is pure SQL** (the CLI applies seed files without psql, so no `\i`/`\ir`). It is one file of ≤ 300 lines. `supabase test db` mounts only `supabase/tests`, so the test cannot include the seed either. The test asserts the **already-seeded** local DB with EXACT counts, and the idempotency proof is: apply the seed twice, then run the test.
4. **Auth (local only)**: password `demo-local-only`, written in the seed.sql header and README ("real password in the private chat; the seed never runs on the shared project"). `auth.users`: instance_id `00000000-0000-0000-0000-000000000000`, aud/role `authenticated`, `encrypted_password = extensions.crypt(pw, extensions.gen_salt('bf'))` (check the pgcrypto schema with `\dx` locally), `email_confirmed_at = now()`, `raw_app_meta_data {"provider":"email","providers":["email"]}`, `raw_user_meta_data {}`. Set `confirmation_token, recovery_token, email_change_token_new, email_change` (and any other token column that is NOT NULL-safe in local `\d auth.users`) to `''`. `auth.identities`: provider `email`, `provider_id = id::text`, `identity_data {sub,email,email_verified:true}`, `on conflict (provider_id, provider) do nothing`; do not insert the generated `email` column.
5. **Lesson**: 'La respiration cellulaire', subject 'Biologie', `lesson_date = current_date`, teacher prof-demo, `source_text` null. The 15 terms are SQL literals copied verbatim from `docs/demo/glossary-respiration.json`. **All sessions are on this lesson**, so the per-lesson dashboard sees them.
6. **Time relative to now()**: this-week time = `greatest(date_trunc('week', now()), now() - interval '2 hours')`. k weeks ago = `date_trunc('week', now()) - k * interval '1 week' + interval '2 days 9 hours'`.
7. **word_states_log** (set-based insert from lesson_terms × a VALUES list; green = transparent or in the list; otherwise yellow):
   | session | absent lemmas | extra green (non-transparent) | orange | autonomy |
   |---|---|---|---|---|
   | w1 01 | – | – | – | 8/15 = 0.53 |
   | w4 11 | – | – | – | 8/15 = 0.53 |
   | w4 12 | essoufflé, fournir | – | – | 8/13 = 0.62 |
   | w4 13 | essoufflé | nourriture, dégager | – | 10/14 = 0.71 |
   | w4 14 | – | nourriture, fournir, rejeter, dégager | chaleur, déchet | 12/15 = 0.80 |
8. **Events** (only on w4 sessions 11–13; `insert … select` joined to class_sessions, so `student_id = session.student_id` and `created_at = started_at + t_sec s`). 11: lost 722, 735, 190; word déchet 300, 745; word chaleur 610. 12: lost 748, 205; déchet 310; chaleur 620. 13: lost 760, 771; déchet 320; chaleur 630. Result: lost_peaks [{12,5},{3,2}], top_words [{déchet,4},{chaleur,3}]. **lucia-w1 has no events**, otherwise her live demo would show 🟠 instead of 8 green + 7 yellow.
9. **Consequence (deliberate)**: API.md asks for word taps on déchet in earlier sessions, so déchet is also 🟠 for w4 (two oranges: chaleur and déchet; essoufflé 🟡). Autonomy is unchanged at 12/15.
10. **lucia-w4 word_mastery** (lemma level/times_tapped): nourriture 3/0, fournir 2/0, rejeter 2/0, dégager 3/0, chaleur 1/3, déchet 0/4, essoufflé 0/0. `last_seen_at` = session 14 started_at. times_tapped = number of seeded `word` events. lucia-w1: no rows.
11. **practice_results**: 12 rows for w4, `passed = true`, `clip_id` null, `created_at = greatest(date_trunc('week', now()), now() - n * interval '10 minutes')` (n = 1..12). Lemmas: nourriture, fournir, rejeter, dégager, chaleur, poumon, sang, souffle, sueur, cœur, effort, vaisseau. No clips are seeded (they would need Storage objects).
12. Out of scope: demo data on the shared project (remote users have other ids). It needs a separate reset script later.

## Tasks
### T1 — pgTAP test (test first)
- **Files:** `supabase/tests/database/03_demo_seed.test.sql` (create)
- **Test:** `begin; select plan(25); … finish(); rollback;` Only read demo rows, by fixed id or demo email. Assert:
  - 3 auth users and 3 email identities; all passwords match `crypt('demo-local-only', encrypted_password)`.
  - prof-demo is a teacher and both Lucías are students; 1 lesson; 15 terms; `set_eq` of the 8 transparent lemmas; the déchet row (forms, translation_es, transparent=false).
  - w1 has 0 mastery rows; `results_eq` of the 7 w4 mastery rows (lemma, level, times_tapped).
  - Sessions: w1 1, w4 4. The w4 ISO weeks (`to_char(started_at,'IYYY-"W"IW')`) are the 4 weeks ending at the current week.
  - `results_eq` of the w4 round(autonomy, 2) ordered by started_at = {0.53, 0.62, 0.71, 0.80}; w1 = 0.53.
  - 72 word_states_log rows; chaleur is orange in session 14.
  - lost buckets (12,5),(3,2); word taps (déchet,4),(chaleur,3); 0 events whose student_id ≠ the session's student; w1 has 0 events; 14 events in total.
  - w4 has 12 passed practice rows in the current ISO week, on 12 distinct lemmas, and 12 practice rows in total.
- **Depends on:** none · **Size:** ~110 lines

### T2 — seed part 1: users, identities, role, lesson, 15 terms
- **Files:** `supabase/seed.sql` (rewrite; keep the local-only header + password note)
- **Test first:** T1's user/role/lesson/term assertions are the target (on an unseeded local DB they fail before T2).
- **Depends on:** none · **Size:** ~100 lines

### T3 — seed part 2: sessions, word_states_log, events, mastery, practice
- **Files:** `supabase/seed.sql` (append after T2 content; whole file ≤ 300 lines)
- **Test first:** T1's mastery/session/autonomy/event/practice assertions. **Done when** the Verification below passes.
- **Depends on:** T2 · **Size:** ~110 lines

### T4 — docs note
- **Files:** `README.md` (3-line "Demo seed (local)" note: users, local password, the seed never runs remote), `docs/STATUS.md` (Miquel line)
- **Test first:** none (docs only). Reviewer checks that no real password appears.
- **Depends on:** none · **Size:** ~10 lines

## Verification (LOCAL only — never `db push`, `--linked`, `db reset`, or a non-127.0.0.1 URL)
1. `docker ps --filter name=supabase_db --format '{{.Names}} {{.Ports}}'` → container + host port of the main-folder stack (+100 ports).
2. Run twice: `docker exec -i <container> psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/seed.sql`. The second run must also exit 0.
3. `npx supabase test db --db-url postgresql://postgres:postgres@127.0.0.1:<port>/postgres`. Confirm the target is the local stack, then check that 01, 02 and 03 all pass.

## Parallel plan
- **Wave 1:** T1, T2, T4 (disjoint files)
- **Wave 2:** T3 (same file as T2), then Verification

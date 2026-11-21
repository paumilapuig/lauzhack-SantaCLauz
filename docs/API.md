# API CONTRACT — source of truth (change this file FIRST, in its own PR, and tell the team chat)

Base URL: `NEXT_PUBLIC_API_URL` (dev: http://localhost:8000)
Auth: `Authorization: Bearer <supabase access_token>` on every `/api/*` route except `/health`.
Role check: the API reads `profiles.role` for the user. Wrong role → `403`. Missing/invalid token → `401`.
Errors: `{ "detail": str }` (FastAPI default). Times: ISO 8601 UTC strings. IDs: uuid strings.

## Shared types

### LessonTermInput (what the LLM produces; format of `docs/demo/glossary-respiration.json`)
```json
{
  "lemma": "mitochondrie",
  "forms": ["mitochondrie", "mitochondries"],
  "translation_es": "mitocondria",
  "definition_fr": "Petite partie de la cellule qui fabrique l'énergie.",
  "transparent": true,
  "key_phrase": "Dans la cellule, il y a de petites usines : les mitochondries."
}
```
- `lemma`: lowercase dictionary form; may contain spaces (`"dioxyde de carbone"`). Unique per lesson.
- `forms`: every surface form that may appear in speech, lowercase, **including the lemma**. May contain spaces.
- `key_phrase`: one sentence from the lesson text where the term appears (used for the fill-the-gap activity, F3 and as fallback context).
- `transparent`: final value after validation (see "Transparency rule").

### LessonTerm = LessonTermInput + `{ "id": uuid, "lesson_id": uuid }`

### WordState = `"green" | "yellow" | "orange"`

## Rules (implemented ONLY in `api/app/mastery.py`, owner B; others import it)
- **Levels** 0–3 per (student, lemma). No row in `word_mastery` → initial level: `3` if `transparent` else `0`.
- **State shown in class**: `level >= 2` → `green`; `level < 2` and lemma in `previously_tapped` → `orange`; else `yellow`.
- **Changes**: tap in class `−1` (min 0) · 3 home activities passed `+1` · recognised in F3 `+1` (max 3).
- **Transparency rule**: `transparent = llm_transparent AND similarity(lemma, translation_es) >= 0.7`, where
  `similarity = difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()` and `norm` = lowercase + strip accents (Unicode NFD, drop combining marks).
  Reference values: libérer/liberar 0.86 ✅, oxygène/oxígeno 0.71 ✅, déchet/desecho 0.62 ❌, chaleur/calor 0.67 ❌.
- **Autonomy** (per student, per session): `green rows ÷ all rows` in `word_states_log` for that session and student (only glossary words that appeared). Returned as a float 0–1; **only the teacher sees it**.
- **Weekly autonomy**: mean of session autonomies grouped by ISO week of `class_sessions.started_at`.
- **Matching in the browser** (`web/lib/wordState.ts`, owner C): lowercase the transcript, try forms longest-first (multi-word before single word), match on word boundaries; `l'`/`d'` elisions are split off before matching.

## Database tables (owner A writes the migration)
RLS principle: a student sees only her rows; a teacher sees rows linked to her/his lessons. The API uses the secret key (bypasses RLS) and enforces the same rules in code.

| Table | Columns | RLS |
|---|---|---|
| profiles | id uuid PK → auth.users, display_name text, **role text check in ('student','teacher') default 'student'**, **l1 text default 'es'**, **level text check in ('A1','A2','B1') default 'A1'**, created_at | own row read/update; teachers can read all profiles |
| lessons | id uuid PK, teacher_id uuid → profiles, title text, subject text, lesson_date date, source_text text, created_at timestamptz | all authenticated read; teacher insert/update own |
| lesson_terms | id uuid PK, lesson_id uuid → lessons on delete cascade, lemma text, forms text[], translation_es text, definition_fr text, transparent bool, key_phrase text; unique(lesson_id, lemma) | all authenticated read; lesson's teacher write |
| word_mastery | student_id uuid → profiles, lemma text, level int check 0–3, times_tapped int default 0, last_seen_at timestamptz; **PK (student_id, lemma)** | student own rows |
| class_sessions | id uuid PK, lesson_id uuid → lessons, student_id uuid → profiles, started_at timestamptz default now() | student own; lesson's teacher read |
| class_events | id uuid PK, session_id uuid → class_sessions, student_id uuid → profiles, t_sec real, type text check in ('word','unclear','lost'), lemma text null, created_at | student own; lesson's teacher read |
| clips | id uuid PK, session_id uuid → class_sessions, student_id uuid → profiles, t_start real, t_end real, transcript text, audio_path text, **kind text not null default 'concept' check in ('word','concept')**, **lemma text null**, created_at | student own; lesson's teacher read |
| word_states_log | session_id uuid, student_id uuid, lemma text, state text check in ('green','yellow','orange'); **PK (session_id, student_id, lemma)** | student own; lesson's teacher read |
| clip_marks | student_id uuid → profiles, clip_id uuid → clips on delete cascade, word text (surface form as tapped, lowercase), lemma text null (glossary lemma of the clip's lesson whose `forms` contain `word`, else null), created_at timestamptz default now(); **PK (student_id, clip_id, word)** | student own; lesson's teacher read |
| practice_results | id uuid PK, student_id uuid → profiles, lemma text, clip_id uuid null → clips, passed bool, created_at timestamptz default now() | student own |

Note: `class_sessions.student_id` is added to the original sketch (one session per student device, see PLAN › Decisions).
Storage: private bucket **`clips`**, object path `{student_id}/{clip_id}.webm`. The API returns signed URLs (1 h).

## Endpoints
| Method | Path | Role | Request | Response | Owner |
|---|---|---|---|---|---|
| GET | /health | – | – | `{ "ok": true }` | A |
| GET | /api/me | any | – | `{ "id", "email", "display_name", "role" }` | A |
| GET | /api/lessons | any | – | `[{ "id", "title", "subject", "lesson_date" }]` newest first | A |
| POST | /api/lessons | teacher | JSON `{ "title", "subject", "lesson_date", "source_text" }` **or** multipart `title, subject, lesson_date, file` (txt / PDF / png / jpg, max 10 MB) | `{ "lesson_id", "terms": LessonTerm[] }` | B |
| GET | /api/lessons/{id}/class-pack | student | – | ClassPack (below) | A |
| POST | /api/sessions | student | `{ "lesson_id" }` | `{ "session_id" }` | A |
| POST | /api/sessions/{id}/events | student | `{ "t_sec": 12.4, "type": "word"\|"lost", "lemma": "déchet"\|null }` | `{ "ok": true, "level": int\|null }` (type `word` applies −1 and returns the new level). `/class` no longer sends `word`: words are marked at home (`clip_marks`); `word` stays until the level decision (STATUS) | A (uses B's `mastery`) |
| POST | /api/sessions/{id}/word-states | student | `{ "states": [{ "lemma", "state": WordState }] }` — first state shown for each glossary word that appeared; sent at end of class | `{ "ok": true, "autonomy": float }` | A |
| POST | /api/clips | student | multipart: `audio` (webm), `session_id`, `t_start`, `t_end`, `transcript`, optional `kind` (`word`\|`concept`, default `concept`), optional `lemma` — see [Clips](#clips--post-apiclips) | `{ "clip_id", "audio_path" }` — a `concept` clip also inserts a class_event `unclear` at `t_end`; a `word` clip inserts no event | A |
| POST | /api/clips/{id}/marks | student (clip owner) | `{ "word": "déchets" }` | `{ "word", "lemma": str\|null, "translation_es": str\|null }` — upsert into `clip_marks` (same word twice = no-op); `translation_es` only for glossary words | A |
| DELETE | /api/clips/{id}/marks/{word} | student (clip owner) | – | `{ "ok": true }` — undo a mark | A |
| GET | /api/home/review | student | – | HomeReview (below) | B |
| POST | /api/practice | student | `{ "lemma", "clip_id": uuid\|null, "passed": bool }` | `{ "lemma", "level": int, "leveled_up": bool }` | B |
| GET | /api/me/progress | student | – | `{ "messages": [{ "kind": "learned_this_week"\|"no_help_needed"\|"keep_going", "text": str }] }` — **never percentages or numbers out of a total** | B |
| GET | /api/teacher/lessons/{id}/dashboard | teacher | – | Dashboard (below) | A (uses B's `mastery.autonomy`) |
| GET | /api/lessons/{id}/preview | student | – | `{ "phrases": [{ "text", "audio_url": str\|null, "lemmas": [str] }] }` — `audio_url` null → client uses `speechSynthesis` (F3) | B |
| POST | /api/lessons/{id}/preview/results | student | `{ "recognized": [lemma] }` | `{ "message": "Mañana entenderás buena parte de la clase" }` (+1 per recognised lemma) (F3) | B |

`POST /api/lessons` details (owner B):
- PDF with ≥ 200 chars of text → sent as text; otherwise the first 5 pages are rendered and sent as images (vision model). Photos are sent as images. Exactly one LLM call per lesson.
- Invalid terms from the LLM are dropped; the 5–8 key phrases the LLM returns are **not stored** (no table; F3 only).
- Errors: `401` no/invalid token · `403` not a teacher · `400` invalid Content-Length · `413` file > 10 MB · `415` unsupported file or content type · `422` missing fields / empty text / unreadable file · `502` LLM error or no valid term · `503` LLM not configured · `500` save failed.

### ClassPack — `GET /api/lessons/{id}/class-pack` (loaded ONCE at the start of class)
```json
{
  "lesson": { "id": "8c1e…", "title": "La respiration cellulaire", "subject": "Biologie", "lesson_date": "2026-11-22" },
  "terms": [
    { "id": "t1…", "lesson_id": "8c1e…", "lemma": "mitochondrie", "forms": ["mitochondrie", "mitochondries"],
      "translation_es": "mitocondria", "definition_fr": "Petite partie de la cellule qui fabrique l'énergie.",
      "transparent": true, "key_phrase": "Dans la cellule, il y a de petites usines : les mitochondries." },
    { "id": "t2…", "lesson_id": "8c1e…", "lemma": "déchet", "forms": ["déchet", "déchets"],
      "translation_es": "desecho", "definition_fr": "Ce qui reste et ne sert plus.",
      "transparent": false, "key_phrase": "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone." }
  ],
  "mastery": { "mitochondrie": 3, "déchet": 0 },
  "previously_tapped": ["chaleur"]
}
```
`mastery` contains EVERY lemma of the lesson (defaults filled). `previously_tapped` = glossary lemmas this student marked at home (`clip_marks.lemma`) on a clip of an earlier session.

### Clips — `POST /api/clips`
Two kinds of clip (decided Sat 21 Nov, see PLAN › Decisions log):
- `word` — lexical doubt, a short clip around one unknown word.
- `concept` — conceptual doubt, a longer clip of an explanation the student did not follow. Default, so a request without `kind` keeps the original meaning.

| Field | Rule |
|---|---|
| `audio` | `audio/webm` (base type of the part's `Content-Type`; codec and file name are not checked), max **2 MiB** (2 097 152 bytes; 2 MiB + 1 → 413), not empty |
| `session_id` | uuid of a session of this student (otherwise 404, nothing is uploaded) |
| `t_start`, `t_end` | seconds on the same clock as `t_sec` of the events; `t_start >= 0`, `t_end > t_start` |
| `kind` | `word` \| `concept`, default `concept`; anything else → 422 |
| `lemma` | optional; when present it must be a lemma of the session's lesson (422 `Unknown lemma for this lesson`); stored as sent. Whether it is useful at all is **pending confirmation by owner B** (since #22 the student marks words at home, not in class) |
| `transcript` | optional text, max 5000 chars, default `""` |

- **Implementation status:** PR #21 implements the base contract (`audio`, `session_id`, `t_start`, `t_end`, `transcript`, the `unclear` event and the response). `kind`, `lemma`, the duration ranges and the `word` behaviour come in a later PR with the additive migration of `clips`; until then every clip behaves as `concept` without duration ranges.
- **Duration** (technical tolerance, not a product target): `word` 1–12 s, `concept` 10–70 s of `t_end - t_start`; outside → 422. The server does not measure the audio itself.
- **Events:** `concept` inserts a `class_events` row of type `unclear` at `t_end`; `word` inserts none (words are marked at home, `clip_marks`).
- **Check order:** 401, 403, 422 (fields, duration), 415, 413, 422 (empty), 404 (session), 422 (lemma). Nothing is stored when a check fails.
- **Storage:** private bucket `clips`, path `{student_id}/{clip_id}.webm`, no overwrite. The response never carries a URL; signed URLs (1 h) are generated by `GET /api/home/review` with `app.storage.signed_clip_url`.
- **Persistence order and rollback:** upload → `clips` row → (`concept` only) `unclear` event. On failure each earlier step is undone best-effort (object, then row); the response is `500` (`Could not store audio` / `Could not save clip`).
- **Response:** `{ "clip_id", "audio_path" }`.

### HomeReview — `GET /api/home/review`
```json
{
  "clips": [
    { "id": "c1…", "lesson_title": "La respiration cellulaire", "created_at": "2026-11-21T21:10:00Z",
      "t_start": 0.0, "t_end": 30.0, "transcript": "… elle produit aussi des déchets …",
      "audio_url": "https://…signed…", "terms": ["déchet", "dioxyde de carbone"],
      "kind": "concept", "lemma": null }
  ],
  "words_to_practice": [
    { "word": "déchets", "lemma": "déchet", "translation_es": "desecho", "definition_fr": "Ce qui reste et ne sert plus.",
      "key_phrase": "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.", "level": 0, "clip_id": "c1…" }
  ]
}
```
- `kind` and `lemma` are the clip's own columns. A `word` clip is pending until it has a `practice_results` row with `passed = true`. A `concept` clip has no lemma, so the 3 activities do not apply: it is always listed, newest first, and has no completion rule. **Proposal, to be confirmed by owner B.** `terms` = glossary lemmas whose forms appear in the transcript (both kinds).
- `words_to_practice` = one item per `clip_marks` row of this student, newest first; glossary words with level ≥ 2 are left out. `clip_id` = the clip where it was marked. `key_phrase` = the sentence of that clip's transcript that contains `word`. Non-glossary words: `lemma`, `translation_es`, `definition_fr` and `level` are `null`.

### Dashboard — `GET /api/teacher/lessons/{id}/dashboard`
```json
{
  "lesson": { "id": "8c1e…", "title": "La respiration cellulaire" },
  "lost_peaks": [ { "minute": 12, "count": 5 }, { "minute": 3, "count": 2 } ],
  "top_words": [ { "lemma": "déchet", "taps": 4 }, { "lemma": "chaleur", "taps": 3 } ],
  "students": [
    { "name": "Lucía (semaine 1)", "autonomy": 0.53, "weekly": [ { "week": "2026-W47", "autonomy": 0.53 } ] },
    { "name": "Lucía (semaine 4)", "autonomy": 0.80,
      "weekly": [ { "week": "2026-W44", "autonomy": 0.53 }, { "week": "2026-W45", "autonomy": 0.62 },
                  { "week": "2026-W46", "autonomy": 0.71 }, { "week": "2026-W47", "autonomy": 0.80 } ] }
  ]
}
```
`lost_peaks`: `lost` events of all sessions of the lesson, bucketed by `floor(t_sec / 60)`, sorted by count desc. `top_words`: `clip_marks` with a `lemma`, counted per lemma (`taps` = number of marks), sorted desc, max 10. `students[].autonomy`: latest session.

## Demo seed (owner A, `supabase/seed.sql` or a script; nothing secret in git)
- Users: `prof-demo` (teacher), `lucia-w1`, `lucia-w4` (students). Emails `<name>@demo.lauzhack`, password in the private chat.
- Lesson "La respiration cellulaire" by prof-demo with the 15 terms of `docs/demo/glossary-respiration.json`.
- `lucia-w1`: no mastery rows (8 transparent green, 7 yellow → ≈53%).
- `lucia-w4`: 4 non-transparent at level 2–3 (`nourriture`, `fournir`, `rejeter`, `dégager`), `chaleur` level 1 and marked at home on a clip of an earlier session (→ 🟠), `déchet`, `essoufflé` level 0; 3 earlier weekly sessions with word_states_log giving 53% → 62% → 71%; 12 `practice_results` passed this week (→ "has aprendido 12 palabras nuevas").
- Earlier sessions with `lost` events peaking at minute 12 and `clip_marks` on `déchets`/`chaleur`.

## Env vars (new; names only — values in the private chat)
- `api/.env`: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `ELEVENLABS_API_KEY` (F3 only). Owner B adds them to `api/.env.example`.

## Generated / mirrored types
- TS: `web/lib/database.types.ts` (generated, don't edit by hand) + `web/lib/contract.ts` (hand-written types of this file, owner C).
- Python: `api/app/schemas.py` (Pydantic, mirror this file).

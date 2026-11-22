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
- **Changes** (decided Sat 21 Nov, PLAN › Decisions log): words are marked **at home**, never in class.
  - **Mark at home** (`POST /api/clips/{id}/marks`, glossary word): the **first** mark of a lemma on the clips of one session → `−1` (min 0). More marks of the same lemma in that session (another form, another clip) change nothing.
  - **Undo** (`DELETE /api/clips/{id}/marks/{word}`): when the **last** mark of that lemma in that session goes, the level gets back exactly what was subtracted: `min(3, level − level_delta)` (`level_delta` = `−1`, or `0` if the level was already 0). Stored in `mark_level_changes`.
  - **Home practice passed** (`POST /api/practice` with `passed: true`, i.e. one practice mode finished correctly for that word) `+1` · **recognised in F3** `+1` (max 3). `passed: false` is stored but changes nothing.
  - `mastery.py` (B) gets `revert_mark(level, level_delta) -> int`; the routes only call `mastery`.
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
| class_events | id uuid PK, session_id uuid → class_sessions, student_id uuid → profiles, t_sec real, type text check in ('word','unclear','lost'), lemma text null, **context_t_start real null**, **context_transcript text null** (only `lost`: the last ≤ 60 s of transcript, no audio), created_at | student own; lesson's teacher read |
| clips | id uuid PK, session_id uuid → class_sessions, student_id uuid → profiles, t_start real, t_end real, transcript text, audio_path text, **reviewed_at timestamptz null** (set by `POST /api/clips/{id}/reviewed`), **timing jsonb null** (karaoke cues), **kind text not null default 'concept' check in ('word','concept')**, **lemma text null**, created_at | student own; lesson's teacher read |
| word_states_log | session_id uuid, student_id uuid, lemma text, state text check in ('green','yellow','orange'); **PK (session_id, student_id, lemma)** | student own; lesson's teacher read |
| clip_marks | student_id uuid → profiles, clip_id uuid → clips on delete cascade, word text (surface form as tapped, lowercase), lemma text null (glossary lemma of the clip's lesson whose `forms` contain `word`, else null), created_at timestamptz default now(); **PK (student_id, clip_id, word)** | student own; lesson's teacher read |
| practice_results | id uuid PK, student_id uuid → profiles, lemma text, clip_id uuid null → clips, passed bool, created_at timestamptz default now() | student own |
| mark_level_changes | student_id uuid → profiles, session_id uuid → class_sessions on delete cascade, lemma text, level_delta int check in (−1, 0), created_at timestamptz default now(); **PK (student_id, session_id, lemma)** — one row per lemma marked at home per session (see Rules › Changes) | student own |
| concept_gaps | id uuid PK, session_id uuid → class_sessions on delete cascade, student_id uuid → profiles, lesson_id uuid → lessons on delete cascade, concept text (French, short label), minutes int[] (distinct `floor(t_sec / 60)` of its lost moments), lemmas text[] (glossary lemmas of the lesson, may be empty), explanation jsonb (`ConceptStep[]`, 3–5), exercises jsonb (`ConceptExercise[]` **with** `answer`, 2–3), status text check in ('pending','review','understood') default 'pending', attempts int default 0, answered_at timestamptz null, created_at timestamptz default now() — see [Concept gaps](#concept-gaps--conceptual-doubts-me-he-perdido) | lesson's teacher read; **no student read** (the rows hold the answers; the API serves them without `answer`) |

Note: `class_sessions.student_id` is added to the original sketch (one session per student device, see PLAN › Decisions).
The `'word'` value stays in the `class_events.type` check for old rows only; the API no longer writes it.
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
| POST | /api/sessions/{id}/events | student | `{ "t_sec": 100.0, "type": "lost", "lemma": null, "context": { "t_start": 40.0, "transcript": "…" } }` — see [Lost event](#lost-event--post-apisessionsidevents) | `{ "ok": true }` | A |
| POST | /api/sessions/{id}/word-states | student | `{ "states": [{ "lemma", "state": WordState }] }` — first state shown for each glossary word that appeared; sent at end of class | `{ "ok": true, "autonomy": float }` — also schedules, in the background, the concept-gap processing of this session (`app.lost_concepts.process_session`, B; see [Concept gaps](#concept-gaps--conceptual-doubts-me-he-perdido)); the response never waits for it | A (route) · B (processing) |
| POST | /api/clips | student | multipart: `audio` (webm), `session_id`, `t_start`, `t_end`, `transcript`, optional `kind` (`word`\|`concept`, default `word`), optional `lemma` — see [Clips](#clips--post-apiclips) | `{ "clip_id", "audio_path" }` — a `concept` clip also inserts a class_event `unclear` at `t_end`; a `word` clip inserts no event | A |
| POST | /api/clips/{id}/marks | student (clip owner) | `{ "word": "déchets" }` | `{ "word", "lemma": str\|null, "translation_es": str\|null, "level": int\|null }` — upsert into `clip_marks` (same word twice = no-op); glossary words apply Rules › Changes (`−1` on the first mark of the lemma in the session); `translation_es` and `level` (after the change) only for glossary words | A (uses B's `mastery`) |
| POST | /api/clips/{id}/reviewed | student (clip owner) | – | `{ "ok": true }` — the student finished picking the hard words of this clip at home; sets `clips.reviewed_at = now()` so the clip leaves `HomeReview.clips` (its marks stay) | A |
| DELETE | /api/clips/{id}/marks/{word} | student (clip owner) | – | `{ "ok": true, "level": int\|null }` — undo a mark; reverts the `−1` when it was the last mark of that lemma in the session | A (uses B's `mastery`) |
| GET | /api/home/review | student | – | HomeReview (below) | B |
| POST | /api/practice | student | `{ "lemma", "clip_id": uuid\|null, "passed": bool }` | `{ "lemma", "level": int, "leveled_up": bool }` | B |
| GET | /api/me/progress | student | – | `{ "messages": [{ "kind": "learned_this_week"\|"no_help_needed"\|"keep_going", "text": str }] }` — **never percentages or numbers out of a total**; texts are in English (e.g. "This week you learned 12 new words") | B |
| GET | /api/teacher/lessons/{id}/dashboard | teacher | – | Dashboard (below) | A (uses B's `mastery.autonomy`) |
| POST | /api/concepts/{id}/answers | student (gap owner) | `{ "answers": [int] }` — one option index per exercise, in order | `{ "correct": [bool], "status": "understood"\|"review" }` — see [Concept gaps](#concept-gaps--conceptual-doubts-me-he-perdido) | B |
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
Two learning paths (decided Sun 22 Nov 00:30, see PLAN › Decisions log): **words** ("No he entendido" → audio clip, this section) and **concepts** ("Me he perdido" → text only, [Concept gaps](#concept-gaps--conceptual-doubts-me-he-perdido)). So a clip is always a **lexical** doubt:
- `word` — the last ~10 s of class audio around words the student did not understand. **Default**; `/class` may omit `kind`.
- `concept` — kept in the check for old rows only; `/class` never sends it (a conceptual doubt stores no audio).

| Field | Rule |
|---|---|
| `audio` | `audio/webm` (base type of the part's `Content-Type`; codec and file name are not checked), max **2 MiB** (2 097 152 bytes; 2 MiB + 1 → 413), not empty |
| `session_id` | uuid of a session of this student (otherwise 404, nothing is uploaded) |
| `t_start`, `t_end` | seconds on the same clock as `t_sec` of the events; `t_start >= 0`, `t_end > t_start` |
| `kind` | `word` \| `concept`, default `word`; anything else → 422 |
| `lemma` | optional; when present it must be a lemma of the session's lesson (422 `Unknown lemma for this lesson`); stored as sent. Whether it is useful at all is **pending confirmation by owner B** (since #22 the student marks words at home, not in class) |
| `transcript` | optional text, max 5000 chars, default `""` |

- **Implementation status:** complete (`kind`, `lemma`, duration ranges and the `word`/`concept` event rule are implemented).
- **Duration** (technical tolerance, not a product target): `word` 1–16 s (the browser recorder cannot cut at exactly 10 s and yields 10–15 s), `concept` 10–70 s of `t_end - t_start`; outside → 422. The server does not measure the audio itself.
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
      "kind": "word", "lemma": null }
  ],
  "words_to_practice": [
    { "word": "déchets", "lemma": "déchet", "translation_es": "desecho", "definition_fr": "Ce qui reste et ne sert plus.",
      "key_phrase": "Elle produit aussi des déchets : de l'eau et du dioxyde de carbone.", "level": 0, "clip_id": "c1…" }
  ],
  "concepts_to_learn": [ ConceptGapForStudent ]
}
```
- `kind` and `lemma` are the clip's own columns. A clip is **pending until the student presses Done** on it (`POST /api/clips/{id}/reviewed` → `clips.reviewed_at`). Only the **5 newest** pending clips are listed, newest first. `terms` = glossary lemmas whose forms appear in the transcript.
- `concepts_to_learn` = this student's `concept_gaps` with `status` `pending` or `review`, newest first (shape in [Concept gaps](#concept-gaps--conceptual-doubts-me-he-perdido)). It is a **separate learning path** from `words_to_practice`: never mixed.
- `words_to_practice` = one item per `clip_marks` row of this student, newest first; glossary words with level ≥ 2 are left out. `clip_id` = the clip where it was marked. `key_phrase` = the sentence of that clip's transcript that contains `word`. Non-glossary words: `lemma`, `translation_es`, `definition_fr` and `level` are `null`.

### Lost event — `POST /api/sessions/{id}/events`
"Me he perdido" saves **text only, no audio**: the transcript of the last 60 s (`t_start = max(0, t_sec − 60)`).
- `type` must be `"lost"`; `"word"` → 422 (words are marked at home). `lemma` must be absent or `null`.
- `context` is required: `t_start` with `0 ≤ t_start ≤ t_sec` and `t_sec − t_start ≤ 70` (tolerance), `transcript` 0–5000 chars (empty allowed: silence). Otherwise 422.
- Stored in `class_events.context_t_start` / `context_transcript`. No LLM call here.

### Concept gaps — conceptual doubts ("Me he perdido")
Two separate learning paths: **words** (clip + marks + 3 activities + levels 0–3) and **concepts** (this section). A concept gap is "something this student did not understand in this class", summarised by the LLM. The student never sees "you got lost here": she gets a short **visual step-by-step explanation** and **exercises**, and her answers tell the system whether she understood. The teacher sees each gap and its status.

**Processing — `app.lost_concepts.process_session(session_id)` (B), once per session, after class**
- Triggered in the background by `POST /api/sessions/{id}/word-states` (end of class). Never during class.
- Input: the session's `lost` events with a non-empty `context_transcript` (max 20, most recent; each transcript max 1500 chars, keeping its end), each with a number `n`, plus the lesson's glossary lemmas.
- **Frugal:** no such event → no call. `concept_gaps` rows already exist for the session → no call (idempotent). Otherwise **exactly 1 LLM call** for the whole session. Calls per student: 0 in class, at most 1 per session after class.
- The LLM returns `{ "concepts": [{ "concept": str, "moments": [n], "lemmas": [str], "explanation": [ConceptStep], "exercises": [ConceptExercise] }] }`, max 3 concepts, French at A1–A2 level, Spanish glosses.
- The API validates and drops invalid concepts (unknown `n`, empty `concept`, not 3–5 steps, not 2–3 exercises, not 2–4 options, `answer` out of range); keeps only glossary lemmas; **computes** `minutes` from the moments itself. Each valid concept → one `concept_gaps` row (`status = 'pending'`).
- LLM error, no valid concept or no `OPENROUTER_API_KEY` → logged, nothing stored, no retry. The class flow is never affected.

`ConceptStep` = `{ "fr": "La cellule reçoit du sucre et de l'oxygène.", "es": "La célula recibe azúcar y oxígeno.", "visual": "🍞 + 💨 → 🔋" }` — `fr` ≤ 200 chars, `es` ≤ 300 chars, `visual` ≤ 40 chars: a tiny emoji/arrow diagram the client animates one step at a time (no images are generated).
`ConceptExercise` (stored) = `{ "question": "Que fabrique la mitochondrie ?", "options": ["de l'énergie", "du sucre", "de l'eau"], "answer": 0 }` — 2–4 options.

**`ConceptGapForStudent`** (in `GET /api/home/review` › `concepts_to_learn`; exercises **without** `answer`):
```json
{ "id": "g1…", "lesson_title": "La respiration cellulaire", "concept": "Comment la cellule fabrique de l'énergie",
  "lemmas": ["mitochondrie", "oxygène"],
  "explanation": [ { "fr": "La cellule reçoit du sucre et de l'oxygène.", "es": "La célula recibe azúcar y oxígeno.", "visual": "🍞 + 💨 → 🔋" } ],
  "exercises": [ { "question": "Que fabrique la mitochondrie ?", "options": ["de l'énergie", "du sucre", "de l'eau"] } ],
  "status": "pending" }
```

**Answers — `POST /api/concepts/{id}/answers`** (student, owner of the gap)
- Body `{ "answers": [int] }`, one index per exercise; wrong length or index out of range → 422. Not her gap → 404. Already `understood` → 409.
- All correct → `status = 'understood'` (it leaves `concepts_to_learn`); otherwise `status = 'review'` (it stays). `attempts + 1`, `answered_at = now()`. No LLM call.
- Response `{ "correct": [true, false], "status": "review" }`. The client shows which answers were right and can show the explanation again.

### Dashboard — `GET /api/teacher/lessons/{id}/dashboard`
```json
{
  "lesson": { "id": "8c1e…", "title": "La respiration cellulaire" },
  "lost_peaks": [ { "minute": 12, "count": 5 }, { "minute": 3, "count": 2 } ],
  "concept_gaps": [
    { "student": "Lucía (semaine 1)", "concept": "Comment la cellule fabrique de l'énergie", "minutes": [12], "lemmas": ["mitochondrie"], "status": "review", "attempts": 1 }
  ],
  "top_words": [ { "lemma": "déchet", "taps": 4 }, { "lemma": "chaleur", "taps": 3 } ],
  "students": [
    { "name": "Lucía (semaine 1)", "autonomy": 0.53, "weekly": [ { "week": "2026-W47", "autonomy": 0.53 } ] },
    { "name": "Lucía (semaine 4)", "autonomy": 0.80,
      "weekly": [ { "week": "2026-W44", "autonomy": 0.53 }, { "week": "2026-W45", "autonomy": 0.62 },
                  { "week": "2026-W46", "autonomy": 0.71 }, { "week": "2026-W47", "autonomy": 0.80 } ] }
  ]
}
```
`lost_peaks`: `lost` events of all sessions of the lesson, bucketed by `floor(t_sec / 60)`, sorted by count desc. `top_words`: `clip_marks` with a `lemma`, counted per lemma (`taps` = number of marks), sorted desc, max 10. `students[]`: every student with a session of the lesson, sorted by name; `autonomy` = latest session that has `word_states_log` rows (`null` if none yet), `weekly` from those sessions. Only the lesson's teacher (`403 Not your lesson`); unknown lesson `404`. `concept_gaps`: the `concept_gaps` rows of all sessions of the lesson, sorted by first minute; `student` = `profiles.display_name`. The dashboard never calls the LLM.

## Demo seed (owner A, `supabase/seed.sql` or a script; nothing secret in git)
- Users: `prof-demo` (teacher), `lucia-w1`, `lucia-w4` (students). Emails `<name>@demo.lauzhack`, password in the private chat.
- Lesson "La respiration cellulaire" by prof-demo with the 15 terms of `docs/demo/glossary-respiration.json`.
- `lucia-w1`: no mastery rows (8 transparent green, 7 yellow → ≈53%).
- `lucia-w4`: 4 non-transparent at level 2–3 (`nourriture`, `fournir`, `rejeter`, `dégager`), `chaleur` level 1 and marked at home on a clip of an earlier session (→ 🟠), `déchet`, `essoufflé` level 0; 3 earlier weekly sessions with word_states_log giving 53% → 62% → 71%; 12 `practice_results` passed this week (→ "has aprendido 12 palabras nuevas").
- Earlier sessions with `lost` events peaking at minute 12 (with `context_transcript` taken from `docs/demo/lesson-respiration.md`) and `clip_marks` on `déchets`/`chaleur`. No `mark_level_changes` rows: the seed sets the levels directly.
- `lucia-w4`: 2 `concept_gaps` from an earlier session (one `understood`, one `review` with `attempts = 1`), so the teacher Dashboard shows concepts before the live demo. `lucia-w1` gets hers from the real after-class call during the demo.

## Env vars (new; names only — values in the private chat)
- `api/.env`: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `ELEVENLABS_API_KEY` (F3 only). Owner B adds them to `api/.env.example`.

## Generated / mirrored types
- TS: `web/lib/database.types.ts` (generated, don't edit by hand) + `web/lib/contract.ts` (hand-written types of this file, owner C).
- Python: `api/app/schemas.py` (Pydantic, mirror this file).

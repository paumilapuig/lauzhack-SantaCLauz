# Spec: api-home-review — `GET /api/home/review` (owner B)
Branch: `laurarebollocrespo/feat/api-home-review`

## Goal
Lucía opens /home and gets only her own pending audio clips and the words she marked, matching the HomeReview JSON in `docs/API.md`.
**Acceptance:** `uv run pytest` is green. In `/docs`, a student token returns `{"clips":[…],"words_to_practice":[…]}`, newest first, and each clip has a signed `audio_url`. A teacher token gets 403. No token gets 401.

## Contract changes
None. The shapes follow `docs/API.md` §HomeReview as it is on main. `concepts_to_review` is not on main, so it is not implemented (T5 adds a STATUS request).

## Decisions
- **kind/lemma:** `clips.kind` and `clips.lemma` are not in `supabase/migrations`, so they are never queried. Every clip is returned with `"kind": "word"` and `"lemma": null`. Team decision (Sat 21/11): "No he entendido" saves a 10 s audio clip and "Me he perdido" saves no audio, so every audio clip is a `word` clip. The pending rule therefore applies to all clips.
- **Pending clip:** a clip is pending unless `practice_results` has a row with the same `clip_id`, the same `student_id` and `passed = true`. A row with `passed = false` leaves it pending.
- **lesson_title:** found with separate queries: `clips.session_id` → `class_sessions.lesson_id` → `lessons.title`. The fake has no joins.
- **audio_url:** only from `app.storage.signed_clip_url(db, clip["audio_path"])` (1 h).
- **Missing storage object:** if signing raises, the clip is **left out** and a warning is logged. The endpoint does not return 500. The contract types `audio_url` as a string, so `null` is not allowed, and a clip without audio cannot be reviewed anyway. Left out this way, a single broken object cannot break the demo.
- **words_to_practice:** one entry per `clip_marks` row, newest first. If the mark has a lemma, the term is looked up in `lesson_terms` by (lesson of the clip, lemma). Level = `word_mastery.level`, or `mastery.initial_level(transparent)` if there is no row. Entries with level ≥ 2 are left out. A mark with no lemma, or whose lemma is not in the lesson, is out of the glossary: `lemma`, `translation_es`, `definition_fr` and `level` are null, and it is included. A mark whose clip is not one of the student's clips is skipped.
- **key_phrase:** split the transcript with `re.split(r"(?<=[.!?;])\s+")`. Take the first sentence that contains `word` (case-insensitive) and strip it; the closing punctuation stays. If no sentence matches, use the whole transcript, stripped.
- **find_lemmas(text, terms):**
  - Normalise text and forms the same way: lowercase, and `’` → `'`. Split off elisions with `\b([ld])'` → `\1 `.
  - Candidates are every `forms` entry plus the lemma. Sort them by word count, longest first, then by length, longest first.
  - Match with `(?<!\w)re.escape(form)(?!\w)`. Skip any match that overlaps a span already taken.
  - Each lemma appears once in the result, ordered by the text position of its first match.
- **Layers:**
  - `home_repository.py` holds every DB and storage call. It returns plain dicts. An `.in_()` call with an empty list is skipped and returns `[]`.
  - `home_review.py` is the pure assembler (no DB, no FastAPI). Justification: the router stays HTTP-only, and the logic can be reused by the later `concepts_to_review` task.
  - `routers/home.py` does auth → repository → assembler.
- **Dependency:** the `clip_marks` migration is pending (owner A). The real endpoint fails until it lands; tests use FakeSupabase.

## Tasks
**T1 — term_matching (pure)**
- Files: `api/app/term_matching.py`, `api/tests/test_term_matching.py`
- Test first. Each line is an input → expected result:
  - "les mitochondries" → `["mitochondrie"]`
  - "du dioxyde de carbone" with terms `dioxyde de carbone` + `carbone` → `["dioxyde de carbone"]` only
  - "l'oxygène" and "l’oxygène" → `["oxygène"]`
  - "déchetsx" → `[]`
  - text without terms → `[]`
  - a lemma found twice → listed once
- Depends on: none · Size: ~90

**T2 — schemas + repository**
- Files: `api/app/home_schemas.py`, `api/app/home_repository.py`
- Schemas:
  - `ReviewClip`: id, lesson_title, created_at, t_start, t_end, transcript, audio_url, `terms: list[str]`, `kind: Literal["word","concept"]`, `lemma: str | None`
  - `WordToPractice`: word, lemma, translation_es, definition_fr, key_phrase, `level: int | None`, clip_id
  - `HomeReview`: `clips`, `words_to_practice`
- Repository functions (each takes `db: Client`):
  - `fetch_student_clips(db, student_id)`: id, session_id, t_start, t_end, transcript, audio_path, created_at. Ordered by created_at desc.
  - `fetch_passed_clip_ids(db, student_id) -> set[str]`
  - `fetch_sessions(db, ids)`
  - `fetch_lessons(db, ids)`
  - `fetch_lesson_terms(db, lesson_ids)`
  - `fetch_clip_marks(db, student_id)`: ordered by created_at desc.
  - `fetch_mastery(db, student_id, lemmas) -> dict[str, int]`
  - `sign_audio(db, clip_id, path) -> str | None`: wraps `signed_clip_url`, catches the exception, calls `logger.warning(...)` including the `clip_id` (`logger = logging.getLogger(__name__)`) and returns None.
- Test first: covered by T3 and T4 through the endpoint. There is no separate test file because the file list is fixed.
- Depends on: none · Size: ~110

**T3 — clips list + route**
- Files: `api/app/home_review.py` (`build_clips`), `api/app/routers/home.py`, `api/app/main.py` (one `include_router`), `api/tests/test_home_review.py`
- Route: `GET /api/home/review` with `StudentUser` and `SupabaseClient` (pattern in `classdata.py:17`). `response_model=HomeReview`.
- Test first. Same pattern as `test_clips_api.py`: monkeypatch `roles.fetch_profile`, override `get_current_user` and `get_supabase`. Use `FakeSupabase` with all queried tables seeded, empty ones too: clips, class_sessions, lessons, lesson_terms, practice_results, clip_marks, word_mastery. Upload the storage object with `fake_storage` before signing. The tests assert:
  - a pending clip has `audio_url`, `lesson_title`, the correct `terms`, `kind == "word"` and `lemma is None`
  - a clip with `passed=true` is not listed; a clip with `passed=false` is listed
  - another student's clip is not listed
  - clips are ordered newest first
  - a clip with no storage object is left out AND a WARNING log record containing its clip_id is emitted (pytest `caplog`)
  - a teacher gets 403; no token gets 401 (`TestClient(main.app)`)
  - a student with no data gets `{"clips": [], "words_to_practice": []}`
- Depends on: T1, T2 · Size: ~150

**T4 — words_to_practice**
- Files: `api/app/home_review.py` (`build_words`, `find_key_phrase`), `api/app/routers/home.py` (wire), `api/tests/test_home_review.py`
- Test first. The tests assert:
  - a glossary word at level 0 is listed with `translation_es`, `definition_fr` and the `key_phrase` of its own sentence
  - a word at level 2 is not listed
  - with no `word_mastery` row: a transparent term (level 3) is not listed; a non-transparent one (level 0) is listed with level 0
  - an out-of-glossary word is listed with lemma/translation_es/definition_fr/level = null and the whole transcript as `key_phrase` if no sentence matches
  - words are ordered newest first
- Depends on: T3 (same files) · Size: ~140

**T5 — STATUS request**
- Files: `docs/STATUS.md`. Edit the "Requests to other areas" section only.
- Add these two lines:
  - `Laura: concepts_to_review pendent del PR de contracte del Miquel`
  - `Laura → Miquel: docs/API.md línia ~141 (clips concept 'always listed') ja no quadra amb la decisió 'tots els clips amb àudio són word'; actualitza-ho al PR de contracte.`
- Test: none (docs only) · Depends on: none · Size: 1

## Parallel plan
- Wave 1: T1, T2, T5 (no shared files)
- Wave 2: T3
- Wave 3: T4

## Diff estimate and PR split
Total is about 490 lines, about half of it tests. Owner decision (Laura): ONE PR on `laurarebollocrespo/feat/api-home-review`, no stacked branches, with separate commits: first `api: term matching for glossary forms` (T1), then `api: GET /api/home/review` (T2–T5). The PR body states how many lines are tests and how many are code.

Approved file list: `api/app/term_matching.py`, `api/tests/test_term_matching.py`, `api/app/home_schemas.py`, `api/app/home_repository.py`, `api/app/home_review.py` (pure, approved by owner), `api/app/routers/home.py`, `api/app/main.py`, `api/tests/test_home_review.py`, `docs/STATUS.md`, `docs/specs/api-home-review.md`.

Constraints: no new libraries. Max 300 lines per file. Do not touch classdata*, clips*, storage.py, roles.py, API.md, migrations, web/ or fake_supabase.py.

# Spec: api-concepts-home (owner B, Laura)

## Goal
The student's home shows her pending/review concept gaps (no answers leaked), and she can answer them via `POST /api/concepts/{id}/answers`, which grades without any LLM and moves the gap to `understood` or `review`.
**Acceptance:** `uv run pytest` is green. In the demo, `GET /api/home/review` returns `concepts_to_learn` with no `answer` keys. Posting all-correct answers returns `{"correct":[true,...],"status":"understood"}`, and after that the gap disappears from home.

## Contract changes
None. `docs/API.md` on main already defines `ConceptGapForStudent` and `POST /api/concepts/{id}/answers`. Do NOT edit it.

## Tasks
**T1 / revert_mark in mastery**
- Files: `api/app/mastery.py`, `api/tests/test_mastery.py`
- Test first: `revert_mark(0,0)==0`, `(1,-1)==2`, `(3,-1)==3`, `(2,0)==2`.
- Code: `revert_mark(level: int, level_delta: int) -> int` returns `min(MAX_LEVEL, level - level_delta)`.
- Depends on: none. Size: ~20 lines.

**T2 / pure grader**
- Files: `api/app/concept_answers.py` (new), `api/tests/test_concept_answers.py` (new)
- Test first: all answers right gives `understood`; one wrong gives `review`; `correct[i]` is False only at the wrong index; a length mismatch raises `ValueError`; an index outside `0..len(options)-1` raises `ValueError`.
- Code: `grade(exercises: list[dict], answers: list[int]) -> tuple[list[bool], str]`. It does no DB or FastAPI work and raises `ValueError` on invalid input.
- Depends on: none. Size: ~60 lines.

**T3 / fake_supabase update()**
- Files: `api/tests/fake_supabase.py`, `docs/STATUS.md` (only the "## Requests to other areas" note: "Laura ha afegit update() a fake_supabase.py")
- Test first: none of its own, because it is a test helper. T5 exercises it.
- Code: `update(payload)` follows the same pattern as insert/delete. It applies `payload` to the rows that pass the `eq` filters and returns them on `execute()`. Keep it minimal.
- Depends on: none. Size: ~20 lines.

**T4 / concepts_to_learn in home**
- Files: `api/app/home_repository.py`, `api/app/home_review.py`, `api/app/home_schemas.py`, `api/app/routers/home.py` (minimal wiring; B's area, outside the original list), `api/tests/test_home_concepts.py` (new, because `test_home_review.py` is 213 lines and would grow too large)
- Test first (`test_home_concepts.py`): pending and review gaps both appear; understood gaps and other students' gaps don't; no exercise contains `answer`; order is newest first by `created_at`; `lesson_title` is correct; `words_to_practice` and `clips` are unchanged; a student with no gaps gets `concepts_to_learn == []`.
- Code:
  - Repository: `fetch_concept_gaps(db, student_id)` filters `.in_("status", ["pending","review"])` and orders by `created_at` desc.
  - Builder: pure `build_concepts(gaps, lessons_by_id) -> list[ConceptGapForStudent]`, which strips `answer`.
  - Schemas: add `ConceptStep`, `ConceptExerciseForStudent` and `ConceptGapForStudent`; `HomeReview` gets `concepts_to_learn: list[ConceptGapForStudent] = []`.
  - Router: call `fetch_lessons` separately with the gap lesson ids. Do not mix this with the clips/words path.
- Depends on: none. Size: ~130 lines.

**T5 / answers router**
- Files: `api/app/routers/concepts.py` (new), `api/app/main.py` (only the import and `include_router`), `api/tests/test_concepts_route.py` (new)
- Test first:
  - All correct: 200 with `{correct: all true, status: "understood"}`; the row becomes `understood` with `attempts == 1` and `answered_at` set.
  - A wrong answer gives `review`. Two posts give `attempts == 2`.
  - Another student's gap or a missing gap gives 404. An already understood gap gives 409.
  - Wrong length or an out-of-range index gives 422.
  - A teacher token gives 403. No token gives 401 (copy the pattern from an existing route test).
- Code:
  - `POST /api/concepts/{id}/answers` takes `StudentUser` and `SupabaseClient`, with body `{"answers": list[int]}`.
  - It selects the gap with `.eq("id").eq("student_id", user.id).maybe_single()`: 404 if not found, 409 if `understood`.
  - It calls `grade` and maps `ValueError` to `HTTPException(422)`.
  - It updates the row with `status`, `attempts + 1` and `answered_at` (ISO UTC now), then returns `{correct, status}`.
- Depends on: T2, T3. Size: ~120 lines.

## Parallel plan
| Wave | Task | Files |
|---|---|---|
| 1 | T2 | `api/app/concept_answers.py`, `api/tests/test_concept_answers.py` |
| 1 | T3 | `api/tests/fake_supabase.py`, `docs/STATUS.md` |
| 1 | T4 | `api/app/home_repository.py`, `api/app/home_review.py`, `api/app/home_schemas.py`, `api/app/routers/home.py`, `api/tests/test_home_concepts.py` |
| 2 | T5 | `api/app/routers/concepts.py`, `api/app/main.py`, `api/tests/test_concepts_route.py` |
| 2 | T1 | `api/app/mastery.py`, `api/tests/test_mastery.py` |

No two tasks in the same wave share a file. T1 has no dependencies, but it goes in Wave 2 to keep Wave 1 at 3 tasks.

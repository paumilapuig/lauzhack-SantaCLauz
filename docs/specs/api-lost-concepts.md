# Spec: api-lost-concepts (owner B, branch `laurarebollocrespo/feat/api-lost-concepts`)

## Goal
Pure module `api/app/lost_concepts/` turns the "Me he perdido" transcript fragments of a session into short concept summaries (FR A1–A2 + ES) with exactly 1 OpenRouter call.
Acceptance: `uv run pytest tests/test_lost_concepts_*` green; `uv run python -m scripts.smoke_lost_concepts` prints 3 concepts (concept_fr, explanation_es, lemmas) plus time and cost.

## Contract changes
None. No routes, DB, migrations or `docs/API.md` changes. Miquel will call it from `POST /api/sessions/{id}/word-states` later.
Do not touch `app/glossary/*`, routers, classdata*, clips*, storage.py, roles.py, fake_supabase.py, supabase/, web/. No new libraries.

## Tasks
**T1 / schema + errors + package stub**
- Files: `api/app/lost_concepts/schema.py`, `api/app/lost_concepts/errors.py`, `api/app/lost_concepts/__init__.py` (one-line docstring only, no imports yet).
- schema.py: `LostContext(event_id: str min_length=1, t_sec: float >= 0, transcript: str)`; `LostConcept(event_id: str min_length=1, concept_fr: str min_length=1 max_length=MAX_CONCEPT_FR_CHARS, explanation_es: str min_length=1 max_length=MAX_EXPLANATION_ES_CHARS, lemmas: list[str] = [])`. Constants `MAX_CONCEPT_FR_CHARS = 300`, `MAX_EXPLANATION_ES_CHARS = 600`; strings stripped (`str_strip_whitespace`) so whitespace-only counts as empty.
- errors.py: `class LostConceptsParseError(ValueError)`.
- Test first: none of its own (pure declarations; covered by T2/T3 tests). Depends on: none. Size: ~40 lines.

**T2 / prompt**
- Files: `api/app/lost_concepts/prompt.py`, `api/tests/test_lost_concepts_prompt.py`.
- `PROMPT_VERSION = "v1"`, `MAX_CONTEXTS = 20`, `MAX_TRANSCRIPT_CHARS = 1500`, `SYSTEM_PROMPT` (triple-quoted).
- `select_contexts(contexts) -> list[LostContext]`: keep the `MAX_CONTEXTS` with highest `t_sec`, return them sorted ascending by `t_sec`, each transcript cut to its LAST `MAX_TRANSCRIPT_CHARS` chars (`transcript[-MAX:]`).
- `build_messages(contexts, glossary: list[GlossaryTerm]) -> list[dict]`: calls `select_contexts`; system + user. User lists glossary as `lemma — translation_es` lines and each fragment as `event_id` + transcript.
- SYSTEM_PROMPT asks ONLY JSON `{"concepts": [{"event_id","concept_fr","explanation_es","lemmas"}]}`; concept_fr = 1 sentence very simple French (A1–A2) max ~20 words, the concept the teacher was explaining; explanation_es = 1–2 Spanish sentences for a 14-year-old girl, adding nothing not in the fragment; lemmas = only glossary lemmas present in or key to the fragment; copy event_id verbatim; noise / no content -> omit the item or concept_fr "".
- Test first: messages contain every event_id + its transcript and every glossary lemma; 25 contexts (t_sec 0..24) -> only 20 event_ids present, exactly the 20 most recent (5 oldest absent); a 3000-char transcript (distinct start/end markers) -> 1500 chars kept, end marker in, start marker out.
- Depends on: T1. Size: ~110 lines.

**T3 / parser**
- Files: `api/app/lost_concepts/parser.py`, `api/tests/test_lost_concepts_parser.py`.
- Own copy of `FENCE_PATTERN = re.compile(r"^```(?:json)?\s*(.*?)\s*```$", re.DOTALL)`; helpers `_strip_fences`, `_load_object` (bad JSON, non-object, or `concepts` not a list -> `LostConceptsParseError`), `_valid_items` (pydantic-validate each item, skip `ValidationError`, unknown event_id, non-dict).
- `parse_lost_concepts(content: str, event_ids: set[str], glossary_lemmas: list[str]) -> ParsedLostConcepts` (frozen dataclass: `concepts: list[LostConcept]`, `dropped: int`). Dedupe by event_id (first wins, later counted dropped). Lemmas: match glossary case-insensitively after strip, return the glossary's canonical spelling, drop the rest, dedupe keeping order.
- Test first: valid JSON -> correct LostConcepts; ```json fenced works; unknown event_id dropped; empty concept_fr dropped; repeated event_id -> one; lemmas outside glossary filtered, repeated -> one; unreadable JSON -> `LostConceptsParseError`; `dropped` counts match.
- Depends on: T1. Size: ~140 lines.

**T4 / summarize + exports**
- Files: `api/app/lost_concepts/summarize.py`, `api/app/lost_concepts/__init__.py`, `api/tests/test_lost_concepts_summarize.py`.
- `logger = logging.getLogger(__name__)`; frozen dataclass `Metrics(seconds: float, prompt_tokens: int, completion_tokens: int, cost_usd: float, dropped_items: int)` (no overrides/dropped_terms).
- `summarize_lost_contexts(contexts, glossary, model, api_key, http=None) -> tuple[list[LostConcept], Metrics]`: empty contexts -> `([], Metrics(0, 0, 0, 0.0, 0))` with no call; else `select_contexts`, `build_messages`, ONE `call_openrouter` (from `app.glossary.openrouter_client`), `parse_lost_concepts` with selected event_ids and glossary lemmas; usage read like generate.py; one `logger.info` (model, contexts, concepts, dropped, seconds, tokens, cost; never the key). `OpenRouterError` and `LostConceptsParseError` propagate untouched.
- `__init__.py` exports `summarize_lost_contexts, LostContext, LostConcept, LostConceptsParseError` (`__all__`).
- Test first (httpx.MockTransport, `make_client(content, seen)`, USAGE `{"prompt_tokens":120,"completion_tokens":30,"cost":0.0004}`): 3 contexts -> exactly 1 HTTP request, 3 results; empty -> 0 requests, `[]`, zero Metrics; HTTP 500 -> `OpenRouterError`; Metrics tokens/cost from usage; caplog: exactly one INFO record from `app.lost_concepts.summarize`, api key not in it.
- Depends on: T2, T3. Size: ~130 lines.

**T5 / manual smoke script**
- Files: `api/scripts/smoke_lost_concepts.py` (no test; manual only).
- Docstring usage `uv run python -m scripts.smoke_lost_concepts`; `OPENROUTER_API_KEY` from `os.environ`, missing -> `SystemExit` non-zero message. Model `get_settings().resolved_model()`.
- Reads `docs/demo/lesson-respiration.md`: non-empty lines between `## Texte à lire` and the next `## ` heading, `**` stripped, split into 3 consecutive chunks (~4/4/3 sentences), `t_sec` 60/120/180, event_ids `smoke-1..3`. Glossary: `docs/demo/glossary-respiration.json` -> `GlossaryTerm.model_validate` each. Prints each concept, seconds and cost_usd.
- Imports from `app.lost_concepts.summarize` / `.schema` (runs after T4 lands). Depends on: T1. Size: ~70 lines.

## Parallel plan
- Wave 1: T1
- Wave 2: T2, T3 (parallel; disjoint files)
- Wave 3: T4, T5 (parallel; disjoint files; T5 only executed manually after T4 merges)

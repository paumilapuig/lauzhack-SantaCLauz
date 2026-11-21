# Spec: spike-b-glossary

## Goal
Prove, in `spikes/b-glossary/` (pure Python, later ported to `api/app/`), the transparency rule, pure mastery/autonomy logic,
and a frugal multimodal glossary generator (1 cached OpenRouter call per lesson, text and/or downscaled images, model picked by benchmark).
**Acceptance:** `uv run --with pytest,httpx,pydantic,pillow pytest spikes/b-glossary` is green (all HTTP mocked); with a key,
`spikes/b-glossary/cli.py --text docs/demo/lesson-respiration.md --image page.jpg` prints metrics + comparison vs `docs/demo/glossary-respiration.json`,
a second run prints `cached: true, cost_usd: 0`, and `benchmark.py` prints one row per model.

## Contract changes
None. Spike only. `key_phrases` and image input are NOT in `docs/API.md`; flagged for SYNC 1 (T8).

## Tasks
`S` = `spikes/b-glossary/`. Deps: pytest, httpx, pydantic, pillow (image downscale; logged in PLAN by T8) + stdlib. No `__init__.py` in `S`;
tests import siblings directly and use only T3's `conftest.py` fixtures.

**T1 transparency** — `S/transparency.py`, `S/test_transparency.py`. Deps: none. ~80 lines.
`norm(s)` (lowercase, NFD, drop combining marks), `similarity(a,b)` (difflib ratio of norms), `is_transparent(llm_flag, lemma, translation_es)` = `llm_flag and similarity >= 0.7`.
Test: `round(similarity,2)` libérer/liberar 0.86, oxygène/oxígeno 0.71, déchet/desecho 0.62, chaleur/calor 0.67; `llm_flag=False` → False; rule over glossary-respiration.json gives 8/7 = file flags.

**T2 mastery (pure, stable signatures for A)** — `S/mastery.py`, `S/test_mastery.py`. Deps: none. ~140 lines.
`initial_level(transparent)->int` (3/0); `state(level, previously_tapped)->"green"|"yellow"|"orange"` (>=2 green; tapped orange; else yellow);
`apply_tap` (−1, min 0); `apply_practice(level, passed)` (+1 if passed, max 3); `apply_preview` (+1, max 3); `autonomy(states)->float` (green ÷ all; empty 0.0);
`weekly_autonomy(sessions: list[tuple[datetime,float]])->list[{"week":"YYYY-Www","autonomy"}]` unweighted ISO-week mean, sorted.
Test: bounds 0 and 3 for each apply_*, all three states, empty autonomy, 2026-12-31 → "2026-W53", zero-padded week, sort order.

**T3 schema + conftest** — `S/glossary_schema.py`, `S/conftest.py`, `S/test_glossary_schema.py`. Deps: none. ~100 lines.
`LessonTermInput {lemma, forms, translation_es, definition_fr, transparent, key_phrase}` (lemma/forms lowercased, lemma in forms); `KeyPhrase {text, lemmas}`;
`GlossaryResult {terms, key_phrases (5–8)}`. conftest: `sys.path` insert of `S`, fixture `reference_terms`.
Test: reference JSON validates; uppercase lowercased; lemma not in forms / 4 or 9 key_phrases → ValidationError.

**T9 image_prep** — `S/image_prep.py`, `S/test_image_prep.py`. Deps: none. ~70 lines.
`prepare_image(path, max_side=1024, quality=70) -> PreparedImage{jpeg_bytes, bytes_before, bytes_after}`: downscale keeping aspect, grayscale, JPEG. Non png/jpg (incl. PDF) → ValueError.
Test (tmp 3000×2000 color PNG via Pillow): output max side 1024, mode "L", JPEG magic bytes, bytes_after < bytes_before; small image not upscaled; `.pdf` → ValueError.

**T4 prompt** — `S/prompt.py`, `S/test_prompt.py`. Deps: T9. ~120 lines.
`PROMPT_VERSION` const; `build_messages(source_text, image_paths, max_side=1024) -> (messages, list[PreparedImage])`. English system prompt: strict JSON as GlossaryResult,
10–20 terms for an A1–A2 Spanish-speaking 14-year-old, ES translations, simple FR definitions, LLM `transparent`, `key_phrase` verbatim from source, terms may come from figure labels, 5–8 key_phrases.
User parts: text + one `image_url` with `data:image/jpeg;base64,…` per prepared image. No text and no images → ValueError. PDF out of scope.
Test: text only → 1 part; 2 images → 2 jpeg data URLs; empty → ValueError; system prompt contains "JSON".

**T5 openrouter client** — `S/openrouter_client.py`, `S/test_openrouter_client.py`. Deps: none. ~90 lines.
`call_openrouter(messages, model, api_key, http=None) -> (content, usage)`; POST `https://openrouter.ai/api/v1/chat/completions`, Bearer,
`response_format={"type":"json_object"}`, `usage={"include": True}`. Non-2xx → RuntimeError(status + excerpt).
Test (httpx.MockTransport): URL, header, body fields; content + usage incl. `cost`; 401 → RuntimeError.

**T10 cache** — `S/cache.py`, `S/test_cache.py`. Deps: T3. ~80 lines.
`cache_key(model, prompt_version, source_text, image_bytes: list[bytes]) -> sha256 hex`; `load(key, cache_dir) -> dict|None`; `save(key, result_dict, metrics_dict, cache_dir)`.
Test (tmp_path): same inputs → same key; any input change → different key; save/load round-trip; missing → None.

**T6 generate_glossary** — `S/generate_glossary.py`, `S/test_generate_glossary.py`, `S/fixtures/fake_llm_response.json`. Deps: T1, T3, T4, T5, T10. ≤150 lines (CLI → `S/cli.py` if over).
`generate(source_text, image_paths, model, api_key, http=None, cache_dir=S/cache, max_side=1024) -> (GlossaryResult, Metrics)`;
`Metrics{seconds, prompt_tokens, completion_tokens, cost_usd, cached, image_bytes_before, image_bytes_after}`. Cache hit → no HTTP, `cached=True`, `cost_usd=0`.
Strip ```json fences; invalid JSON/schema → `ValueError("LLM returned invalid glossary: …")`; override `transparent` with `is_transparent`.
`compare_with_reference(result, reference_terms) -> {matched, missing, extra, reference_transparent_mismatches}` (by lemma; final rule-applied flag ≠ reference file; LLM-vs-rule count is `Metrics.llm_flag_overrides`).
CLI `[--text F] [--image F ...] [--max-side N]`; env `OPENROUTER_API_KEY` (missing → exit 1 with message), `OPENROUTER_MODEL` (default `google/gemini-2.5-flash-lite`); writes `S/out/glossary-<ts>.json`.
Test: fenced fixture parses; override 8/7; garbage → ValueError; metrics from usage; second call hits cache (MockTransport call count 1); comparison; missing key → SystemExit.

**T11 benchmark** — `S/benchmark.py`, `S/test_benchmark.py`. Deps: T6. ~100 lines.
`run_benchmark(models, source_text, image_paths, api_key, http=None)` (no cache_dir: fresh tmp cache per model) `-> list[Row{model, matched, reference_size, reference_transparent_mismatches, llm_flag_overrides, cost_usd, seconds, prompt_tokens, error}]`; `format_table(rows)`.
CLI `--models a,b,c` (configurable default: `google/gemini-2.5-flash-lite,openai/gpt-4.1-nano,meta-llama/llama-4-scout,qwen/qwen2.5-vl-72b-instruct`), same inputs as T6; prints table, writes `S/out/benchmark-<ts>.md`.
Test (MockTransport answering per model): one row per model in order; table has header + rows; a model returning garbage → row with error, run continues.

**T7 env + README + gitignore** — `api/.env.example`, `S/README.md`, `S/.gitignore` (`out/`, `cache/`). Deps: none. ~60 lines.
Env: `OPENROUTER_API_KEY=`, `OPENROUTER_MODEL=google/gemini-2.5-flash-lite`, `ELEVENLABS_API_KEY=`. README: run tests/CLI/benchmark, what is measured,
frugality story (1 call/lesson, no LLM in class, rule-based transparency, image downscale, cache, model chosen by benchmark); next steps (not implemented):
D global word dictionary across lessons, E A1 frequency pre-filter. Check: `git check-ignore spikes/b-glossary/cache/x.json` succeeds.

**T8 docs** — `docs/STATUS.md`, `docs/PLAN.md` (Decisions log line only). Deps: none. ~15 lines.
STATUS: update Laura (B) line; "Requests to other areas": "Laura → team (SYNC 1): proposal: POST /api/lessons also accepts images (photo of textbook page/blackboard) → vision model, for AXA multimodal; needs PLAN decision + API.md change by A". Note the PLAN.md touch (A's area).
PLAN Decisions log: "Pillow added for spike B image downscale (frugal vision tokens)."

## Parallel plan
| Wave | Tasks | Files |
|---|---|---|
| 1 | T1, T3, T9 | transparency; glossary_schema + conftest; image_prep (+ tests) |
| 2 | T4, T5, T10 | prompt; openrouter_client; cache (+ tests) |
| 3 | T6, T2, T7 | generate_glossary + fixture; mastery; api/.env.example, README, S/.gitignore |
| 4 | T11, T8 | benchmark (+ test); docs/STATUS.md, docs/PLAN.md |

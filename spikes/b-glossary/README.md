# Spike B: glossary generator

Pure-Python spike (later ported to `api/app/`): transparency rule, mastery/autonomy logic,
and a frugal multimodal glossary generator (text and/or textbook photos -> one OpenRouter call).

## Run the tests (no network, HTTP is mocked)

    uv run --with pytest,httpx,pydantic,pillow,pymupdf pytest spikes/b-glossary

## Generate a glossary

Put the key in your environment (never in git; `api/.env.example` lists the names):

    export OPENROUTER_API_KEY=...            # PowerShell: $env:OPENROUTER_API_KEY="..."
    export OPENROUTER_MODEL=google/gemini-2.5-flash-lite   # optional, this is the default

    uv run --with httpx,pydantic,pillow,pymupdf python spikes/b-glossary/cli.py --text docs/demo/lesson-respiration.md
    uv run --with httpx,pydantic,pillow,pymupdf python spikes/b-glossary/cli.py --image page.jpg
    uv run --with httpx,pydantic,pillow,pymupdf python spikes/b-glossary/cli.py --text docs/demo/lesson-respiration.md --image page.jpg
    uv run --with httpx,pydantic,pillow,pymupdf python spikes/b-glossary/cli.py --pdf lesson.pdf

Paths are relative to the repo root; run all commands from there (cli.py and benchmark.py resolve their own paths). Options: `--text F`, `--image F ...` (png/jpg), `--pdf F` (combinable with the others; prints whether the PDF was used as text or rendered as N page images), `--max-side N` (default 1024).
Output goes to `spikes/b-glossary/out/glossary-<ts>.json` with metrics and a comparison
against `docs/demo/glossary-respiration.json`. A second identical run prints `cached: true, cost_usd: 0`.

## Benchmark models

    uv run --with httpx,pydantic,pillow,pymupdf python spikes/b-glossary/benchmark.py --text docs/demo/lesson-respiration.md \
      --models google/gemini-2.5-flash-lite,openai/gpt-4.1-nano,meta-llama/llama-4-scout,qwen/qwen2.5-vl-72b-instruct

Same inputs as the CLI (`--text`, `--image`, `--pdf`); every model is really called (cache bypassed). Prints one row per model and writes `out/benchmark-<ts>.md`. A failing model gives an error row; the run continues.

## What is measured

- Coverage: reference terms matched (of 15), missing and extra terms.
- Transparency: mismatches vs the reference, and how many LLM flags the rule (`is_transparent`) overrode.
- Cost (USD, from OpenRouter usage), latency (seconds), prompt/completion tokens, image bytes before/after downscale.

## Frugality

- One LLM call per lesson; none during class (live subtitles use browser Web Speech).
- Transparency (cognates) decided by a rule (string similarity >= 0.7), not by the model.
- PDF: if its text layer has >= 200 characters only the text is sent (no vision tokens); a scanned/image PDF has its first 5 pages rendered (110 dpi) and sent as images. Limit: max 5 pages.
- Images are downscaled and grayscaled before sending.
- Results are cached by hash of model, prompt version, text and images: repeats cost 0.
- The model is chosen by benchmark, not by habit.

## Next steps (not implemented)

- D: global word dictionary across lessons (reuse known terms, skip re-asking the LLM).
- E: A1 frequency pre-filter (drop very common words before the LLM call).

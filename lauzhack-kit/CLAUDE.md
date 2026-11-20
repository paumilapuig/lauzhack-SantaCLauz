# CLAUDE.md — LauzHack 2026 team repo

Hackathon: Sat 21 Nov 12:00 → Sun 22 Nov 12:00. Speed > perfection, but the demo MUST work.
Judges ask what is novel (LauzHack rule 30). Keep `docs/PLAN.md` → "Novelty" section up to date.

## Read first (every session)
1. `docs/PLAN.md`   — what we build, scope, who owns what
2. `docs/API.md`    — the contract between web ↔ api ↔ db. Source of truth.
3. `docs/STATUS.md` — what each person/agent is doing right now

## Stack (do not change without a team decision in docs/PLAN.md)
- `web/`  Next.js (App Router, TypeScript, Tailwind, shadcn/ui). Auth with `@supabase/ssr`.
- `api/`  FastAPI (Python 3.12, managed with `uv`). For ML / data / heavy logic. Verifies the Supabase JWT on every protected route.
- `supabase/` Postgres + Auth (one shared cloud project). Schema changes ONLY via files in `supabase/migrations/`.
- If the idea doesn't need Python, `web/` route handlers can talk to Supabase directly — `api/` stays optional.

## Commands
- web: `cd web && npm run dev` (http://localhost:3000) · `npm run lint` · `npm run build`
- api: `cd api && uv run fastapi dev app/main.py` (http://localhost:8000/docs) · `uv run pytest`
- db:  `npx supabase migration new <name>` · `npx supabase db push` · `npx supabase gen types typescript --linked > web/lib/database.types.ts`

## Ownership (avoid merge conflicts)
| Area | Owner | Paths |
|---|---|---|
| Lead / integration / DB | A | `supabase/`, `docs/`, root config |
| Backend / ML | B | `api/` |
| Frontend core | C | `web/app/`, `web/lib/` |
| UI polish / demo / QA | D | `web/components/`, `DESIGN.md`, pitch |
Touching someone else's area? Keep it minimal and write it in `docs/STATUS.md`.
Only owner A creates DB migrations; others request them in STATUS.

## Git rules
- Never commit to `main`. Branch: `feat/<area>-<thing>` or `fix/<area>-<thing>`.
- Small PRs (< ~300 lines), merge often (target every ~60–90 min). `git pull --rebase origin main` before starting a task.
- Commit messages: `<area>: <what>` (e.g. `web: login page`).
- Never commit secrets. `.env*` files are gitignored; only `*.example` files go in git.

## Team workflow (standard for EVERY feature): spec-driven + test-first
- Features go through `/feature <request>`: explorer (haiku) → planner (opus) writes `docs/specs/<slug>.md`
  → coders (sonnet) implement tasks IN PARALLEL waves, test first → reviewer (sonnet) → `/ship`.
- Superpowers is for brainstorming and debugging; do not start a second planning workflow on top of `/feature`.
- Tiny fixes (< ~20 lines, one file) can skip `/feature`, but still need a test or a playwright-cli check.

## Engineering rules
- SOLID; one responsibility per file and per function. Max **300 lines per file** (a hook enforces it).
- Test first: write the failing test, then the code. web: Vitest/Playwright; api: pytest.
- Explicit over clever: name things for what they do; no hidden magic, no dead code, no commented-out code.
- The AI does exactly what is written: if a requirement isn't in the spec, it doesn't exist. Put it in the spec.

## How to work
- Before coding a non-trivial feature: `/feature` (or `/grill-me` first if the idea is still fuzzy).
- Changing the contract? Update `docs/API.md` FIRST, in its own small PR, then code.
- After finishing a task: run lint/tests, update your line in `docs/STATUS.md`, open a PR with `/ship`.
- UI: follow `DESIGN.md` + the `design-taste-frontend` skill. Before demo: `/unslop` + `web-design-guidelines` audit.
- Verify UI changes in a real browser with `playwright-cli` (screenshot) before saying "done".
- Prefer seed/mock data over blocking on external APIs. A fake-but-working demo path beats a real-but-broken one.

## Don'ts
- Don't add new frameworks/libraries without noting it in PLAN.md.
- Don't run destructive DB commands (`db reset`, `DROP`, `TRUNCATE`) on the shared project.
- Don't read or print `.env` files. Use the `*.example` files to know variable names.

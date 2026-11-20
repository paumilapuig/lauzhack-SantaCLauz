# Prompt per a Claude Code (el lead l'enganxa AVUI, dins del repo, després de bootstrap-lead.sh)

> Model recomanat per a aquest prompt: Opus (`/model`). Després, tothom a Sonnet.

```
You are setting up the base repo for our 4-person team at LauzHack (24h hackathon, starts tomorrow 12:00).
Goal: a GENERIC, working skeleton (no product features yet) so that tomorrow 4 people with 4 Claude Code
agents can work in parallel without stepping on each other. Read CLAUDE.md and docs/*.md first; they are
the rules. Do NOT change the stack.

Build this, in order, committing after each step on branch `chore/skeleton`:

1. web/  — Next.js latest (App Router, TypeScript, Tailwind, ESLint, src-less layout), shadcn/ui initialised
   with button, input, card, dialog, sonner. Supabase auth with @supabase/ssr: browser + server clients in
   web/lib/supabase/, middleware that refreshes the session, /login page (email+password AND magic link),
   /auth/callback route, sign-out, and a protected /dashboard that shows the user's email and calls the
   API's GET /api/me with the access token. Env vars exactly as in web/.env.example.
   Add web/lib/api.ts: a typed fetch wrapper that attaches the Supabase access token.
   Set up Vitest (`npm run test`) with one example unit test for web/lib/api.ts.
   Keep every file under 300 lines (a hook will block you otherwise).

2. api/  — FastAPI with uv (Python 3.12): app/main.py, app/auth.py, app/schemas.py, app/db.py, tests/.
   CORS from CORS_ORIGINS. GET /health (no auth). GET /api/me (auth). Auth dependency verifies the Supabase
   JWT using the project's JWKS endpoint (SUPABASE_URL/auth/v1/.well-known/jwks.json); if the project still
   uses a legacy symmetric secret, fall back to supabase-py `auth.get_user(token)`. One pytest for /health
   and one for 401 without token. Env vars exactly as in api/.env.example.

3. supabase/ — `npx supabase init` if needed, one migration creating `profiles` (as in docs/API.md) with RLS
   policies (own row read/update) + trigger that inserts a profile on auth.users insert, and seed.sql with
   nothing sensitive. Do NOT push the migration; print the command for me to run (`npx supabase link`
   then `npx supabase db push`). Then add the script `npm run db:types` in web/ that regenerates
   web/lib/database.types.ts.

4. Root: README.md with the 5 commands to run everything; a `Makefile` or root package.json scripts
   `dev:web`, `dev:api`; .github/pull_request_template.md (What / How to test / Screenshot / STATUS updated?).

5. Verification (mandatory, don't claim done without it): run lint + build for web and pytest for api.
   Then, once I've filled the .env files, start both servers and use playwright-cli to: open /login,
   sign up a test user, land on /dashboard, screenshot it, and confirm the /api/me call returned 200.
   Report what you verified and anything you could not.

Constraints: keep it minimal and boring — no extra libraries beyond what's listed, no product features,
no styling beyond shadcn defaults (D will apply DESIGN.md tomorrow). Never read .env files.
Ask me before anything destructive. When finished, open a PR to main with /ship.
```

---

## Prompt per arrencar DEMÀ (12:00, tot l'equip davant d'una pantalla, el lead)

```
/grill-me We have 24h at LauzHack. Here is the challenge/track: <enganxa el repte>.
Our idea: <2 frases>. Grill us until we agree on: the one-liner, the 90-second demo path, MUST/NICE/OUT
scope, the novelty statement, which LANGUAGE/stack each part really needs (do we need api/ in Python at all,
or is Next.js + Supabase enough? any ML/data library?), the API endpoints and DB tables we need, and the split between A (db/lead),
B (api/ML), C (web core), D (UI/demo). Ask in rounds. When we're aligned, write docs/PLAN.md and
docs/API.md (following their templates) and propose the first task for each person, sized to ~1h.
```

## Prompt per a cada membre quan comença una tasca

```
/sync <la meva àrea: A|B|C|D>
```
i després:
```
Task: <tasca de STATUS.md>. Stay inside my area's paths (CLAUDE.md → Ownership). If you need a contract
change, stop and tell me first. Plan briefly, implement, verify (tests / playwright-cli screenshot), then /ship.
```

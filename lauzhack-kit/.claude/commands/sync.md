---
description: Get up to date with the team before starting a new task
---
1. `git switch main && git pull --rebase origin main`.
2. Read `docs/PLAN.md`, `docs/API.md`, `docs/STATUS.md`. Summarise in max 5 bullets what changed and who is doing what.
3. If `supabase/migrations` changed: regenerate types (`npx supabase gen types typescript --linked > web/lib/database.types.ts`).
4. If `web/package.json` or `api/pyproject.toml` changed: `npm install` / `uv sync`.
5. Propose my next task based on my area ($ARGUMENTS) and STATUS, then wait for my OK.

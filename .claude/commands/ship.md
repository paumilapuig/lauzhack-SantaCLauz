---
description: Check, commit, push the current branch and open a PR
---
1. Run `git status`. If on `main`, STOP and create a branch `feat/<area>-<short-name>` first.
2. Run the checks for the areas you touched: `cd web && npm run lint && npm run build` and/or `cd api && uv run pytest`. Fix failures before continuing.
3. Make sure no `.env` file or secret is staged.
4. Commit with message `<area>: <what>`.
5. `git pull --rebase origin main`, resolve conflicts if any, re-run checks.
6. `git push -u origin HEAD` and `gh pr create --fill --base main`.
7. Update my line in `docs/STATUS.md` (done + next task) and include it in the PR.
8. Reply with the PR URL and a 2-line summary. $ARGUMENTS

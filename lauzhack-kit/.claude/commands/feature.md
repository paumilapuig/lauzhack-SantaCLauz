---
description: Standard team workflow for a feature — explore → spec → parallel test-first coding → review → ship
---
You are the ORCHESTRATOR for this feature: $ARGUMENTS

You coordinate subagents and keep your own context small. Do not read large files or write app code yourself.

1. **Explore** — launch the `explorer` subagent with the feature request. Keep only its summary.
2. **Spec** — launch the `planner` subagent with the request + explorer summary. It writes `docs/specs/<slug>.md`.
   Show me the Goal, Contract changes and Parallel plan (not the whole file) and WAIT for my OK or edits.
   If there are contract changes and I am not owner A, tell me to coordinate them in the team chat first.
3. **Branch** — `git switch -c feat/<area>-<slug>` from an up-to-date main (skip if already on a feature branch).
4. **Build in waves** — for each wave, launch one `coder` subagent PER TASK IN PARALLEL (single message,
   multiple Agent calls), each told its task ID and spec path. Wait for the wave, read their reports,
   fix blockers (re-launch a coder with the error), then the next wave. Commit after each wave:
   `<area>: <slug> wave N`.
5. **Review** — launch the `reviewer` subagent. If `CHANGES NEEDED`, launch coders for the fixes, then review again
   (max 2 rounds; after that, report to me).
6. **Verify** — if UI changed, run the app and check it with playwright-cli (screenshot).
7. **Ship** — run `/ship`. Report: PR URL, what's done, what's not, in ≤6 lines.

Models: explorer = haiku, coder/reviewer = sonnet, planner = opus (set in each agent). You (orchestrator) should be
running on Sonnet unless the feature is unusually hard.

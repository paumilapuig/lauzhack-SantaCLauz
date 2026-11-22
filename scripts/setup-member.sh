#!/usr/bin/env bash
# Run by EVERY member (lead included), from the repo root, after cloning.
set -euo pipefail
say() { printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }
need() { command -v "$1" >/dev/null 2>&1; }

say "Checking tools"
need git    || { echo "❌ install git"; exit 1; }
need node   || { echo "❌ install Node 20+ (https://nodejs.org)"; exit 1; }
need gh     || echo "⚠️  install GitHub CLI: https://cli.github.com  then: gh auth login"
need claude || { echo "Installing Claude Code…"; curl -fsSL https://claude.ai/install.sh | bash; }
need uv     || { echo "Installing uv (Python)…"; curl -LsSf https://astral.sh/uv/install.sh | sh; }

need jq || { echo "Installing jq…"; if need brew; then brew install jq; elif need winget; then winget install jqlang.jq; else echo "❌ install jq: https://jqlang.org/download"; fi; }

say "Status line (model · context · 5h/7d Pro limits)"
mkdir -p ~/.claude
cp scripts/statusline.sh ~/.claude/statusline-command.sh && chmod +x ~/.claude/statusline-command.sh
SETTINGS=~/.claude/settings.json
[[ -f $SETTINGS ]] || echo '{}' > "$SETTINGS"
if need jq; then
  tmp=$(mktemp) && jq '.statusLine = {"type":"command","command":"bash ~/.claude/statusline-command.sh"}' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
  echo "statusLine added to $SETTINGS"
fi

say "Browser automation CLI for agents"
npm install -g @playwright/cli@latest
playwright-cli install-browser || npx playwright install chromium

say "Env files (fill values from the team's private channel — NEVER commit them)"
bash scripts/demo-env.sh

say "Install deps (if the app is already scaffolded)"
[[ -f web/package.json ]] && (cd web && npm install) || true
[[ -f api/pyproject.toml ]] && (cd api && uv sync) || true

cat <<'EOF'

Last steps (inside Claude Code, run `claude` in the repo root):
  1. Accept the "trust this folder" prompt → it will offer to install Superpowers + Caveman plugins: accept.
  2. /mcp  → select "supabase" → Authenticate (log in with the Supabase account the lead invited).
  3. /skills  (or ask "what skills do you have?") → should list grill-me, design-taste-frontend, unslop, playwright-cli…
  4. /model → Sonnet for normal work; Opus only for planning/hard bugs (saves Pro limits).
EOF

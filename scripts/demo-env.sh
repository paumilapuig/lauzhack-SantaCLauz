#!/usr/bin/env bash
# Fills web/.env.local and api/.env so the demo runs on this laptop. Run from the repo root:
#   bash scripts/demo-env.sh
# Safe to re-run: a variable that already has a value is never changed.
# Public values come from the *.env.example files. Secrets are asked for (paste them from the team chat)
# or read from the environment, e.g.  SUPABASE_SECRET_KEY=... OPENROUTER_API_KEY=... bash scripts/demo-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SECRETS=(SUPABASE_SECRET_KEY OPENROUTER_API_KEY)

is_secret() { local name; for name in "${SECRETS[@]}"; do [[ $name == "$1" ]] && return 0; done; return 1; }

current_value() { grep -E "^$1=" "$2" | tail -n 1 | cut -d= -f2- || true; }

set_value() {
  local name=$1 value=$2 file=$3 tmp
  tmp=$(mktemp)
  grep -vE "^$name=" "$file" > "$tmp" || true
  printf '%s=%s\n' "$name" "$value" >> "$tmp"
  mv "$tmp" "$file"
}

ask_secret() {
  local name=$1 value=${!1:-}
  if [[ -z $value && -t 0 ]]; then
    read -r -s -p "  $name (paste from the team chat, Enter to skip): " value
    echo >&2
  fi
  printf '%s' "$value"
}

fill() {
  local example=$1 target=$2 line name value
  [[ -f $target ]] || touch "$target"
  echo "▶ $target"
  while IFS= read -r line <&3; do
    [[ $line =~ ^([A-Z_][A-Z0-9_]*)=(.*)$ ]] || continue
    name=${BASH_REMATCH[1]}
    value=${BASH_REMATCH[2]}
    [[ -n $(current_value "$name" "$target") ]] && { echo "  $name: kept"; continue; }
    is_secret "$name" && value=$(ask_secret "$name")
    if [[ -z $value ]]; then
      is_secret "$name" && echo "  ⚠️  $name: still empty" || true
      grep -qE "^$name=" "$target" || printf '%s=\n' "$name" >> "$target"
      continue
    fi
    set_value "$name" "$value" "$target"
    echo "  $name: set"
  done 3< "$example"
}

fill web/.env.example web/.env.local
fill api/.env.example api/.env

cat <<'EOF'

Done. Start the demo (two terminals, repo root):
  npm run dev:api    # http://localhost:8000/docs
  npm run dev:web    # http://localhost:3000
Without SUPABASE_SECRET_KEY the API cannot start; without OPENROUTER_API_KEY there are no lesson
glossaries, concept summaries or translations (and no visible error).
EOF

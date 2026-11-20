#!/usr/bin/env bash
# Run ONCE by the team lead, from the repo root, after copying the kit in.
# Installs the shared skills INTO the repo (.claude/skills) so everyone gets them with `git pull`.
# Usage: SUPABASE_REF=abcd1234 DESIGN_REF=linear bash scripts/bootstrap-lead.sh
set -euo pipefail

REF="${SUPABASE_REF:-}"
DESIGN_REF="${DESIGN_REF:-linear}"   # any folder name from github.com/VoltAgent/awesome-design-md/tree/main/design-md

say() { printf "\n\033[1;36m▶ %s\033[0m\n" "$1"; }
skill() { npx -y skills add "$1" --skill "$2" --agent claude-code -y || echo "⚠️  skill $2 from $1 failed — try: npx skills add $1 --list"; }

say "1/5 Supabase project ref in .mcp.json"
if [[ -n "$REF" ]]; then
  sed -i.bak "s/YOUR_PROJECT_REF/$REF/g" .mcp.json web/.env.example api/.env.example && rm -f .mcp.json.bak web/.env.example.bak api/.env.example.bak
else
  echo "SUPABASE_REF not set → edit YOUR_PROJECT_REF in .mcp.json by hand later"
fi

say "2/5 Planning / workflow skills"
skill mattpocock/skills grilling        # grill-me needs grilling
skill mattpocock/skills grill-me

say "3/5 Design skills"
skill https://github.com/Leonxlnx/taste-skill design-taste-frontend
skill https://github.com/Leonxlnx/imagegen-skills image-to-code
skill vercel-labs/agent-skills web-design-guidelines
# unslop (UI version: turns AI-looking UI into designed UI)
tmp=$(mktemp -d) && git clone --depth 1 https://github.com/heydamir/unslop "$tmp/unslop" \
  && mkdir -p .claude/skills && cp -r "$tmp/unslop/skills/unslop" .claude/skills/ \
  || echo "⚠️  unslop clone failed"
rm -rf "$tmp"

say "4/5 Browser testing + optional SEO"
skill microsoft/playwright-cli playwright-cli
skill coreyhaines31/marketingskills seo-audit   # optional, only matters for a public landing page

say "5/5 DESIGN.md ($DESIGN_REF) from awesome-design-md"
for p in "design-md/$DESIGN_REF/DESIGN.md" "design-md/$DESIGN_REF.app/DESIGN.md"; do
  if curl -fsSL "https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/$p" -o DESIGN.md; then echo "DESIGN.md ← $p"; break; fi
done
[[ -s DESIGN.md ]] || echo "⚠️  DESIGN.md not downloaded — pick one manually at getdesign.md and save as ./DESIGN.md"

say "Done. Check what got installed:"
ls -la .claude/skills 2>/dev/null || true
ls -la .agents/skills 2>/dev/null || true
cat <<'EOF'

If .claude/skills contains SYMLINKS into .agents/skills, commit BOTH folders.
(Windows teammates: replace symlinks with real copies: cp -rL .agents/skills/* .claude/skills/)

Next:
  git add -A && git commit -m "chore: team kit + skills" && git push
  claude      # then paste PROMPT-scaffold.md
EOF

#!/bin/bash
# PostToolUse hook: after Claude edits/writes a code file, warn it if the file is over 300 lines.
# Exit code 2 sends the message back to Claude so it splits the file.
MAX=300
input=$(cat)
f=$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$f" ] || [ ! -f "$f" ] && exit 0
case "$f" in
  *.md|*.json|*.lock|*.sql|*.css|*.svg|*.txt|*.yaml|*.yml|*.toml|*database.types.ts|*/node_modules/*|*/.next/*|*/migrations/*) exit 0 ;;
esac
n=$(wc -l < "$f" | tr -d ' ')
if [ "$n" -gt "$MAX" ]; then
  echo "File $f has $n lines (team limit: $MAX). Split it by responsibility (SOLID) into smaller modules before continuing." >&2
  exit 2
fi
exit 0

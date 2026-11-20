#!/bin/bash
# Claude Code status line: model · context % · 5h limit (+reset) · 7d limit.
# Original by Paula Rosa. Needs jq. Installed by scripts/setup-member.sh to ~/.claude/statusline-command.sh
export LC_ALL=C
input=$(cat)

MODEL=$(echo "$input"  | jq -r '.model.display_name')
THINK=$(echo "$input"  | jq -r '.thinking.enabled // false')
PCT=$(echo "$input"    | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
FIVE_H=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
FIVE_R=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
WEEK=$(echo "$input"   | jq -r '.rate_limits.seven_day.used_percentage // empty')

DIM='\033[2m'; BOLD='\033[1m'
CYAN='\033[36m'; MAGENTA='\033[35m'; GREEN='\033[32m'
YELLOW='\033[33m'; RED='\033[31m'; GREY='\033[90m'; RESET='\033[0m'
S="  ${GREY}│${RESET}  "

bar() {
  local p=$1 w=10 c
  if   [ "$p" -ge 90 ]; then c="$RED"
  elif [ "$p" -ge 70 ]; then c="$YELLOW"
  else c="$GREEN"; fi
  local filled=$(( (p * w + 50) / 100 ))
  [ "$filled" -gt "$w" ] && filled=$w
  local empty=$(( w - filled )) out="" i
  for ((i=0; i<filled; i++)); do out="$out█"; done
  for ((i=0; i<empty;  i++)); do out="$out${GREY}░"; done
  printf '%b' "${c}${out}${RESET}"
}

LINE="${BOLD}${CYAN}🤖 ${MODEL}${RESET}"
[ "$THINK" = "true" ] && LINE="$LINE 🧠"
LINE="$LINE$S💬 ${BOLD}${CYAN}ctx${RESET} $(bar "$PCT") ${DIM}${PCT}%${RESET}"

if [ -n "$FIVE_H" ]; then
  H=$(printf '%.0f' "$FIVE_H")
  Q="$S⏳ ${BOLD}${YELLOW}5h${RESET} $(bar "$H") ${DIM}${H}%${RESET}"
  if [ -n "$FIVE_R" ]; then
    LEFT=$(( FIVE_R - $(date +%s) ))
    [ "$LEFT" -gt 0 ] && Q="$Q ${GREY}$((LEFT/3600))h$(((LEFT%3600)/60))m${RESET}"
  fi
  LINE="$LINE$Q"
fi

[ -n "$WEEK" ] && { W=$(printf '%.0f' "$WEEK"); LINE="$LINE$S📅 ${BOLD}${MAGENTA}7d${RESET} $(bar "$W") ${DIM}${W}%${RESET}"; }

echo -e "$LINE"

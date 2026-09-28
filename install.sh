#!/usr/bin/env bash
# Install the icpc-bsu-slides skill.
#   curl -fsSL https://raw.githubusercontent.com/ABDELWAHABx/icpc-bsu-slides/main/install.sh | bash -s -- claude
# Agents: claude | codex | antigravity | all | <custom skills dir>
set -euo pipefail
REPO="https://github.com/ABDELWAHABx/icpc-bsu-slides.git"
TARGET="${1:-claude}"

dir_for() {
  case "$1" in
    claude)      echo "$HOME/.claude/skills" ;;
    codex)       echo "${CODEX_HOME:-$HOME/.codex}/skills" ;;
    antigravity) echo "$HOME/.gemini/antigravity/skills" ;;
    *)           echo "$1" ;;
  esac
}

install_to() {
  local base; base="$(dir_for "$1")"
  local dest="$base/icpc-bsu-slides"
  mkdir -p "$base"
  if [ -d "$dest/.git" ]; then
    echo "↻ updating $dest"; git -C "$dest" pull --ff-only
  else
    echo "↓ installing to $dest"; git clone --depth 1 "$REPO" "$dest"
  fi
  (cd "$dest" && npm install --no-fund --no-audit --silent)
  echo "✓ icpc-bsu-slides ready in $dest"
}

command -v git >/dev/null || { echo "✗ git is required"; exit 1; }
command -v node >/dev/null || { echo "✗ Node.js 18+ is required (https://nodejs.org)"; exit 1; }

if [ "$TARGET" = "all" ]; then
  for a in claude codex antigravity; do install_to "$a"; done
else
  install_to "$TARGET"
fi
echo "Needs Google Chrome or Microsoft Edge installed (used headless to render slides)."

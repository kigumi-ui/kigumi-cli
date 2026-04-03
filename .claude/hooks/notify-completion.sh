#!/bin/bash
# Claude Code Stop Hook — macOS Task Completion Notification
#
# Fires a macOS notification when Claude finishes a task where source files
# changed. Runs AFTER stop-quality-check.sh (ordered second in settings).
# If the quality check blocked, this hook does not fire for that stop cycle.
set -uo pipefail

INPUT=$(cat)

# Skip if in a stop hook loop
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$CLAUDE_PROJECT_DIR")"

# Only notify if actual work was done (source files changed)
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null)
CHANGED_FILES=$(echo "$CHANGED_FILES" | sort -u)

HAS_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^(src/|templates/|scripts/|tests/|docs/)' || true)
if [ -z "$HAS_CHANGES" ]; then
  exit 0
fi

# Fire macOS notification
osascript -e 'display notification "Quality checks passed. Ready for review." with title "Kigumi" subtitle "Claude Code"' 2>/dev/null || true

exit 0

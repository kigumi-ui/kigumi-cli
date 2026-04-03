#!/bin/bash
# Claude Code PreToolUse Hook — Guardrails
#
# Intercepts dangerous tool calls before execution.
# Reads JSON from stdin with tool_name and tool_input fields.
# Outputs a deny decision to block, or nothing to allow.
#
# Must be fast (<100ms) — no pnpm/node calls, just jq + grep.
set -uo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
BASH_CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

deny() {
  local reason="$1"
  local reason_json
  reason_json=$(printf '%s' "$reason" | jq -Rs .)
  cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":${reason_json}}}
EOF
  exit 0
}

# --- Bash tool guardrails ---
if [ "$TOOL_NAME" = "Bash" ]; then

  # Block git push (Claude should never push without explicit user request)
  if echo "$BASH_CMD" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+push'; then
    deny "git push is not allowed. Ask the user explicitly before pushing to any remote."
  fi

  # Block destructive git operations
  if echo "$BASH_CMD" | grep -qE 'git[[:space:]]+reset[[:space:]]+--hard'; then
    deny "git reset --hard is destructive. Ask the user explicitly before discarding changes."
  fi

  if echo "$BASH_CMD" | grep -qE 'git[[:space:]]+checkout[[:space:]]+\.$'; then
    deny "git checkout . discards all working directory changes. Ask the user before proceeding."
  fi

  # Block rm -rf on critical paths
  if echo "$BASH_CMD" | grep -qE 'rm[[:space:]]+-[rRf]*r[fF]*[[:space:]]' || \
     echo "$BASH_CMD" | grep -qE 'rm[[:space:]]+-[fF]*r'; then
    if echo "$BASH_CMD" | grep -qE '(\.git|\.claude|/src[[:space:]]|/src$|"/"| \./[[:space:]]| \.\/$| ~/| /\s)'; then
      deny "rm -rf on critical directories (.git/, .claude/, src/, root) is not allowed."
    fi
  fi

fi

# --- Edit/Write tool guardrails ---
if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ]; then

  # Block writes to CI/CD workflows
  if echo "$FILE_PATH" | grep -qE '\.github/workflows/'; then
    deny "Editing .github/workflows/ files requires explicit user permission."
  fi

  # Block writes to .env files
  if echo "$FILE_PATH" | grep -qE '(^|/)\.env(\.[^/]*)?$'; then
    deny "Editing .env files is not allowed. Secrets must be managed by the user."
  fi

fi

# Allow by default (no output = allow)
exit 0

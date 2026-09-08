#!/bin/bash
# Claude Code PreToolUse Hook — Guardrails
#
# Intercepts dangerous tool calls before execution.
# Reads JSON from stdin with tool_name and tool_input fields.
# Outputs a deny decision to block, or nothing to allow.
#
# Must be fast (<100ms) — no pnpm/node calls, just jq + grep, plus two
# `git rev-parse` calls for the branch guard (measured ~29ms combined).
set -uo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
BASH_CMD_RAW=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Only check the first line, strip quoted strings to avoid false positives
# (e.g., "git reset --hard" inside a PR body, commit message, or heredoc)
# Real dangerous commands are single-line; heredoc/argument content is on line 2+.
BASH_CMD=$(printf '%s' "$BASH_CMD_RAW" | head -1 | sed "s/'[^']*'//g" | sed 's/"[^"]*"//g')

deny() {
  local reason="$1"
  local reason_json
  reason_json=$(printf '%s' "$reason" | jq -Rs .)
  cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":${reason_json}}}
EOF
  exit 0
}

# --- Default-branch guard ---
#
# CLAUDE.md requires feature work to happen in a git worktree under
# .claude/worktrees/, never directly on the default branch. Nothing enforced
# that, so the rule held only as long as someone remembered it.
#
# Scope: file-modifying tools and commits. Reads are always allowed, so
# inspecting the repo on main still works.
#
# Escape hatch: KIGUMI_ALLOW_MAIN=1. The release flow legitimately commits on
# main (changesets version bumps), and a guard with no way out gets disabled
# rather than used.
on_default_branch() {
  # The branch name alone is sufficient, because git refuses to check out a
  # branch that is already checked out elsewhere: a worktree of this repo can
  # never be on main while the main checkout is. A `--detach` worktree reports
  # "HEAD" rather than a branch name, so it is exempt too.
  #
  # An explicit gitdir-vs-common-dir worktree test was tried here and removed:
  # bug injection showed no input could make it change the outcome, and a check
  # that cannot fail is the thing this repo keeps having to delete.
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || return 1
  [ "$branch" = "main" ] || [ "$branch" = "master" ]
}

deny_default_branch() {
  deny "You are on the default branch ($1). CLAUDE.md requires feature work in a git worktree: git worktree add .claude/worktrees/<branch-name> -b <branch-name>. Set KIGUMI_ALLOW_MAIN=1 to override (the release flow does)."
}

if [ "${KIGUMI_ALLOW_MAIN:-0}" != "1" ]; then
  if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "NotebookEdit" ]; then
    if on_default_branch; then
      deny_default_branch "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
    fi
  fi

  if [ "$TOOL_NAME" = "Bash" ] && echo "$BASH_CMD" | grep -qE 'git[[:space:]]+commit'; then
    if on_default_branch; then
      deny_default_branch "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
    fi
  fi
fi

# --- Bash tool guardrails ---
if [ "$TOOL_NAME" = "Bash" ]; then

  # Block force-push to main/master (regular push is allowed)
  if echo "$BASH_CMD" | grep -qE 'git[[:space:]]+push[[:space:]]+.*--force' || \
     echo "$BASH_CMD" | grep -qE 'git[[:space:]]+push[[:space:]]+-f'; then
    if echo "$BASH_CMD" | grep -qE '(main|master)'; then
      deny "Force-pushing to main/master is not allowed."
    fi
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

  # Block writes to .env files
  if echo "$FILE_PATH" | grep -qE '(^|/)\.env(\.[^/]*)?$'; then
    deny "Editing .env files is not allowed. Secrets must be managed by the user."
  fi

fi

# Allow by default (no output = allow)
exit 0

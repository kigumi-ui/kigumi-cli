#!/bin/bash
# Claude Code Stop Hook — Quality Feedback Loop
#
# Runs after Claude finishes responding. If source files changed,
# runs type-check, lint, and validators. Blocks Claude from stopping
# if any check fails, feeding errors back as a prompt to fix.
set -uo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$CLAUDE_PROJECT_DIR")"

# Read stdin (hook input JSON)
INPUT=$(cat)

# Prevent infinite loops: if this is already a continued stop, allow it
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# Check for file changes (staged + unstaged vs HEAD)
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null)
CHANGED_FILES=$(echo "$CHANGED_FILES" | sort -u)

if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

# Only run checks if source/template/test files changed
HAS_SRC_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^(src/|templates/|scripts/|tests/)' || true)
if [ -z "$HAS_SRC_CHANGES" ]; then
  exit 0
fi

ERRORS=""

# 1. Type check (fastest, catches most issues)
TC_OUTPUT=$(pnpm type-check 2>&1) || ERRORS="${ERRORS}--- TypeScript Errors ---\n${TC_OUTPUT}\n\n"

# 2. Lint
LINT_OUTPUT=$(pnpm lint 2>&1) || ERRORS="${ERRORS}--- ESLint Errors ---\n${LINT_OUTPUT}\n\n"

# 3. Validate changes (AI guard rails)
VC_OUTPUT=$(pnpm validate:changes 2>&1) || ERRORS="${ERRORS}--- Validation Errors (validate:changes) ---\n${VC_OUTPUT}\n\n"

# 4. Validate registry (only if registry files changed)
if echo "$CHANGED_FILES" | grep -q 'registry'; then
  VR_OUTPUT=$(pnpm validate:registry 2>&1) || ERRORS="${ERRORS}--- Registry Validation Errors ---\n${VR_OUTPUT}\n\n"
fi

# 5. Validate templates (only if templates/ changed)
if echo "$CHANGED_FILES" | grep -q 'templates/'; then
  VT_OUTPUT=$(pnpm validate:templates 2>&1) || ERRORS="${ERRORS}--- Template Validation Errors ---\n${VT_OUTPUT}\n\n"
fi

# 6. Unit tests (only if src/ or tests/ changed)
if echo "$CHANGED_FILES" | grep -qE '^(src/|tests/)'; then
  TEST_OUTPUT=$(pnpm test 2>&1) || ERRORS="${ERRORS}--- Unit Test Failures ---\n${TEST_OUTPUT}\n\n"
fi

if [ -n "$ERRORS" ]; then
  REASON=$(printf "Quality checks failed. Please fix these errors:\n\n%b" "$ERRORS")
  # Escape for JSON
  REASON_JSON=$(echo "$REASON" | jq -Rs .)
  echo "{\"decision\": \"block\", \"reason\": ${REASON_JSON}}"
  exit 0
fi

# All checks passed — allow Claude to stop
exit 0

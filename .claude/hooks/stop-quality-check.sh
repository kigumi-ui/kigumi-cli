#!/bin/bash
# Claude Code Stop Hook — Quality Feedback Loop
#
# Runs after Claude finishes responding. If source files changed,
# runs type-check, lint, and validators. Blocks Claude from stopping
# if any check fails, feeding errors back as a prompt to fix.
#
# Checks run in parallel where possible for speed.
set -uo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$CLAUDE_PROJECT_DIR")"
cd "$PROJECT_ROOT"

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

# Detect which areas changed
HAS_SRC_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^(src/|templates/|scripts/|tests/)' || true)
HAS_DOCS_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^docs/(src/|\.storybook/)' || true)

if [ -z "$HAS_SRC_CHANGES" ] && [ -z "$HAS_DOCS_CHANGES" ]; then
  exit 0
fi

ERRORS=""
TMPDIR_HOOKS=$(mktemp -d)

# Cleanup on exit: kill background jobs + remove temp dir
cleanup() {
  kill "${TC_PID:-}" "${LINT_PID:-}" "${VC_PID:-}" "${TC_DOCS_PID:-}" "${TEST_PID:-}" 2>/dev/null
  rm -rf "$TMPDIR_HOOKS"
}
trap cleanup EXIT

# --- Parallel checks ---

if [ -n "$HAS_SRC_CHANGES" ]; then
  pnpm type-check >"$TMPDIR_HOOKS/tc.out" 2>&1 &
  TC_PID=$!

  pnpm lint >"$TMPDIR_HOOKS/lint.out" 2>&1 &
  LINT_PID=$!

  pnpm validate:changes >"$TMPDIR_HOOKS/vc.out" 2>&1 &
  VC_PID=$!
fi

if [ -n "$HAS_DOCS_CHANGES" ]; then
  (cd "$PROJECT_ROOT/docs" && ./node_modules/.bin/tsc -p tsconfig.app.json) >"$TMPDIR_HOOKS/tc_docs.out" 2>&1 &
  TC_DOCS_PID=$!
fi

if echo "$CHANGED_FILES" | grep -qE '^(src/|tests/)'; then
  pnpm test >"$TMPDIR_HOOKS/test.out" 2>&1 &
  TEST_PID=$!
fi

# --- Wait and collect errors ---

if [ -n "${TC_PID:-}" ]; then
  wait "$TC_PID" || ERRORS="${ERRORS}--- TypeScript Errors ---\n$(cat "$TMPDIR_HOOKS/tc.out")\n\n"
fi

if [ -n "${LINT_PID:-}" ]; then
  wait "$LINT_PID" || ERRORS="${ERRORS}--- ESLint Errors ---\n$(cat "$TMPDIR_HOOKS/lint.out")\n\n"
fi

if [ -n "${VC_PID:-}" ]; then
  wait "$VC_PID" || ERRORS="${ERRORS}--- Validation Errors (validate:changes) ---\n$(cat "$TMPDIR_HOOKS/vc.out")\n\n"
fi

if [ -n "${TC_DOCS_PID:-}" ]; then
  wait "$TC_DOCS_PID" || ERRORS="${ERRORS}--- Docs TypeScript Errors ---\n$(cat "$TMPDIR_HOOKS/tc_docs.out")\n\n"
fi

if [ -n "${TEST_PID:-}" ]; then
  wait "$TEST_PID" || ERRORS="${ERRORS}--- Unit Test Failures ---\n$(cat "$TMPDIR_HOOKS/test.out")\n\n"
fi

# --- Sequential conditional checks (fast, file-scoped) ---

if echo "$CHANGED_FILES" | grep -q 'registry'; then
  VR_OUTPUT=$(pnpm validate:registry 2>&1) || ERRORS="${ERRORS}--- Registry Validation Errors ---\n${VR_OUTPUT}\n\n"
fi

if echo "$CHANGED_FILES" | grep -q 'templates/'; then
  VT_OUTPUT=$(pnpm validate:templates 2>&1) || ERRORS="${ERRORS}--- Template Validation Errors ---\n${VT_OUTPUT}\n\n"
fi

if echo "$CHANGED_FILES" | grep -qE 'AGENTS\.md|registry\.ts|tests/unit/'; then
  VA_OUTPUT=$(pnpm validate:agents 2>&1) || ERRORS="${ERRORS}--- AGENTS.md Validation Errors ---\n${VA_OUTPUT}\n\n"
fi

# --- Report ---

if [ -n "$ERRORS" ]; then
  REASON=$(printf "Quality checks failed. Please fix these errors:\n\n%b" "$ERRORS")
  REASON_JSON=$(echo "$REASON" | jq -Rs .)
  echo "{\"decision\": \"block\", \"reason\": ${REASON_JSON}}"
  exit 0
fi

# All checks passed
exit 0

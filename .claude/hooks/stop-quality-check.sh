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
HAS_TEST_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^tests/' || true)
HAS_DOCS_CHANGES=$(echo "$CHANGED_FILES" | grep -E '^docs/(src/|\.storybook/)' || true)

if [ -z "$HAS_SRC_CHANGES" ] && [ -z "$HAS_DOCS_CHANGES" ]; then
  exit 0
fi

ERRORS=""
TMPDIR_HOOKS=$(mktemp -d)

# Cleanup on exit: kill background jobs + remove temp dir
cleanup() {
  kill "${TC_PID:-}" "${LINT_PID:-}" "${VC_PID:-}" "${TC_DOCS_PID:-}" "${TEST_PID:-}" "${CT_PID:-}" "${MB_PID:-}" 2>/dev/null
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

# Dedicated tests/ type-check — only on the tests-only fast path. When src
# also changed, TC_PID's `pnpm type-check` already chains `check:tests`, so
# running it again here would double the work for no extra coverage.
if [ -n "$HAS_TEST_CHANGES" ] && [ -z "$HAS_SRC_CHANGES" ]; then
  pnpm check:tests >"$TMPDIR_HOOKS/ct.out" 2>&1 &
  CT_PID=$!

  # Mock budget runs alongside the tests-only fast path. CI sets
  # MOCK_BUDGET_ENFORCE=1 to enforce the gate; locally we only surface
  # the report when it fails (script exits 0 without enforcement).
  pnpm check:mocks >"$TMPDIR_HOOKS/mb.out" 2>&1 &
  MB_PID=$!
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

if [ -n "${CT_PID:-}" ]; then
  wait "$CT_PID" || ERRORS="${ERRORS}--- Tests Type-check Errors ---\n$(cat "$TMPDIR_HOOKS/ct.out")\n\n"
fi

if [ -n "${MB_PID:-}" ]; then
  wait "$MB_PID" || ERRORS="${ERRORS}--- Mock Budget ---\n$(cat "$TMPDIR_HOOKS/mb.out")\n\n"
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

# Any file that names a Web Awesome version. Missing one location ships a
# split-brain pin, and a missing VERSION_MAP entry makes `upgrade` downgrade.
if echo "$CHANGED_FILES" | grep -qE 'package\.json|kigumi\.config\.json|constants\.ts|version-map\.ts'; then
  WP_OUTPUT=$(pnpm validate:wa-pins 2>&1) || ERRORS="${ERRORS}--- Web Awesome Pin Errors ---\n${WP_OUTPUT}\n\n"
fi

# --- Report ---

if [ -n "$ERRORS" ]; then
  REASON=$(printf "Quality checks failed. Please fix these errors:\n\n%b" "$ERRORS")
  REASON_JSON=$(echo "$REASON" | jq -Rs .)
  echo "{\"decision\": \"block\", \"reason\": ${REASON_JSON}}"
  exit 0
fi

# --- Phase 2 backlog-bankruptcy: weekly state-file freshness reminder ---
# Opt-out via KIGUMI_SKIP_FRESHNESS=1. Silent on weekends, when state-file
# was touched in the last 14 days, or when the current session has fewer
# than 2 commits in the last hour (the >=2-commit threshold filters out
# trivial single-edit sessions).
if [ -z "${KIGUMI_SKIP_FRESHNESS:-}" ]; then
  day_of_week=$(date +%u)
  if [ "$day_of_week" -le 5 ]; then
    initiatives_file="docs/superpowers/state/INITIATIVES.md"
    if [ -f "$initiatives_file" ]; then
      last_touch=$(git log -1 --format=%ct -- "$initiatives_file" 2>/dev/null || echo 0)
      now=$(date +%s)
      days_stale=$(( (now - last_touch) / 86400 ))
      session_commits=$(git log --since="1 hour ago" --oneline 2>/dev/null | wc -l | tr -d ' ')
      if [ "$days_stale" -gt 14 ] && [ "$session_commits" -ge 2 ]; then
        echo "📋 Weekly state-review overdue (last INITIATIVES.md update: ${days_stale} days ago). Run /weekly-review when convenient." >&2
      fi
    fi
  fi
fi

# All checks passed
exit 0

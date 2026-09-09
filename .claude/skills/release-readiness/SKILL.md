---
name: release-readiness
description: >
  Run all pre-release gates, then produce a Go/No-Go report. Use this
  skill before tagging a release, when the user asks whether a version is
  ready, or when the user wants a pre-flight check before releasing.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write
---

# Release Readiness

Aggregates the full validation suite into a single Go/No-Go decision. Output: a markdown report written to `.claude/reports/release-readiness-YYYY-MM-DD.md` (gitignored working state) plus a terminal summary.

## Before you start

1. **Branch.** Confirm you are on a feature branch (not `main`). If on main, suggest a worktree.
2. **Working tree.** Confirm `git status` shows a clean tree, or no uncommitted work that should be in the report.
3. **Variant.** Ask the user whether to run the full suite (~10-15 min) or `--quick` (skips e2e; ~2-3 min).

## Step 1: Run the gate runner

For the full run:

```bash
pnpm release-readiness
```

For a fast pre-check:

```bash
pnpm release-readiness:quick
```

Both invocations:

- Run all gates (build, type-check, lint, test:coverage, test:integration, validate:all, pack-smoke; plus test:e2e for the full run, which already covers the starter snapshot tests).
- Count unreleased changesets in `.changeset/`.
- Compare `package.json` version against the last git tag.
- Render a markdown report.
- Write to `.claude/reports/release-readiness-YYYY-MM-DD.md` (or append HHMM suffix if a report for today already exists).
- Print the report path and the GO / NO-GO decision to stderr; markdown content (in dry-run mode) goes to stdout.

The script exits 0 on GO, exits 1 on NO-GO, exits 2 on usage error.

## Step 2: Show the report path and decision

After the script returns, point the user at the report:

```bash
ls -t .claude/reports/release-readiness-*.md | head -1
```

Read and summarize the decision:

- **GO**: All gates passed, ≥1 changeset is pending, version > last tag. Tagging is safe.
- **NO-GO**: Read the numbered reasons from the report. Suggest the next action for each (e.g., "no unreleased changesets" → "write a changeset for the pending work").

## What this skill does NOT do

- It does not tag, push, or publish. The existing `release` skill handles that workflow once a `GO` report is committed.
- It does not edit changesets or `package.json`. Mismatches are flagged, not fixed.
- It does not auto-fix gate failures. Fix the underlying issue and re-run.

## When to re-run

- After fixing any flagged gate.
- Before invoking the `release` skill (always).

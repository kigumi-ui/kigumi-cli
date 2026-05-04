# Backlog-Bankruptcy Phase 2: Skills Design Spec

> Design and ship the three Phase 2 deliverables from the masterplan: a `release-readiness` skill that aggregates pnpm gates with state-file meta-checks into a Go/No-Go report, a `triage-finding` skill that evaluates the 3-criteria new-finding rule and drafts the appropriate entry, and a stop-hook freshness reminder that nudges weekly state-file reviews.

**Type:** New skills + hook addition
**Status:** Draft
**Author:** Mischa
**Date:** 2026-05-04
**Initiative:** `backlog-bankruptcy` (Phase 2 of the masterplan)
**Branched from:** main (worktree at `.claude/worktrees/ft/backlog-bankruptcy-phase2`)
**Depends on:** Phase 1 (PR #153 merged 2026-05-03; establishes state-files convention and 3-criteria new-finding rule)
**Blocks:** v0.20.0 release confidence (Phase 5 spec consumes the `release-readiness` output)

## Context

The Backlog-Bankruptcy masterplan ([`2026-05-03-backlog-bankruptcy-masterplan-design.md`](2026-05-03-backlog-bankruptcy-masterplan-design.md)) Section 5 outlines two new skills and one routine adjustment, deferring detailed design to a follow-up spec. This is that spec.

Phase 1 shipped (PR #153) and established:

- `docs/superpowers/state/INITIATIVES.md` as the cross-initiative master dashboard.
- Per-initiative state-files as the primary work-tracking mechanism.
- The 3-criteria new-finding rule: (1) not fixable in same PR, (2) blocks v0.20.0 / active feature / test-layer completeness, (3) at least medium severity. Findings that fail all three become PR-description "out-of-scope notes" instead of tracked entries.

Two pieces of new tooling formalize and operationalize Phase 1's conventions:

- **`release-readiness`** turns the question "is v0.20.0 ready?" into a runnable command with auditable, dated output.
- **`triage-finding`** turns the 3-criteria rule from a memorized convention into an executable workflow that produces ready-to-paste drafts.
- **Weekly review** ensures state-files don't go stale silently.

## Goals

- Convert pre-release validation from "run a mental checklist" to a single skill-invocation that produces a committable Go/No-Go report.
- Convert finding triage from "remember the 3-criteria rule" to an executable evaluation that drafts the correct artifact (state-file entry, PR-note, or wontfix acknowledgement).
- Surface state-file staleness via a low-touch reminder, without remote-agent or cron overhead.
- Ship all three deliverables as testable, maintainable code (TS scripts with Vitest unit tests), not as fragile bash heredocs.
- Establish a reusable parser for `state/*.md` that release-readiness, weekly-review, and any future tooling can share.

## Non-Goals

- CI integration (`workflow_dispatch` for `release-readiness` in GitHub Actions). Defer until v0.20.0+1 if needed.
- Coverage trending charts. Outside skill scope.
- Slack / GitHub-issue posting. Solo-repo scope.
- `/schedule` cron variant for weekly-review. Stop-hook covers the trigger; cron can be added later without skill changes.
- Auto-write to state-files. `triage-finding` produces drafts; the user applies them. Auto-apply was rejected during brainstorming.
- `kigumi initiatives status` CLI subcommand. The shared parser stays in `scripts/`, not `src/utils/`. Promotable later if a second consumer materializes.

## Implementation Approach

Skill = orchestrator (Markdown, prompts, decisions). Script = mechanical, testable logic (parsing, spawning pnpm, rendering markdown). Hook = one additive bash block.

This matches the existing pattern: `scripts/coverage-all.ts`, `scripts/check-tests-baseline.ts`, `scripts/validate-*.ts` are all "TS helpers, called from skills or pnpm scripts."

## Architecture Overview

```
.claude/skills/
  release-readiness/SKILL.md     orchestrates pnpm gates + meta checks, writes report
  triage-finding/SKILL.md        evaluates 3-criteria rule, drafts entry/bullet
  weekly-review/SKILL.md         lists staled state-files, suggests updates
.claude/hooks/
  stop-quality-check.sh          adds 1 freshness-reminder block at the end
scripts/
  release-readiness.ts           runs gates, aggregates JSON, renders markdown
  triage-finding.ts              JSON input, 3-criteria logic, draft output
  state-staleness.ts             reads state/INITIATIVES.md, returns staled rows
  state-files.ts (internal)      shared markdown-table parser for state-files
docs/superpowers/state/
  release-readiness-YYYY-MM-DD.md  auto-generated per run (committable evidence)
tests/unit/scripts/
  release-readiness.test.ts
  triage-finding.test.ts
  state-staleness.test.ts
  state-files.test.ts
```

Skills are the UX layer. Scripts are the testable logic layer. The hook is the only touch outside the dedicated directories.

## Section 1: `release-readiness` Skill

**Trigger:** `/release-readiness` (user-invocable). Optional flags: `--quick` (skip e2e + starters for fast iteration), `--dry-run` (no file write).

**Flow:**

1. **Pre-flight.** Skill checks: are we on a branch (not `main`)? Is the worktree clean? If either fails, stop with a hint.
2. **Run gates.** Skill calls `tsx scripts/release-readiness.ts run` with optional flags. The script executes:
   - `pnpm build`
   - `pnpm type-check`
   - `pnpm lint`
   - `pnpm test` (unit, with coverage from `--coverage`)
   - `pnpm test:integration`
   - `pnpm test:e2e` (skipped under `--quick`)
   - `pnpm test:starters` (skipped under `--quick`)
   - `pnpm validate:all`
   - `pnpm pack` smoke (executes `pnpm pack`, captures tarball size, lists top-level entries; fails if tarball > soft cap of 12 MB or unexpected top-level files appear)
   - Each gate runs sequentially. The script captures stdout/stderr/exit and produces a JSON result-set.
3. **Meta-checks.** Script parses state-files via the `state-files.ts` helper:
   - `state/INITIATIVES.md`: list all rows whose `Blocks` column contains `v0.20.0`. For each, check the linked state-file's status.
   - `state/test-infrastructure-hardening-status.md`: extract the 8-cluster table; flag any row whose Status is not `SHIPPED`.
   - `state/open-fix-clusters-latin-status.md`: extract Cluster G row (or whatever future cluster is flagged "blocks v0.20.0"); confirm Status is `SHIPPED`.
   - `.changeset/*.md`: count unmerged changeset files; flag if zero (no release content) or if any have malformed frontmatter.
   - `package.json` `version` vs `git tag --list 'v*'` last-tag: flag if version equals last tag (meaning a version bump is needed before tagging).
4. **Render report.** Markdown with sections:
   - Header: date, branch, commit SHA, pnpm version, node version.
   - Gates table: ✅/❌ per gate with duration in seconds and unit-test coverage% from the v8 reporter.
   - Meta-checks table: every v0.20.0-relevant state-file row with current status; clusters expected to be `SHIPPED` with their actual status; changeset count.
   - Go/No-Go decision: `GO` if all gates green AND all blocking-state-rows `SHIPPED` AND ≥1 changeset present AND version ≠ last tag. Otherwise `NO-GO` with a numbered reason list.
5. **Persist.** Writes `docs/superpowers/state/release-readiness-YYYY-MM-DD.md`. If a file for today already exists, append HHMM suffix (`-1430`). Prints the report path and Go/No-Go to terminal.

**What it does NOT do:** no `gh` calls, no auto-tag, no PR-create, no publishing. The existing `release` skill handles those steps after a `GO` report.

## Section 2: `triage-finding` Skill

**Trigger:** `/triage-finding`. Free-form input. The user pastes a finding description (file path, observed behavior, severity guess) without a fixed schema.

**Flow:**

1. **Parse input.** Skill extracts (best-effort) from the description: file path, severity hint (low/medium/high words or explicit `severity:` markers), type hint (bug/quality/test/etc.). If anything critical is missing, asks once interactively (consolidated, not 3-step).
2. **Initiative detection.** Skill loads `state/INITIATIVES.md` via the parser, lists all active initiatives, and proposes the most likely target based on keyword matching against the finding text (e.g., `test`, `mock`, `coverage` → `test-infrastructure-hardening`; `config`, `schema`, `validation` → `open-fix-clusters-latin`). User confirms or picks `none`.
3. **3-criteria check.** Skill calls `tsx scripts/triage-finding.ts evaluate --json '<input>'`. Logic:
   - **K1 (not fixable in same PR):** Skill asks once: "Can you fix this in the current PR?" (yes/no). The script accepts the answer as input.
   - **K2 (blocks something):** Script evaluates: does the description reference v0.20.0, an active feature from the 5-feature list (Studio export fix, per-framework storybook, robust wrappers, custom patterns, storybook tests), or a test-layer cluster (Q1/Q2/R/S/P/A/T/U/V)? Falls back to user confirmation if the heuristic returns ambiguous.
   - **K3 (≥ medium severity):** Severity threshold check on the parsed hint.
4. **Recommendation.**
   - All three criteria met → `Issue` (entry in initiative state-file).
   - K3 met but K1 or K2 fails → `in-PR-note` (PR-description bullet).
   - K3 fails → `wontfix-unless-recurring` (acknowledgement only).
5. **Draft output.**
   - **Issue draft.** Markdown in the format used by existing `## Findings` sections (see `state/open-fix-clusters-latin-status.md` lines 28–48 as the canonical pattern):

     ```markdown
     ### <slug>

     **Type:** <bug|quality|test> <severity>
     **Date:** YYYY-MM-DD
     **Routed from:** triage-finding YYYY-MM-DD
     **Summary:** <description>
     ```

     - `<slug>` is kebab-case of the first 4–6 description words.
     - No F-XXX ID (the F-numbering scheme was retired with bankruptcy).
     - User copies the draft into the appropriate state-file under its `## Findings` section.

   - **PR-note draft.** Single bullet: `- Out-of-scope note: <description> (deferred per triage YYYY-MM-DD: criterion K<n> not met, <reason>)`.
   - **wontfix draft.** Single line: `Triage decision YYYY-MM-DD: wontfix-unless-recurring. Reactivation criteria: same bug surfaces in a real failure, or explicitly blocks one of the 5 features. No further action.`

## Section 3: `weekly-review` Skill + Stop-Hook Freshness Check

### Skill `weekly-review`

- **Trigger:** `/weekly-review` (user-invocable, manual).
- **Flow:** Calls `tsx scripts/state-staleness.ts list`. Output: every row in `state/INITIATIVES.md` whose linked state-file's last-commit timestamp is older than 14 days. For each stale row, the skill shows: initiative name, last-touched date, current Status column, current Active-Cluster column. Asks: "Still accurate? Want to open the state-file?" The user steps through row-by-row or skips.
- No mutation. The skill does not edit state-files; it surfaces and prompts only.

### Stop-Hook Freshness Check

Additive modification to `.claude/hooks/stop-quality-check.sh`. Block runs at the end of the hook, after all existing quality checks.

**Conditions (all three must hold):**

1. Today is Mon–Fri (weekday).
2. Last commit touching `docs/superpowers/state/INITIATIVES.md` is more than 14 days ago.
3. The current session has produced ≥ 2 commits (signal of "non-trivial session").

**Output when all three hold:**

```
📋 Weekly state-review overdue (last INITIATIVES.md update: <N> days ago). Run /weekly-review when convenient.
```

**Output when any condition fails:** silent no-op.

**Implementation:** ~10 lines of bash appended to the hook. Existing quality-checks remain untouched. The block honors `KIGUMI_SKIP_FRESHNESS=1` for test environments.

## Section 4: Helper Scripts (`scripts/`)

### `scripts/state-files.ts` (internal, not executable)

Shared parser for state-file markdown tables. Internal because the only callers are the three executable scripts in this PR (release-readiness, triage-finding, state-staleness).

```typescript
export interface InitiativeRow {
  name: string;
  status: 'IN-PROGRESS' | 'PENDING' | 'SHIPPED' | 'BLOCKED';
  activeCluster: string | null;
  nextCluster: string | null;
  blocks: string | null; // 'v0.20.0', 'post-v0.20.0', 'unblocks T', or null
  stateFile: string; // relative path from repo root
}

export interface ClusterRow {
  cluster: string;
  codename: string;
  status: 'PLANNED' | 'IN-PROGRESS' | 'BLOCKED' | 'SHIPPED';
  pr: string | null;
}

export function loadInitiatives(repoRoot: string): InitiativeRow[];
export function loadClusters(testInfraStateFilePath: string): ClusterRow[];
export function loadStateFileMtime(
  repoRoot: string,
  relativePath: string
): Date;
```

Parsing strategy: line-based regex matching markdown tables (rows starting with `|`). Deterministic, no markdown library; table structure in state-files is hand-written and stable. Reject tables whose header row doesn't match the expected column set.

### `scripts/release-readiness.ts` (executable via tsx)

```bash
tsx scripts/release-readiness.ts run [--quick] [--dry-run]
```

- Subcommands: `run`, `dry-run`. (`report-only`, originally proposed for re-rendering today's report from cached JSON, is deferred: shipping in v1 would require a JSON cache layer with no current consumer, since `pnpm release-readiness` is fast enough on `--quick`. Revisit when a real second-pass workflow appears.)
- Imports `state-files.ts`. Spawns `pnpm` via `node:child_process.spawnSync`, captures `stdout`, `stderr`, `status`, `signal`. Aggregates results into a typed result-set.
- Renders Markdown via template-literal (no template engine; output is structured and stable).
- Exits 0 on `GO`, exits 1 on `NO-GO` (so the skill can flag failure visually).

### `scripts/triage-finding.ts` (executable)

```bash
tsx scripts/triage-finding.ts evaluate --json '<input>'
tsx scripts/triage-finding.ts draft --type <issue|pr-note|wontfix> --json '<context>'
```

- Pure functions for the 3-criteria logic, no FS access except the optional `state-files.ts` initiative-loading.
- Easily testable with fixture inputs.

### `scripts/state-staleness.ts` (executable)

```bash
tsx scripts/state-staleness.ts list [--days N]  # default 14
```

- Imports `state-files.ts`.
- Returns JSON: `[{ initiative, stateFile, lastModified, daysStale, status }]`.

## Section 5: Testing

Unit tests in `tests/unit/scripts/` using Vitest:

- **`state-files.test.ts`**: fixture state-files in `tests/fixtures/state/` covering: well-formed table, table with optional columns missing, malformed table (expected error), state-file with multiple tables (only the right one is parsed). Asserts parser output structure and error cases.
- **`release-readiness.test.ts`**: mocks `child_process.spawnSync` (via `vi.spyOn`), feeds canned gate-results, asserts:
  - Markdown report rendering is deterministic given fixed inputs.
  - `GO` decision when all gates green + all blocking rows SHIPPED + ≥1 changeset + version > last-tag.
  - `NO-GO` decision and reason list when any precondition fails.
  - Exit code matches GO/NO-GO.
- **`triage-finding.test.ts`**: table-driven. Every (K1, K2, K3) combination with expected recommendation and draft format. Asserts:
  - Slug generation from descriptions is deterministic and idempotent.
  - Draft output matches the canonical `## Findings` pattern from `open-fix-clusters-latin-status.md`.
- **`state-staleness.test.ts`**: fixture state-files with synthesized mtimes, asserts staleness threshold logic and JSON output.

No integration test for the skills themselves (they are Markdown directives consumed by Claude). Script unit-tests cover the executable surface.

Each test file aligns with the Cluster-Q1 standard (typed test files, no `any`, mock-budget compliant; script-spawn mocks count toward the budget so we use targeted `vi.spyOn` rather than `vi.mock` whole modules).

## Section 6: Stop-Hook Modification

Final block appended to `.claude/hooks/stop-quality-check.sh`:

```bash
# Weekly state-file freshness reminder (Phase 2 of backlog-bankruptcy)
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
        echo "📋 Weekly state-review overdue (last INITIATIVES.md update: $days_stale days ago). Run /weekly-review when convenient."
      fi
    fi
  fi
fi
```

The block is opt-out via `KIGUMI_SKIP_FRESHNESS=1`. CI runs of the hook (if any) set this flag. No regression risk for existing checks; the block runs after them and only emits one line.

## Phasing

This spec ships in a single PR. Sub-task ordering inside the PR:

1. `scripts/state-files.ts` + tests (foundation, both skills depend on it).
2. `scripts/state-staleness.ts` + tests (smallest consumer of state-files).
3. `scripts/triage-finding.ts` + tests (no external dependencies once state-files is done).
4. `scripts/release-readiness.ts` + tests (largest consumer; depends on state-files + child_process spawning).
5. `.claude/skills/release-readiness/SKILL.md`, `.claude/skills/triage-finding/SKILL.md`, `.claude/skills/weekly-review/SKILL.md`.
6. `.claude/hooks/stop-quality-check.sh` freshness block.
7. `state/backlog-bankruptcy-status.md` Phase 2 row update + AGENTS.md mentions of the new scripts.

Working plan lives at `.claude/plans/2026-05-04-backlog-bankruptcy-phase2-plan.md` (gitignored per CLAUDE.md). The plan translates this spec into per-step actions with test gates.

## Success Criteria

- `.claude/skills/release-readiness/SKILL.md` exists, is `user-invocable: true`, drives `tsx scripts/release-readiness.ts run`, and persists a markdown report in `docs/superpowers/state/`.
- `.claude/skills/triage-finding/SKILL.md` exists, is `user-invocable: true`, evaluates the 3-criteria rule, and produces a draft in one of three formats matching the canonical patterns.
- `.claude/skills/weekly-review/SKILL.md` exists, is `user-invocable: true`, lists staled rows from `state/INITIATIVES.md`.
- `.claude/hooks/stop-quality-check.sh` emits the freshness reminder when all three conditions hold and is silent otherwise.
- `scripts/release-readiness.ts`, `scripts/triage-finding.ts`, `scripts/state-staleness.ts`, `scripts/state-files.ts` exist with corresponding tests in `tests/unit/scripts/`.
- `pnpm test` passes; `pnpm type-check` passes; `pnpm lint` passes.
- `state/backlog-bankruptcy-status.md` Phase 2 row marked `SHIPPED` with PR number after merge.
- One live `release-readiness` run committed to `state/release-readiness-YYYY-MM-DD.md` (proof of end-to-end).
- One `triage-finding` invocation produces a draft that gets pasted into a state-file (proof of end-to-end).

## Open Questions

- **Slug collision in `triage-finding` drafts.** If two findings produce the same slug (rare but possible, e.g., two different "config-validation-error" findings), the user must rename. Should the script append a timestamp? Recommendation: defer, see if it actually happens in 4 PRs of usage. If yes, append `-HHMM`.
- **Pack-smoke baseline.** The 12 MB tarball cap is a guess. Recommendation: run `pnpm pack` on `main` once, check actual size, set the cap to actual + 30% headroom.
- **Severity heuristic in `triage-finding`.** Word-list-based parsing of severity from free-form input may be ambiguous. Recommendation: ship with a coarse word-list (low / medium / high), fall back to interactive prompt when no match. Tune after live use.

## Deviations from Spec (post-implementation)

- **`PACK_SOFT_CAP_BYTES` set to 2 MB**, not 12 MB. The actual tarball is 0.65 MB; the original 12 MB number was a placeholder. Final cap leaves ~3x headroom over the live size.
- **`test:starters` gate dropped from the non-quick path.** `vitest.e2e.config.ts` already includes the starter snapshot test in `test:e2e`, so a separate gate would have run the same suite twice.
- **`report-only` subcommand deferred** (see Section 4 note). No JSON cache layer was added.
- **`v0.20.0` blocking-initiative match tightened.** Initial implementation used substring match, which also caught `post-v0.20.0` rows. Smoke run surfaced this; corrected to exact match in commit `719a7dba`.

## Implementation Note

After this spec is approved by the user, the next step is invoking the `superpowers:writing-plans` skill to produce a detailed implementation plan at `.claude/plans/2026-05-04-backlog-bankruptcy-phase2-plan.md`. This spec stays in `docs/superpowers/specs/` as the committed reference.

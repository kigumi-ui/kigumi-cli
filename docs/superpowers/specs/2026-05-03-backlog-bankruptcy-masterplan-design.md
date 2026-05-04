# Backlog-Bankruptcy Masterplan: Design Spec

> Retire the 2,709-line monolithic backlog, formalize state-files as the project's primary work-tracking mechanism, install hygiene rules that prevent regrowth, and put v0.20.0 on a measurable release path.

**Type:** Process change + new initiative
**Status:** Draft
**Author:** Mischa
**Date:** 2026-05-03
**Initiative:** _new_ (`backlog-bankruptcy`)
**Branched from:** main (this spec lands on its own branch, separate from `ft/cluster-s-pr-s3`)
**Depends on:** none
**Blocks:** v0.20.0 ship date prediction; section 5 (skills) and section 8 (release plan) build on this

## Context

The 10-session developer onboarding audit (spec [`2026-04-09-developer-onboarding-design.md`](2026-04-09-developer-onboarding-design.md), tracker `~/.claude/projects/kigumi-cli-onboarding-progress.md`) is complete. All 10 sessions shipped. The audit's output lives in `~/.claude/projects/kigumi-cli-overview.md` and splits into two parts:

| Lines | Section | Value |
|-------|---------|-------|
| 1 to 505 | Knowledge Base (10 Domain sections) | High, irreplaceable, historical audit snapshot |
| 506 to 2,709 | Follow-up Tasks (144 F-IDs in Latin/Greek clusters) | The backlog this spec retires |

Mischa reports loss of confidence about v0.20.0 release readiness and feels blocked from feature work because of perceived backlog overhead. Investigation found:

- All 144 F-IDs are low or medium severity. Zero are critical or high.
- 82 F-IDs are DONE; 62 are open.
- The test-infrastructure-hardening initiative has shipped 5 of 8 clusters (Q1, Q2, R, P done; S in flight; T, U, V pending) and is on track to deliver release confidence. The first impression of test gaps was incorrect.
- The Follow-up Tasks section drives most of the perceived overhead, not the audit content.

The audit succeeded as a self-onboarding exercise. The Follow-up Tasks section, governed by the rule "every new finding gets an F-XXX entry", has accumulated faster than it has cleared. This spec retires the Follow-up Tasks portion, preserves the Knowledge Base, establishes a lightweight tracking convention that has already proven itself in two existing initiatives, and installs hygiene rules that prevent the pattern from recurring.

## Goals

- Reduce the active free-floating backlog from 62 items to 0.
- Preserve the audit Knowledge Base (`overview.md` lines 1 to 505) as historical reference, untouched.
- Establish `docs/superpowers/state/INITIATIVES.md` as the cross-initiative master dashboard. This is the answer to the recurring question "which cluster makes sense next" across initiatives.
- Migrate active medium-severity items into the appropriate initiative state-files; box low-severity items behind an explicit reactivation rule.
- Stop commit-message bloat at the squash-merge layer.
- Update the new-finding rule so backlog inflation cannot regrow.
- Set v0.20.0 release confidence on a measurable, dated path (designed in a follow-up section 8 spec).

## Non-Goals

- Migrating to GitHub Projects or Notion. State-files are the chosen primary tracking mechanism; GitHub Projects is reserved as an option only if state-files later prove insufficient (e.g., non-solo contributor onboarding).
- Rewriting the Knowledge Base sections of `overview.md`. They are a historical audit snapshot, kept as-is with a header note.
- Retroactively cleaning bloated commit messages since `1f9e7601` (PR #87). The cost of rewriting the SHA chain exceeds the value.
- Forking the CLI into a generic community-registry CLI. Strategic discussion settled this; staying with the current Kigumi codebase is the chosen path.

## Honest Test-Suite Snapshot (correction to first impression)

The test-infrastructure-hardening initiative has shipped most of the work that v0.20.0 confidence depends on:

| Cluster | Status | What it delivered |
|---------|--------|-------------------|
| Q1 | SHIPPED #137 | Type-checking on `tests/`, mock-budget infra |
| Q2 | SHIPPED #138 | Vue and Angular added to CI integration matrix, e2e job, docs-typecheck job, release smoke step |
| R | SHIPPED #139 / #140 / #141 | 4-lane real-world starter e2e (react/vue/angular/next) with byte-level snapshot diff, per-PR `pack-test`, migration fixtures |
| P | SHIPPED #143 to #146 | Subprocess coverage instrumentation, thresholds 85/75/86/85, `init/index.ts` 16% to 81% line coverage |
| S | IN-PROGRESS #147 / #148 / #150 | Mock reduction, ~238 to 104 substring matches, target under 50 |
| T | BLOCKED | Property-based plus edge cases (blocked on Latin Cluster A `.strict()` adoption) |
| U | BLOCKED | Storybook `play()` interactions (overlaps with feature-2 per-framework storybook) |
| V | BLOCKED | Evidence layer (mutation testing, bug-bash, bug-injection) |

The "test pyramid is inverted" framing in earlier discussion was wrong. The pyramid is in active build-out. The remaining work is cluster S finish plus T, U, V; total estimate 6 to 9 weeks to v0.20.0 ship.

The only test-suite gap not already covered by the initiative is coverage-threshold enforcement on integration and e2e Vitest configs (currently only unit has thresholds). This is a 30-minute fix and is captured in section 4.

## Section 1: Backlog-Bankruptcy Mechanics

### Treatment of `overview.md`

The file stays at `~/.claude/projects/kigumi-cli-overview.md` (local 2nd brain, not in git repo). It is restructured in-place:

1. **Lines 1 to 505 (Knowledge Base)** are kept untouched. A header note is added under the title:
   > *Audit completed 2026-04-09. Captures repo state at that moment. AGENTS.md hierarchy is the living source of truth going forward.*
2. **Line 506 onward (Follow-up Tasks)** is restructured into three sub-sections:
   - `## Follow-up Tasks: Completed (Historical)`: the 82 DONE entries
   - `## Follow-up Tasks: Bankruptcy 2026-05-03 (wontfix-unless-recurring)`: the 41 low-severity items plus any medium that triage into category C
   - `## Follow-up Tasks: Migrated to Initiative State-Files`: a stub section listing the 21 medium-severity items with cross-links to where each one now lives

### Triage of the 41 low-severity items

Default action: all 41 receive the `wontfix-unless-recurring` marker and move to the Bankruptcy sub-section.

**Reactivation criteria** (only one needs to apply):

- The same bug surfaces in a user-reported issue, a test failure, or a real observed regression.
- The item is found to explicitly block a feature from Mischa's active 5-feature list: Studio export fix, per-framework storybook, robust wrappers, custom patterns, storybook tests.

### Triage of the 21 medium-severity items

Each item receives an A/B/C category:

- **A) Blocks v0.20.0**: added as a row in `state/INITIATIVES.md` and as an entry in the relevant initiative's state-file
- **B) Blocks a concrete feature**: added to a state-file for that feature (creating one if necessary, e.g., `state/studio-export-fix-status.md`)
- **C) Polish without block**: degraded to `wontfix-unless-recurring` like the 41 low-severity

Estimated distribution to validate during triage: ~5 in A, ~10 in B, ~6 in C.

### Triage workflow

1. Write `scripts/triage-backlog.ts` that parses `kigumi-cli-overview.md` and emits `tmp/backlog-triage.csv` with columns: F-ID, severity, type, last-mention-date, current-cluster, suggested-category. Suggestions are heuristic; user confirms.
2. Mischa walks the 21 medium rows, marks A/B/C with a one-word rationale.
3. Skript writes the markers back into `overview.md` and creates corresponding entries in `state/INITIATIVES.md` and the per-feature state-files.
4. Final state: 82 DONE preserved, 41 low boxed, 21 medium routed.
5. **Active free-floating backlog: 0 items.**

### Cluster-Treadmill Stop

After Cluster V of the test-infrastructure-hardening initiative ships, no new Latin/Greek cluster initiative starts unless it blocks v0.20.0 or a concrete feature on the 5-feature list. This is enforced via section 7's "no new findings unless blocking" rule.

## Section 2 (light): State-Files Standard

### New: `docs/superpowers/state/INITIATIVES.md`

Cross-initiative master dashboard. Skeleton:

```markdown
# Active Initiatives Dashboard

**Last updated:** 2026-05-03
**Convention:** each active initiative has a state-file in this directory. This dashboard
tracks which initiatives are active, blocked, or shipped, and where cross-initiative
priority decisions live.

## Active Initiatives

| Initiative | Status | Active cluster | Next cluster | Blocks | State-file |
|-----------|--------|---------------|--------------|--------|------------|
| test-infrastructure-hardening | IN-PROGRESS | S (PR-S3 #150) | T (after Latin A) | v0.20.0 | [link](test-infrastructure-hardening-status.md) |
| open-fix-clusters-latin | IN-PROGRESS | A (config-lifecycle) | B or J | unblocks T | _seed status-file_ |
| backlog-bankruptcy | IN-PROGRESS | section 1+2+6+7 | section 3+4+5+8 | none | [link](backlog-bankruptcy-status.md) |
| foundations-restructure | IN-PROGRESS | see status-file | see status-file | none | [link](foundations-restructure-status.md) |

## Cross-Initiative Priority Log

Decisions about which cluster across all initiatives takes priority, with date and
rationale.

### 2026-05-03: Latin Cluster A before test-infra Cluster T

Latin Cluster A's `.strict()` adoption is the dependency that unblocks Cluster T.
Therefore A is the cross-initiative bottleneck. Recommendation: complete A in the
parallel session before starting T.

### Template for future entries

- Date: YYYY-MM-DD
- Decision: cluster X before cluster Y
- Rationale: which initiative blocks which, what the cost of inverse order is
```

### New: `docs/superpowers/state/backlog-bankruptcy-status.md`

Follows the test-infra pattern: status header, section table, phase log, decisions, open questions. Bootstrapped during Phase 1.

### New: `docs/superpowers/state/open-fix-clusters-latin-status.md`

Seeded by the parallel cluster-A session. References the existing Latin A-J cluster table from `~/.claude/plans/schaue-in-kigumi-cli-overview-md-rein-encapsulated-lagoon.md`. The cluster-A session is explicitly responsible for creating this file as part of its first PR.

### Convention

Every active multi-PR initiative gets one state-file. Single-PR work does not need a state-file. State-files live in `docs/superpowers/state/`, are committed, and serve as the public mirror of work in progress. The local 2nd brain holds richer per-cluster session notes; the state-files hold what other contributors and Claude sessions need to coordinate.

## Section 3: Test-Pyramid Status (corrected)

The pyramid is in active build-out, not invertedly broken. See "Honest Test-Suite Snapshot" above. Remaining work for v0.20.0:

- Cluster S: PR-S3 (#150) merge + PR-S4 (1 to 2 weeks)
- Latin Cluster A `.strict()` (parallel; unblocks Cluster T)
- Cluster T: property-based plus edge cases (1 to 2 weeks)
- Cluster U: storybook `play()` interactions (overlaps with feature-2)
- Cluster V: evidence layer (2 to 3 weeks)

Total estimate: 6 to 9 weeks to all 8 clusters shipped.

## Section 4: CI Gates (corrected)

The multi-framework matrix (Q2), real-world-starter snapshot (R), per-PR pack-test (R), and unit-coverage thresholds (P) are already in place. The only remaining gap is **coverage-threshold enforcement on `vitest.integration.config.ts` and `vitest.e2e.config.ts`**, which currently have no `coverage.thresholds` block.

Sub-task: add a `thresholds` block to both configs at conservative levels (e.g., 70/60/70/70 to start), set 2 to 3 points below current measured numbers, raise as PRs improve coverage. 30-minute fix.

## Section 5: Skills and Agents Tuning (outline)

Two new skills proposed, designed in a follow-up spec:

- **`release-readiness`**: runs all gates (typecheck, lint, validate:*, test, test:integration, test:e2e, test:starters, pack smoke), aggregates results, produces a Go/No-Go report. Used before tagging a release.
- **`triage-finding`**: given a finding (file path, description, severity guess), recommends Issue, in-PR-note, or wontfix based on the section 7 criteria. Used during code review.

Plus one routine adjustment:

- Add a weekly `/loop` or `/schedule` invocation: "review `state/INITIATIVES.md`, flag stale rows (no update in 14 days), nudge for status refresh."

Detailed design lives in a separate spec after Phase 1 ships.

## Section 6: Commit-Message Hygiene

### Phase 1 (immediate, 30 seconds)

GitHub Repo Settings → General → Pull Requests → "Allow squash merging" → change default from "Default to pull request title and description" to **"Default to pull request title"**.

Effect: future squash merges produce single-line commit messages. PR body remains visible in the PR but stays out of `git log`.

### Phase 2 (optional, defer)

If `git log` becomes too sparse, add a GitHub Action `commit-message-cleaner.yml` that takes the first three bullet points of the PR body as the commit body. Decide based on real `git log` ergonomics after 4 to 6 PRs land under Phase 1.

### Retroactive cleanup: rejected

Rewriting history since `1f9e7601` would invalidate every external reference to those SHAs (issues, 2nd brain notes, changelog links, PR cross-references). Cost outweighs benefit on a solo repo.

## Section 7: "No new findings unless blocking" Rule

### Update to `~/.claude/projects/-Users-giregar-Documents-dev-git-kigumi-cli/memory/feedback-new-findings-to-backlog.md`

Replace existing rule with:

```markdown
## Wann ein Finding einen Eintrag bekommt

**Drei Kriterien (alle müssen zutreffen):**

1. Das Finding ist nicht im selben PR fixbar.
2. Das Finding blockt mindestens eines von:
   - v0.20.0 Release-Confidence (initiative-acceptance-criterion)
   - Ein konkret geplantes oder aktives Feature
   - Eine Test-Schicht-Vollständigkeit (Cluster-Initiative-Goal)
3. Es ist mindestens medium-severity.

**Wenn nur 1 oder 2 erfüllt sind:** im PR-Description als "Beobachtungen" oder
"Out-of-scope notes" erwähnen, kein neuer Eintrag. Reaktivierung wenn das Finding
später echt blockt.

**Speicherort der neuen Einträge:** im State-File der relevanten Initiative,
nicht mehr in `overview.md` (archiviert per Backlog-Bankruptcy 2026-05-03).
```

### Optional: Stop-Hook Reminder (Phase 2)

`.claude/hooks/stop-quality-check.sh` could grow a check: "if this session created entries in any state-file under `## Findings`, prompt: confirm each one passes the 3-criteria test." Defer until Phase 1 has run for 2 to 4 weeks and shows whether the rule needs hook-level enforcement.

## Section 8: v0.20.0 Release Plan (outline)

Detailed plan in a follow-up spec written after Phase 1 ships. Outline:

- Pre-release gates: all 8 test-infra clusters shipped, `release-readiness` skill green, all 5 features in 0.20 scope merged, CHANGELOG complete, migration guide for breaking changes published.
- Sequence: tag rc1, run smoke install in three frameworks, fix any blockers, tag 0.20.0, publish, monitor for 48 hours.
- Post-release: feature work starts on the 5-feature list (Studio export fix, per-framework storybook, robust wrappers, patterns, storybook tests) under the new "blocking only" finding rule.

## Phasing

| Phase | Sections | Effort | Outcome |
|-------|----------|--------|---------|
| Phase 1 (this week) | 1, 2-light, 6, 7 | 1 to 2 days | Active backlog 0; state-files standard live; squash-bloat stopped; new-finding rule live |
| Phase 2 (1 to 2 weeks) | 5 | 2 to 3 days | `release-readiness` skill, `triage-finding` skill, weekly review routine |
| Phase 3 (in flight) | Test-infra cluster S, then T, U, V | 6 to 9 weeks | All 8 test-infra clusters shipped (this is happening regardless of bankruptcy) |
| Phase 4 (during Phase 3) | 4 | 30 minutes | Coverage thresholds on integration and e2e configs |
| Phase 5 (after Phase 3) | 8 | 1 week | v0.20.0 ship |

Total: 7 to 12 weeks from 2026-05-03 to v0.20.0 shipped, assuming Phase 1 goes ahead this week.

## Open Questions

- **Marker format in `overview.md`** for `wontfix-unless-recurring`: inline tag, separate H2 section, or YAML frontmatter? Recommendation: separate H2 section dated `2026-05-03`, easy to grep, easy to read.
- **Cross-link from `state/INITIATIVES.md` to local 2nd brain**: yes or no? Recommendation: no, keep `state/` strictly repo-internal; the 2nd brain mirrors via a separate memory file `project-backlog-bankruptcy.md`.
- **Triage script in `scripts/`**: keep as a one-shot or maintain as a `scripts/triage-backlog.ts` tool? Recommendation: one-shot, delete after Phase 1; the new finding rule means triage happens at PR-time, not in batch.
- **Branch landing strategy**: this spec is currently in worktree `ft/cluster-s-pr-s3` but is unrelated to cluster S. Recommendation: move to a fresh branch `ft/backlog-bankruptcy-spec`, ship as own PR before Phase 1 implementation.

## Success Criteria

- `kigumi-cli-overview.md` Follow-up Tasks section reorganized into three sub-sections (Completed, Bankruptcy, Migrated) per Section 1.
- `state/INITIATIVES.md` exists, lists all four currently active initiatives, has a Cross-Initiative Priority Log with at least the 2026-05-03 Latin-A-before-T entry.
- `state/backlog-bankruptcy-status.md` exists tracking this spec's implementation phases.
- `state/open-fix-clusters-latin-status.md` exists (seeded by the parallel cluster-A session, referenced from `INITIATIVES.md`).
- GitHub repo settings: Squash merge default is "PR title".
- `feedback-new-findings-to-backlog.md` memory updated with the 3-criteria rule.
- After Phase 1 ships, no PR created in the next 14 days adds an F-XXX entry that fails the 3-criteria test (rule enforcement test).

## Implementation Note

Per `CLAUDE.md`, working plans go to `.claude/plans/` (gitignored). After this spec is approved, the next step is to invoke the `superpowers:writing-plans` skill to produce a Phase-1 working plan there. This spec stays in `docs/superpowers/specs/` as the committed reference.

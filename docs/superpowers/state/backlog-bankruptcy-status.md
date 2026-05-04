# Backlog-Bankruptcy: Live Status

**Last updated:** 2026-05-04
**Initiative spec:** [`docs/superpowers/specs/2026-05-03-backlog-bankruptcy-masterplan-design.md`](../specs/2026-05-03-backlog-bankruptcy-masterplan-design.md)
**Phase 2 spec:** [`docs/superpowers/specs/2026-05-04-backlog-bankruptcy-phase2-skills-design.md`](../specs/2026-05-04-backlog-bankruptcy-phase2-skills-design.md)
**Active phase:** Phase 2 (IN-PROGRESS)
**Active plan:** _local working plan only; gitignored at `.claude/plans/2026-05-04-backlog-bankruptcy-phase2-plan.md`_

---

## Phase Status Table

| Phase       | Sections                       | Status            | PR   | Outcome                                                                                       |
| ----------- | ------------------------------ | ----------------- | ---- | --------------------------------------------------------------------------------------------- |
| **Phase 1** | 1, 2-light, 6, 7               | **SHIPPED**       | #153 | active backlog 0; state-files standard live; squash-bloat stopped; new-finding rule live      |
| **Phase 2** | 5                              | IN-PROGRESS       | #160 | release-readiness skill, triage-finding skill, weekly-review skill, stop-hook freshness block |
| **Phase 3** | test-infra clusters S, T, U, V | TRACKED ELSEWHERE | -    | tracked in [test-infrastructure-hardening-status.md](test-infrastructure-hardening-status.md) |
| **Phase 4** | 4                              | PENDING           | -    | coverage thresholds on integration and e2e configs                                            |
| **Phase 5** | 8                              | PENDING           | -    | v0.20.0 ship                                                                                  |

**Status legend:**

- **PLANNED**: spec exists, ready to start
- **IN-PROGRESS**: a session is actively working
- **PENDING**: dependency not yet met or spec needed
- **SHIPPED**: PR merged to main, acceptance criteria met
- **TRACKED ELSEWHERE**: another initiative owns this phase

---

## Phase 1 Task Status

| Task | Subject                                        | Status |
| ---- | ---------------------------------------------- | ------ |
| 0    | Worktree + branch setup                        | done   |
| 1    | Create state/INITIATIVES.md                    | done   |
| 2    | Create state/backlog-bankruptcy-status.md      | done   |
| 3    | Implement triage script (TDD)                  | done   |
| 4    | Run triage extraction                          | done   |
| 5    | Walk 21 medium items, capture A/B/C            | done   |
| 6    | Apply restructuring to overview.md             | done   |
| 7    | Migrate routed items to state-files            | done   |
| 8    | Update feedback memory file                    | done   |
| 9    | GitHub squash-merge default                    | done   |
| 10   | Cleanup triage script                          | done   |
| 11   | Final validation against spec success criteria | done   |

(Update this table as tasks complete.)

---

## Phase 2 Task Status

| Task | Subject                                       | Status |
| ---- | --------------------------------------------- | ------ |
| 1    | scripts/state-files.ts parser + tests         | done   |
| 2    | scripts/state-staleness.ts + tests            | done   |
| 3    | scripts/triage-finding.ts + tests             | done   |
| 4    | scripts/release-readiness.ts + tests          | done   |
| 5    | Skill: release-readiness                      | done   |
| 6    | Skill: triage-finding                         | done   |
| 7    | Skill: weekly-review                          | done   |
| 8    | Stop-hook freshness reminder                  | done   |
| 9    | AGENTS.md updates + this state-file row       | done   |
| 10   | End-to-end smoke (live report + triage draft) | done   |
| 11   | Full validation + draft PR                    | done   |

---

## Decisions Log

### 2026-05-04: Phase 2 second-pass review fixes

Code-review pass against the Phase 2 spec surfaced four important items
plus six minor. Fixed inline: `parseArgs` exported with regression tests
(I2), `release-readiness:quick` and `:dry-run` pnpm scripts added (I4),
spec amended with a "Deviations from Spec" section to record the
deferred `report-only` subcommand and other post-implementation deltas
(I3), end-to-end triage-finding draft routed into the Findings section
of this status file (I1, see below). Minor fixes: stop-hook freshness
comment clarified (M6), weekly-review SKILL switched from BSD-only
`sed -i ''` to `Edit` for portability (M4), additional `evaluateCriteria`
combination test added covering `K1=false, K2=false, K3=true` (M3).
M1 (`persistReport` collision logic untested) and M2 (`parseCoverage`
regex untested) are deferred; M2 captured as a Finding below.

### 2026-05-04: Phase 2 ships in single PR

Three skills + one hook touch + four scripts + tests + AGENTS docs. Skills
are markdown orchestrators; the testable logic lives in `scripts/`.
Per-skill SKILL.md follows the existing release-skill pattern. Code-review
fixes shipped inline: tarball cleanup, single decideGoNoGo call, stderr
discipline, persistReport collision counter, pack-cap calibration (12 MB
→ 2 MB), test:starters dropped (test:e2e covers it), --days robustness.

### 2026-05-03: GitHub Projects rejected in favor of state-files

State-files at `docs/superpowers/state/` already exist for two initiatives and have
proven scalable for solo + AI-agent workflow. GitHub Projects deferred as an option
only if state-files prove insufficient (e.g., non-solo contributor onboarding).

### 2026-05-03: overview.md Knowledge Base preserved, Follow-up Tasks restructured

Lines 1-505 (Knowledge Base from 10-session audit) stay untouched as historical
snapshot. Lines 506+ (Follow-up Tasks) split into three sub-sections: Completed,
Bankruptcy, Migrated.

### 2026-05-03: Triage script is one-shot, deleted in Task 10

Per spec, the triage automation is throwaway. The new finding rule (section 7)
means future triage happens at PR-time, not in batch.

---

## Findings

### release-readiness-parsecoverage-regex-untested

**Type:** test medium
**Date:** 2026-05-04
**Routed from:** triage-finding 2026-05-04
**Summary:** release-readiness parseCoverage regex untested

The `parseCoverage` closure inside `buildGateSpecs` (in `scripts/release-readiness.ts`) extracts the "All files" coverage percentage from the v8 reporter's stdout via regex. The closure is exercised end-to-end during `pnpm release-readiness:quick`, but no unit test feeds it sample stdout, so a future change to the v8 reporter format would silently produce `undefined` and the report's coverage line would simply disappear without any test failing. Add a focused test for the closure (extract it, or test via a public seam) so format drift surfaces as a red test rather than a missing report field.

## Open Questions

- **Marker format in overview.md** for `wontfix-unless-recurring`: separate H2 section with date marker (recommended in spec).
- **Cross-link from INITIATIVES.md to local 2nd brain**: no, keep `state/` strictly repo-internal.

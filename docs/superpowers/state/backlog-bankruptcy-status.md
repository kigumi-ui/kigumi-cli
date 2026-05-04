# Backlog-Bankruptcy: Live Status

**Last updated:** 2026-05-03
**Initiative spec:** [`docs/superpowers/specs/2026-05-03-backlog-bankruptcy-masterplan-design.md`](../specs/2026-05-03-backlog-bankruptcy-masterplan-design.md)
**Active phase:** Phase 2 (PENDING)
**Active plan:** _local working plan only; gitignored at `.claude/plans/2026-05-03-backlog-bankruptcy-phase1-plan.md`_

---

## Phase Status Table

| Phase       | Sections                       | Status            | PR   | Outcome                                                                                       |
| ----------- | ------------------------------ | ----------------- | ---- | --------------------------------------------------------------------------------------------- |
| **Phase 1** | 1, 2-light, 6, 7               | **SHIPPED**       | #153 | active backlog 0; state-files standard live; squash-bloat stopped; new-finding rule live      |
| **Phase 2** | 5                              | PENDING           | -    | release-readiness skill, triage-finding skill, weekly review routine                          |
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

## Decisions Log

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

## Open Questions

- **Marker format in overview.md** for `wontfix-unless-recurring`: separate H2 section with date marker (recommended in spec).
- **Cross-link from INITIATIVES.md to local 2nd brain**: no, keep `state/` strictly repo-internal.

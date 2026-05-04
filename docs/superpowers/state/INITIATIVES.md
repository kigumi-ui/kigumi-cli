# Active Initiatives Dashboard

**Last updated:** 2026-05-04
**Convention:** each active initiative has a state-file in this directory. This dashboard
tracks which initiatives are active, blocked, or shipped, and where cross-initiative
priority decisions live.

## Active Initiatives

| Initiative                    | Status      | Active cluster      | Next cluster       | Blocks       | State-file                                      |
| ----------------------------- | ----------- | ------------------- | ------------------ | ------------ | ----------------------------------------------- |
| test-infrastructure-hardening | IN-PROGRESS | T (starting)        | U, V               | v0.20.0      | [link](test-infrastructure-hardening-status.md) |
| open-fix-clusters-latin       | IN-PROGRESS | none (A, B shipped) | G (blocks v0.20.0) | v0.20.0      | [link](open-fix-clusters-latin-status.md)       |
| backlog-bankruptcy            | IN-PROGRESS | Phase 2 (in flight) | Phase 4 (30 min)   | none         | [link](backlog-bankruptcy-status.md)            |
| foundations-restructure       | IN-PROGRESS | see status-file     | see status-file    | none         | [link](foundations-restructure-status.md)       |
| studio-export-fix             | PENDING     | -                   | -                  | post-v0.20.0 | [link](studio-export-fix-status.md)             |
| robust-wrappers               | PENDING     | -                   | -                  | post-v0.20.0 | [link](robust-wrappers-status.md)               |

## Cross-Initiative Priority Log

Decisions about which cluster across all initiatives takes priority, with date and
rationale.

### 2026-05-04: Backlog-Bankruptcy Phase 2 in flight

Phase 2 ships release-readiness, triage-finding, and weekly-review skills
plus a stop-hook freshness reminder, four executable scripts, and Vitest
unit tests. After merge, v0.20.0 release-blocker meta-checks become
runnable as `pnpm release-readiness`. First live run on this branch
returned NO-GO with 5 reasons (cluster U/V still BLOCKED, two initiatives
IN-PROGRESS, version bump pending), matching expectations.

### 2026-05-03: Latin Cluster A before test-infra Cluster T (RESOLVED)

Latin Cluster A's `.strict()` adoption was the dependency that unblocks test-infra
Cluster T. Cluster A SHIPPED in PR #152 (merged 2026-05-03), addressing 10 F-IDs:
F-033, F-054, F-055, F-056, F-057, F-058, F-059, F-062, F-065, F-067.

Cluster T is now unblocked and can start. Latin Cluster B SHIPPED in PR #134.
Clusters C-J remain pending; Cluster G is the next v0.20.0-blocking priority.

### Template for future entries

- **Date:** YYYY-MM-DD
- **Decision:** Cluster X before Cluster Y
- **Rationale:** which initiative blocks which, what the cost of inverse order is

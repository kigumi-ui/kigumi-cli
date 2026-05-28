# Active Initiatives Dashboard

**Last updated:** 2026-05-28
**Convention:** each active initiative has a state-file in this directory. This dashboard
tracks which initiatives are active, blocked, or shipped, and where cross-initiative
priority decisions live.

## Active Initiatives

| Initiative                    | Status          | Active cluster      | Next cluster                       | Blocks       | State-file                                      |
| ----------------------------- | --------------- | ------------------- | ---------------------------------- | ------------ | ----------------------------------------------- |
| test-infrastructure-hardening | **SHIPPED**     | -                   | -                                  | -            | [link](test-infrastructure-hardening-status.md) |
| open-fix-clusters-latin       | v0.20.0-SHIPPED | -                   | C, D, E, F, H, I, J (post-v0.20.0) | -            | [link](open-fix-clusters-latin-status.md)       |
| backlog-bankruptcy            | IN-PROGRESS     | Phase 2 (in flight) | Phase 4 (30 min)                   | none         | [link](backlog-bankruptcy-status.md)            |
| foundations-restructure       | IN-PROGRESS     | see status-file     | see status-file                    | none         | [link](foundations-restructure-status.md)       |
| studio-export-fix             | PENDING         | -                   | -                                  | post-v0.20.0 | [link](studio-export-fix-status.md)             |
| robust-wrappers               | PENDING         | -                   | -                                  | post-v0.20.0 | [link](robust-wrappers-status.md)               |

## Cross-Initiative Priority Log

Decisions about which cluster across all initiatives takes priority, with date and
rationale.

### 2026-05-28: v0.20.0 unblocked from both v0.20.0-blocking initiatives

Cluster V (test-infra evidence layer) SHIPPED — see PR-V3 + the
bug-injection acceptance gate result (5/5) in
[`test-infrastructure-hardening-status.md`](test-infrastructure-hardening-status.md).
The first gate run on 2026-05-23 caught 4/5; the React-generator
filename-mutation gap was closed by #182 (`generate-react-templates-output.test.ts`),
and the 2026-05-28 re-run confirmed 5/5.

`open-fix-clusters-latin` flipped to **v0.20.0-SHIPPED** scope: only Cluster G
blocked v0.20.0 per the original triage, and Cluster G shipped in PR #170
on 2026-05-06 (F-042, F-043, F-044, F-049). Clusters C, D, E, F, H, I, J
are non-blocking and tracked for post-v0.20.0.

With both v0.20.0-blocking initiatives now SHIPPED in their v0.20.0 scope,
the next step is `pnpm release-readiness` → GO → batch-merge Dependabot
PRs → refresh changeset-release PR #89 → publish 0.20.0.

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

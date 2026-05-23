---
'kigumi': patch
---

### Added

- **Test infrastructure: bug-bash regression suite + bug-injection runbook (cluster V, PR-V2).** Adds `tests/unit/regression/` with 10 entries (65 tests) — each protecting a specific historical PR/F-ID and verified by reverting the original fix on a scratch branch. Headers cite the PR + the symptom + the fix SHA. Adds `scripts/bug-injection-gate.md`, the runbook for the one-time acceptance gate (5 deliberate bugs, full-suite kill check). The cluster V spec wrote the path as `tests/regression/`; execution placed it under `tests/unit/regression/` so the existing `pnpm test`/`check:mocks`/`tsconfig.tests.json`/`vitest related` machinery covers them automatically. `tests/AGENTS.md` documents the regression-suite contract and the mutation-testing workflow.

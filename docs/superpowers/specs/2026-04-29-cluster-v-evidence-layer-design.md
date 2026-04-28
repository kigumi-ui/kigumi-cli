# Cluster V: Evidence Layer — Specification

> Turn "tests pass" into "tests demonstrably catch breakage." Mutation testing as a continuous metric, a regression suite protecting historical bugs, and a one-time bug-injection acceptance gate before the initiative ships.

**Type:** Test Infrastructure
**Status:** Draft
**Author:** Mischa
**Date:** 2026-04-29
**Initiative:** [`test-infrastructure-hardening`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**F-IDs:** NEW (mutation testing, bug-bash regression suite, bug-injection acceptance gate). To be registered locally in `~/.claude/projects/kigumi-cli-overview.md` as F-X10, F-X11, F-X12.
**Depends on:** Q1 (`pnpm check:tests` + storybook fix), Q2 (e2e + Vue/Angular lanes in CI)
**Branched from:** `origin/main` after Q1 + Q2 merge

## Overview

Q1 through U add tests, fix CI gaps, and reduce mock theatre. All real progress. None of it answers the question "do these tests catch breakage?" The user's challenge during planning was precise: "ich brauche keine annahmen. ich will belege" — no assumptions, evidence.

This cluster ships three independent forms of evidence:

1. **Mutation testing** (StrykerJS) — an objective, measurable signal of test quality. Stryker mutates `src/**` (flips `<` to `>`, swaps `&&` for `||`, removes early returns) and runs the full suite per mutant. The percentage of mutants killed by _any_ test = the mutation score. Recurring weekly + manual.
2. **Bug-bash regression suite** — a curated set of regression tests in `tests/regression/`, each protecting against a specific past bug. Each test is verified during cluster execution by reverting the original fix on a scratch branch and confirming the regression test fails. Historical proof that the suite catches _real_ breakage that real users hit.
3. **Bug-injection acceptance gate** — a one-time procedure at the end of the cluster. Plant 5 deliberate bugs in `src/`, run the full suite, require 5/5 mutants killed. If any bug ships green, identify the gap, fix it, repeat until 5/5. The final gate before the initiative is declared SHIPPED.

The three are independent: mutation testing measures the suite; bug-bash protects specific past failures; bug-injection is the acceptance test. Together they convert "≥99% confidence" from an estimate into a measured number with documented evidence.

## Goals

- **Mutation score ≥ 80%** on the `src/` source tree — established baseline run, gate enforced via StrykerJS thresholds, weekly CI workflow + manual dispatch. Score regression below 80% blocks the initiative until restored.
- **≥ 10 bug-bash regression tests** in `tests/regression/`, each documenting the historical PR/F-ID it protects. Verified by `git revert` of the original fix on a scratch branch — the regression test must fail without the fix.
- **5/5 bug-injection kill rate** — at end of cluster, plant 5 deliberate bugs across `src/`, run the full test suite (`pnpm test:all && pnpm test:e2e && pnpm test:integration`), confirm 5/5 mutants caught. Document result in the status dashboard.
- **Reproducible mutation runs** — StrykerJS configured with deterministic seed (`fc.configureGlobal` for any property-based mutation hooks; Stryker's own seeding is sufficient for its mutators).
- **No false positives in CI** — mutation testing failures must be actionable. Excluded patterns documented (e.g., file-system order is non-deterministic; pure logging statements; hash seeds).

## Non-Goals

- **Mutation testing on `tests/`, `templates/`, or `scripts/`.** Only `src/` is the value-bearing surface. Templates are framework code copied to user projects — covered by `pnpm typecheck:templates` and Cluster R's snapshot diff. Scripts are build-time tools.
- **Mutation testing on every PR.** Stryker is slow (~10-30 minutes for kigumi's surface). Weekly cron + manual dispatch. PR gating happens via the existing test suite + the bug-bash regression set.
- **Bug-bash regression tests for every past F-ID.** Curate the most user-impacting and structurally-revealing 10+ entries; we're not building an exhaustive history.
- **Bug-injection as a recurring CI job.** It's a one-time procedure documented in `scripts/bug-injection-gate.md`. Re-runs are valuable before any major release but not automated; running every PR creates a constant chore for marginal value over the mutation score.
- **Property-based mutation generators (custom Stryker mutators).** Stryker's defaults (arithmetic, conditional, string, boolean, etc.) are sufficient for kigumi's surface. Custom mutators are out of scope.
- **Reproducing every past kigumi bug as a regression test.** The bug-bash list is curated for value, not completeness.

## API Surface

### Affected Files

| Path                                                       | Change Type | Description                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` `devDependencies`                           | Modified    | Add `@stryker-mutator/core`, `@stryker-mutator/typescript-checker`, `@stryker-mutator/vitest-runner`                                                                                                             |
| `package.json` `scripts.test:mutation`                     | Created     | `stryker run`                                                                                                                                                                                                    |
| `package.json` `scripts.test:mutation:incremental`         | Created     | `stryker run --incremental` (for local re-runs against a partial scope)                                                                                                                                          |
| `stryker.conf.mjs`                                         | Created     | Stryker config: mutate `src/**/*.ts` excluding tests/types/.d.ts; `vitest` runner; `coverageAnalysis: "perTest"`; thresholds `{ high: 90, low: 80, break: 80 }`; concurrency 4                                   |
| `.github/workflows/mutation.yml`                           | Created     | Weekly cron (Sundays 02:00 UTC) + `workflow_dispatch`; runs `pnpm test:mutation`; uploads `reports/mutation/mutation.html` as artifact                                                                           |
| `tests/regression/`                                        | Created     | New directory for bug-bash regression tests                                                                                                                                                                      |
| `tests/regression/README.md`                               | Created     | One-paragraph explainer + how to add a new entry                                                                                                                                                                 |
| `tests/regression/<short-id>-<topic>.test.ts` (≥ 10 files) | Created     | Each named after the historical PR/F-ID it protects (e.g., `pr-117-config-safe-parse.test.ts`, `pr-126-react-ref-typing.test.ts`); file header documents the bug; test fails when the historical fix is reverted |
| `scripts/bug-injection-gate.md`                            | Created     | Runbook for the one-time procedure: which 5 bugs, where to plant them, how to run, how to record the result                                                                                                      |
| `tests/AGENTS.md`                                          | Modified    | New section "Regression suite" documenting the `tests/regression/` directory and the convention                                                                                                                  |

### Pipeline Changes

This cluster does **not** modify the `ci.yml` quality job (mutation testing is too slow for per-PR). It introduces a separate `mutation.yml` workflow on a weekly schedule. The bug-bash regression tests live under `tests/regression/` and are picked up by the existing `pnpm test` glob — they run as part of unit CI on every PR for free.

```
.github/workflows/
├── ci.yml              <-- unchanged by V (Q1/Q2 modify it)
├── release.yml         <-- unchanged
├── maintenance.yml     <-- unchanged
└── mutation.yml        <-- NEW: weekly + manual dispatch
```

`mutation.yml` shape:

```yaml
name: Mutation Testing

on:
  schedule:
    - cron: '0 2 * * 0' # Sundays 02:00 UTC
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: mutation-${{ github.ref }}
  cancel-in-progress: true

jobs:
  mutation:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test:mutation
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: stryker-report
          path: reports/mutation/
          retention-days: 30
```

### Stryker Config Shape

```js
// stryker.conf.mjs
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.unit.config.ts',
  },
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/utils/component-metadata.ts', // generated artifact
  ],
  coverageAnalysis: 'perTest',
  thresholds: { high: 90, low: 80, break: 80 },
  concurrency: 4,
  reporters: ['html', 'progress', 'clear-text'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  timeoutMS: 30000,
  disableTypeChecks: 'src/**/*.ts',
  // Stryker's TS checker uses the project tsconfig; we already have tsc in CI separately.
};
```

`disableTypeChecks` is on because Stryker's mutators introduce intentionally-broken code; type errors during a mutation run are noise, not signal. Type safety is enforced separately by `pnpm type-check` and `pnpm check:tests` (Q1).

## Behavior & Edge Cases

### Reading a Stryker report

The HTML report at `reports/mutation/mutation.html` shows:

- **Mutation score** — overall and per-file. Target ≥ 80% overall.
- **Survived mutants** — code mutations no test killed. Each survivor is a "your test suite would not catch this change." Action: write a test, or accept the mutant if it's semantically equivalent (rare in practice; almost always a real gap).
- **Timeout / runtime errors** — mutations that hung or crashed. Usually means the mutation broke an invariant the test runner depends on. Investigate, exclude if false-positive.
- **No-coverage mutants** — code paths no test executed. Stryker's `coverageAnalysis: 'perTest'` mode reports these as the highest-priority gaps.

### How to add a new bug-bash regression test

1. Pick a historical bug from `~/.claude/projects/kigumi-cli-overview.md` (DONE F-IDs) or recent merged PRs.
2. Read the original PR's diff. Identify what changed and why.
3. Write a test in `tests/regression/<short-id>-<topic>.test.ts`. The test should fail against the _pre-fix_ state of the code and pass against the _post-fix_ state. File header:

   ```ts
   /**
    * Protects: PR #117 (config safe-parse F-037)
    * Bug: kigumi init crashed with TypeError when config had unknown top-level keys
    * Fix: wrap loadConfig in safeParse + ConfigInvalidError
    */
   ```

4. Verify on a scratch branch: `git revert <fix-commit>`, run the test, confirm it fails. Restore.
5. Commit alongside the original fix-tracking infrastructure; reference the original PR/F-ID in the commit message.

### Curation criteria for the initial 10+ entries

Pick bugs that:

- Were user-visible (crashed the CLI, produced wrong output, silently corrupted state).
- Had a non-trivial fix (more than a typo).
- Cover a structural area the rest of the suite already touches (config loading, template generation, registry resolution, theme application, init flow).
- Span multiple PRs/F-IDs to test the suite's breadth.

Candidate seeds (verify each before committing — the kigumi-cli-overview.md backlog is the source of truth):

- F-037 / PR #117 — config safeParse for malformed input.
- F-064 / PR #134 (Cluster B) — `aliases` removal regression coverage.
- F-072 / PR #126 — React ref typing migration; ensure ref-typing patterns don't regress.
- F-068 — Vue boolean-prop filter; ensure `false` not stripped.
- F-094, F-097, F-102, F-103, F-116 / PR #130 — community-registry schema hardening.
- The init preservation `.length` bug from `project-init-preservation-length-bug` — `Record<string, T>` doesn't have `.length`, fixed in PR #95.
- The `resolveComponents` toLowerCase bug from `project-resolve-components-bug` — multi-word components fail diff/update lookup.
- F-013 / PR — palette tier gating.

The list grows during execution as the curator finds high-value entries. Target ≥ 10; nice-to-have 15-20.

### Bug-injection acceptance procedure (the one-time gate)

Documented as `scripts/bug-injection-gate.md`. Procedure:

1. Branch from the cluster's final commit (no further changes during the gate).
2. Plant 5 bugs across `src/` — pre-defined for repeatability:
   - **B1:** Typo in a default value (e.g., `kigumiConfigSchema.parse({})` returns wrong default for `componentsDir`).
   - **B2:** Off-by-one in a loop in `update.ts` (drops the last installed component when iterating).
   - **B3:** Swap `&&` for `||` in a guard (e.g., `if (config.framework === 'react' && config.tier === 'pro')` → `||`).
   - **B4:** Return-early in an action (`add/index.ts` returns before writing the component file).
   - **B5:** Wrong filename in a template generator (`scripts/generate-react-templates.ts` writes `Buttn.tsx` instead of `Button.tsx`).
3. Each bug is planted as a separate commit on the gate branch (clean revert path).
4. Run the full suite: `pnpm test:all && pnpm test:e2e && pnpm test:integration`. Required: each commit's CI run is red; the failing tests point at the right area.
5. Required outcome: 5/5 mutants caught. If any planted bug ships green:
   - Identify which bug went undetected.
   - Identify the gap (which test class should have caught it).
   - Write a covering test.
   - Repeat the gate (re-plant; re-run).
6. After 5/5: discard the gate branch (do not merge).
7. Record the result in `state/test-infrastructure-hardening-status.md`: kill rate, run date, commit ref of the gate branch tip (so the procedure is replayable if future maintainers want to re-run it before a major release).

## Dependencies

- [ ] Cluster Q1 merged (typed tests; storybook configDir fixed). StrykerJS doesn't strictly need Q1 but the bug-bash tests benefit from typed test code.
- [ ] Cluster Q2 merged (e2e + Vue/Angular CI lanes). The bug-injection gate's "run full suite" step needs CI to actually run all those lanes; the green check is the gate signal.
- [ ] Storage budget for Stryker artifact uploads in CI (~5-50MB per run, weekly = manageable).

## Breaking Changes

None at the consumer level. Internal:

- `pnpm test:mutation` is a new dev-only script.
- `mutation.yml` is a new workflow; its failures don't block PR merges (separate from `ci.yml`).
- `tests/regression/` directory is new; its tests run as part of `pnpm test` (existing unit suite).

## Verification

After this cluster ships:

- [ ] `pnpm test:mutation` runs locally and produces a report at `reports/mutation/mutation.html`.
- [ ] Mutation score ≥ 80% on `src/**` (verified during execution; baseline established by Phase 1).
- [ ] `mutation.yml` workflow exists and runs on schedule + manual dispatch.
- [ ] An artifact `stryker-report` is uploaded on every mutation workflow run.
- [ ] `tests/regression/` exists with ≥ 10 test files; each has a file-header docstring documenting the bug it protects.
- [ ] Each regression test was verified by `git revert` of the original fix on a scratch branch — the test must fail without the fix. (Verified during execution; documented in PR description.)
- [ ] `scripts/bug-injection-gate.md` exists with the runbook.
- [ ] Bug-injection gate executed against the initiative's final state; result recorded in `state/test-infrastructure-hardening-status.md` with date, kill rate, and gate-branch commit ref.
- [ ] If kill rate < 5/5 on first run: gaps identified, covering tests written, gate re-run until 5/5.
- [ ] `tests/AGENTS.md` documents the regression-suite convention.

## Risks

| Risk                                                                                                         | Mitigation                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mutation testing's first run scores < 80%.                                                                   | Acceptable on Phase 1; Phase 1 establishes the baseline. Subsequent phases (especially S, T, U) raise the score. The 80% gate enforces no _regression_ from the baseline; the gate becomes hard once Phase 1 measures actual score.                                                                       |
| Mutation runtime exceeds the 60-minute CI timeout.                                                           | Concurrency tuning (`concurrency: 4`); incremental mode (`stryker run --incremental`); split mutation runs by `src/` subdirectory if needed (e.g., `src/commands/**` separately from `src/utils/**`).                                                                                                     |
| Stryker has integration bugs with vitest 4.x.                                                                | Verify in Phase 1 with a one-off run. Fall back to `coverageAnalysis: 'all'` if `'perTest'` doesn't work. Adopting `@stryker-mutator/vitest-runner@latest` rather than pinning to a specific version.                                                                                                     |
| Bug-bash list curation pulls in low-value tests that bloat the suite.                                        | Curation criteria (above) screens for value. Each entry's PR description must justify it.                                                                                                                                                                                                                 |
| Bug-injection gate becomes pro-forma (someone always plants the same 5 bugs and the suite "trains" on them). | Bug-injection is one-time. The gate-branch is discarded; the planted bugs are not tracked. Future re-runs use new bugs (the 5 listed in the runbook are _examples_; future maintainers can swap them).                                                                                                    |
| The 80% threshold is too high or too low for the actual code shape.                                          | First run sets the baseline. If actual score is, e.g., 72%, document the gap in the PR description and either: (a) raise the threshold to a slightly-above-current level (e.g., 70%) for now and ratchet up, or (b) write the missing tests in this cluster to reach 80%. Decision deferred to execution. |

## Implementation Phases

### Phase 1: Stryker scaffold + baseline measurement

**Files:** `package.json` (`devDependencies` + scripts), `stryker.conf.mjs` (NEW), `.github/workflows/mutation.yml` (NEW).

- Install Stryker packages.
- Write `stryker.conf.mjs`. Verify it parses with `pnpm exec stryker init` if needed (don't run init blindly; it writes a default config that we don't want).
- Add `pnpm test:mutation` script.
- Run `pnpm test:mutation` locally on `main`. Capture baseline mutation score.
- Decide gate threshold based on baseline (target 80%; if baseline is far below, ratchet plan).
- Add `mutation.yml` workflow.
- Push and verify the workflow runs (use `workflow_dispatch` for first run, not the cron).

**Validation:** Stryker run completes; report exists; baseline score captured.

### Phase 2: Curate + write bug-bash regression suite

**Files:** `tests/regression/README.md` (NEW), `tests/regression/<short-id>-<topic>.test.ts` (≥ 10 NEW).

- Read the kigumi-cli-overview.md backlog (DONE F-IDs) + recent merged PRs (#86–#134+).
- Curate ≥ 10 candidate entries per the criteria above.
- For each entry: read the original PR diff, write a regression test, verify on a scratch branch by reverting the fix and confirming the test fails.
- File-header docstring per test documenting the protected PR/F-ID.
- Update `tests/AGENTS.md` with the regression suite section.

**Validation:** All ≥ 10 regression tests pass on `main`; each has been verified on a scratch revert (PR description lists the verifications).

### Phase 3: Bug-injection acceptance gate runbook

**Files:** `scripts/bug-injection-gate.md` (NEW).

- Write the runbook documenting the 5 bug recipes, the procedure, and the recording format.
- Define each of the 5 bugs precisely (file, line, exact diff).
- The runbook is a _document_, not an executable script (the gate is performed manually).

**Validation:** Runbook is concrete enough that a future maintainer can run the gate without re-deriving the bug list.

### Phase 4: Run the bug-injection gate

This is the final acceptance step for the entire test-infrastructure-hardening initiative — runs only after Q1, Q2, R, S, P, T, U have all shipped, and the rest of V's mutation/regression infrastructure is live.

**Files:** None committed. The gate-branch is discarded.

- Branch from the cluster's final commit.
- Plant 5 bugs (1 per commit) per the runbook.
- For each commit, run `pnpm test:all && pnpm test:e2e && pnpm test:integration`. Required: each is red.
- If any of the 5 commits is green, identify the gap, write a covering test on a separate fix-up PR, then re-run the gate.
- Once 5/5 confirmed: record result in `state/test-infrastructure-hardening-status.md`. Discard the gate branch (do not merge).

**Validation:** Status dashboard shows kill rate 5/5, run date, gate-branch commit ref.

## Acceptance

- [ ] StrykerJS installed; `stryker.conf.mjs` exists and is valid.
- [ ] `pnpm test:mutation` runs end-to-end locally without errors (it can fail the threshold; it must not error structurally).
- [ ] Mutation score ≥ 80% on the cluster's final commit (or the documented ratcheting plan if baseline was below 80%).
- [ ] `mutation.yml` workflow exists, runs on weekly schedule + manual dispatch, uploads artifact.
- [ ] `tests/regression/` directory exists with ≥ 10 test files; each documents a protected PR/F-ID.
- [ ] Each regression test verified by scratch-branch revert (verifications listed in PR description).
- [ ] `scripts/bug-injection-gate.md` runbook exists; 5 bug recipes defined precisely.
- [ ] Bug-injection gate executed as the final initiative step; 5/5 kill rate confirmed.
- [ ] Result of bug-injection gate recorded in `state/test-infrastructure-hardening-status.md`.
- [ ] `tests/AGENTS.md` documents both `tests/regression/` and the mutation-testing workflow.
- [ ] Status dashboard row for V moved to SHIPPED with PR link.

## Open Questions

- ❓ **Should `mutation.yml` post a comment to a tracking issue when the score drops?** Default: no — the artifact is enough; a maintainer reviewing weekly is the intended audience. Add posting later if signal-to-noise is poor.
- ❓ **Should the 5 bug recipes in the runbook rotate per major release?** Default: yes — different bugs each major release prevents the suite from "training" on a fixed set. The first run uses the 5 listed in the spec; v0.21's release cuts a new 5.
- ❓ **Should we cache Stryker's `.stryker-tmp/` between runs?** Default: no for v1 — caching introduces cross-run state that's hard to debug. Reconsider if runtime is an issue after Phase 1.
- ❓ **Should the bug-bash regression tests be required on every PR or only when relevant files change?** Default: every PR (they live in `tests/unit/` glob — fast). They're cheap.
- ❓ **What is the "right" mutation threshold for kigumi?** Default: 80% baseline; ratchet up over time. Industry norms vary (60-80% is common for application code, 80-90% for library code; kigumi is a CLI tool, leans library). 80% is a defensible starting point.
- ❓ **Should `disableTypeChecks` be off (slower, catches more issues) or on (faster, type errors are noise)?** Default: on — Stryker's mutators intentionally introduce type errors; treating them as failures pollutes the score. `pnpm type-check` + `pnpm check:tests` enforce types separately.

## Pairs With

- **Cluster Q1** — typed tests give Stryker a stable target; bug-bash regression tests are type-checked.
- **Cluster S** — mock reduction directly improves mutation score (mocked tests trivially "pass" against mutants because mocks don't exercise mutated code). The S → V order means S's improvements are visible in V's measurements.
- **Cluster T** — fast-check property tests are excellent mutant killers; T's adoption raises the mutation score before V's gate runs.
- **Cluster R** — snapshot-diff of starter output is a complementary form of evidence (catches "the generated React component template changed unexpectedly"). R + V together cover both _behavior_ (V) and _output_ (R).

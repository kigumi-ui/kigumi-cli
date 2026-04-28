# Cluster Q1: Test Foundation — Specification

> Make `tests/**` first-class TypeScript and unblock the Storybook test surface. Every other cluster in the test-infrastructure-hardening initiative builds on this.

**Type:** Build/Infra
**Status:** Draft
**Author:** Mischa
**Date:** 2026-04-29
**Initiative:** [`test-infrastructure-hardening`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**F-IDs:** F-132 (tests/ not type-checked), F-050 (vitest storybook configDir wrong), F-052 (lint configs glob too narrow)
**Blocks:** Q2, S, P, T, U, V (all other initiative clusters depend on Q1)
**Branched from:** `origin/main`

## Overview

`tests/**` is currently outside TypeScript's reach. Root `tsconfig.json:18` declares `include: ["src/**/*"]`; vitest runs through esbuild with type-stripping but no type-_checking_. PR #134's reviewer caught 13 stale `aliases` test fixtures via textual `grep` — the type checker should have caught them. F-132 measured 132 latent type errors when `tests/**` is included.

Two adjacent gaps compound the problem:

- `vitest.config.ts:43` — the storybookTest plugin's `configDir` points at `path.join(dirname, '.storybook')`. The actual config lives at `docs/.storybook/`. The Storybook project silently fails to load every time someone runs `pnpm test:all`. F-050.
- `package.json:53-56` — lint and format scripts cover `src tests templates` and `src/**/* tests/**/* *.{js,json,md}` respectively. They do **not** cover `*.config.{js,ts}` (vitest configs, tsup config, eslint config, postcss config, etc.) or `templates/**` for prettier. F-052.

Together these three findings prevent the rest of the initiative from being built on a real foundation. Cluster S would refactor mock-heavy tests against an unchecked test surface; Cluster T would add fast-check generators that the type system can't verify; Cluster U would author `play()` functions in stories the storybook test runner can't load.

This cluster ships the foundation. It does not fix every test type error in one PR — F-132's claim of 132 latent errors is too big to land atomically. The hybrid approach: gate against _new_ type errors first via a baseline allowlist, then chunk fixes across follow-up PRs within the cluster.

## Goals

- **Tests type-check on every PR.** A new `pnpm check:tests` script invokes `tsc --noEmit` against a `tsconfig.tests.json` that includes `tests/**`. Wired into the existing CI Quality Checks job and the local stop hook.
- **Baseline allowlist instead of big-bang fix.** Existing 132 errors are recorded once in a baseline file; CI fails on any new error that isn't in the baseline. Subsequent sub-PRs within this cluster shrink the baseline to zero.
- **Storybook test surface loads.** One-line `vitest.config.ts` fix points `configDir` at `docs/.storybook`. `pnpm test:all` shows the storybook project loaded and runs the (zero-`play()`) stories without immediately failing.
- **Lint covers config files.** `eslint.config.js` and the `lint`/`format` script globs cover `*.config.{js,ts}` so vitest configs, tsup config, and friends are linted and formatted.
- **No new dependencies.** All three fixes use tooling already in the repo (TypeScript, ESLint, Prettier, vitest).
- **No source-code changes outside `tests/`.** The 132 errors are fixed inside `tests/`; production behavior is unchanged.

## Non-Goals

- **Fix all 132 type errors in this PR.** The baseline allowlist is the gate; chunked fixes are follow-up sub-PRs within the cluster. Acceptable for the cluster to ship across multiple PRs as long as they're sequenced under the cluster's branch base.
- **Type-check `templates/**`.** Already covered by `pnpm typecheck:templates` (separate per-framework tsconfigs). Out of scope for this cluster.
- **Type-check `docs/**`.** Has its own `docs/tsconfig\*.json` files; covered separately.
- **Type-check `scripts/**`.** Build-time scripts run via `tsx`, not as part of CI's `tsc`. Add to a follow-up cluster if needed.
- **Strict mode upgrades.** `tsconfig.tests.json` extends the root and inherits its strictness. No new strict flags.
- **Ban `vi.mock` or measure mock count.** Cluster S's job.
- **Add `play()` functions to stories.** Cluster U's job. Q1 only ensures the storybook project _can_ load; stories are still render-only after Q1.
- **Fix the F-051 e2e timeout regression in `pnpm test:all`.** Cluster Q2's job.

## API Surface

### Affected Scripts

| Script                                | Change Type | Description                                                                                                                                         |
| ------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` `scripts.check:tests`  | Created     | `tsc --noEmit -p tsconfig.tests.json` (with the baseline check wrapper, see "Behavior" below)                                                       |
| `package.json` `scripts.type-check`   | Modified    | Becomes `tsc --noEmit && pnpm typecheck:templates && pnpm check:tests` (existing two-step expanded to three)                                        |
| `package.json` `scripts.lint`         | Modified    | `eslint src tests templates` → `eslint src tests templates "*.config.{js,ts}" "scripts/**/*.ts"`                                                    |
| `package.json` `scripts.lint:fix`     | Modified    | Mirror `lint` change with `--fix`                                                                                                                   |
| `package.json` `scripts.format`       | Modified    | Add `"*.config.{js,ts}"` to the prettier glob                                                                                                       |
| `package.json` `scripts.format:check` | Modified    | Add `"*.config.{js,ts}"` to the prettier glob                                                                                                       |
| `tsconfig.tests.json`                 | Created     | Extends root; `include: ["tests/**/*", "src/**/*"]`; `noEmit: true`; `rootDir` removed (root sets `./src` which conflicts with the broader include) |
| `vitest.config.ts:43`                 | Modified    | `configDir: path.join(dirname, '.storybook')` → `path.join(dirname, 'docs/.storybook')`                                                             |
| `eslint.config.js`                    | Modified    | Add a config block enabling rules for `*.config.{js,ts}` if any new violations surface                                                              |
| `tests/.tsc-baseline.json`            | Created     | JSON map of `<file>:<line> -> <error code>` for the 132 existing errors. New errors not in this map fail CI.                                        |
| `scripts/check-tests-baseline.ts`     | Created     | Wrapper that runs `tsc --noEmit -p tsconfig.tests.json`, parses output, diffs against the baseline, and exits non-zero on novel errors              |
| `.github/workflows/ci.yml:53-54`      | Modified    | Add `Type-check tests` step after `Type-check templates`, running `pnpm check:tests`                                                                |
| `.claude/hooks/stop-quality-check.sh` | Modified    | When files under `tests/**` changed, also run `pnpm check:tests`                                                                                    |
| `tests/AGENTS.md`                     | Modified    | Document the type-check story so contributors know how to run it locally and how to grow/shrink the baseline                                        |

### Pipeline Changes

Today's CI Quality Checks job (`.github/workflows/ci.yml:24-60`):

```
1. Lint                       (pnpm lint)
2. Format check               (pnpm format:check)
3. TypeScript strict check    (npx tsc --noEmit)            <-- src/ only
4. Type-check templates       (pnpm typecheck:templates)
5. Validate Registry          (pnpm validate:registry)
6. Validate Templates         (pnpm validate:templates)
```

After this PR:

```
1. Lint                       (pnpm lint)                    <-- now also lints config files
2. Format check               (pnpm format:check)            <-- now also checks config files
3. TypeScript strict check    (npx tsc --noEmit)             <-- still src/ only
4. Type-check templates       (pnpm typecheck:templates)
5. Type-check tests           (pnpm check:tests)             <-- NEW: tests/ + baseline gate
6. Validate Registry          (pnpm validate:registry)
7. Validate Templates         (pnpm validate:templates)
```

CI runtime delta: ~5-10s for the new typecheck step (tests/ is small relative to src+templates, baseline diff is fast). No cold-cache delta — no new dependencies.

## Behavior & Edge Cases

### How the baseline allowlist works

`scripts/check-tests-baseline.ts` runs `tsc --noEmit -p tsconfig.tests.json` and captures stderr. TypeScript's diagnostic output is parseable: each line is `<file>(<line>,<col>): error TS<code>: <message>`. The wrapper:

1. Parses each error into `{ file, line, code }`.
2. Reads `tests/.tsc-baseline.json` (a sorted JSON object: `{ "<file>:<line>": "<code>", ... }`).
3. Computes the diff: errors present in current run but not in baseline → fail. Errors in baseline but absent in current run → success (the baseline shrinks; emit a note suggesting the user regenerate the baseline).
4. Exits 0 if no novel errors; exits 1 with a focused list of novel errors otherwise.

A second mode `pnpm check:tests --update-baseline` regenerates `tests/.tsc-baseline.json` from the current run. Runs only on intent; never automatic.

This pattern follows the same shape as ESLint's `--max-warnings` baseline approach and is well-known for incremental adoption of strict checks.

### What gets added to the baseline at land time

Per F-132's measurement: 132 errors. Distribution (approximate, validated during Phase 1):

- ~80% partial-options calls (`addCommand({cwd: '...'})` where the type requires the full options shape; Zod fills defaults at runtime making tests green).
- Wrong-shape `KigumiConfig` fixtures.
- Missing required `Check` fields.
- Mismatched `vi.fn` overloads.
- One discriminated-union member access.

The baseline records each `<file>:<line> -> <code>` exactly. If a future test author "fixes" an error in the baseline, the wrapper notes the shrinkage (good); if they remove a test file with allowlisted errors, the baseline still validates (the entries no longer exist in current output, baseline records absence).

### What happens when a test file moves

Moves change the path key in the baseline. The wrapper's diff treats the move as "old entry disappeared (fine), new entry appeared (fail unless added to baseline)". Practical fix: regenerate baseline as part of any move PR. Documented in `tests/AGENTS.md`.

### What happens when a `tsc` upgrade introduces new error codes

A TS minor upgrade can flag new errors. The baseline wrapper treats those as novel — they fail CI. The fix is to either fix the new errors or expand the baseline (with the upgrade PR description explaining why). Acceptable: TS upgrades are intentional and the surfaced errors are real.

### What happens when the `vitest` storybook project actually loads (post-F-050)

After the configDir fix, the storybook project loads against the 75 stories at `docs/src/stories/**`. None have `play()` functions. The project will run them as render-only smoke tests. Expected result: all 75 stories render in headless Chromium without error. If a story crashes on render (e.g., missing decorator, broken import), CI fails — that's the intended signal. F-050 is a correctness fix, not a behavior change.

If any of the 75 stories crash on render after the fix, the failures are tracked as Q1 sub-tasks (likely small — render-only failures usually mean a story import or decorator is broken, fixable in minutes). Cluster U's job is to add `play()` functions on top.

### What happens when lint scope expands to config files

The new `*.config.{js,ts}` glob may surface lint violations in `vitest.config.ts`, `vitest.unit.config.ts`, `vitest.integration.config.ts`, `tsup.config.ts`, `eslint.config.js`. Likely findings: unused imports, prefer-const, ESM/CJS inconsistencies. The fix is to address each violation in this PR. If a violation is a false positive specific to config files, add a targeted ESLint config block at the bottom of `eslint.config.js` (modeled on the existing flat-config layering).

## Dependencies

- [x] PR #134 merged (Cluster B schema cleanup; the 13 stale `aliases` fixtures it caught are out of scope here, but their existence is the motivation).
- [ ] No code-level dependencies. Q1 is the foundation cluster.

## Breaking Changes

None at the consumer level. Only dev-time guarantees and CI signal change.

For contributors:

- `pnpm type-check` now runs three sub-checks (root `src/`, templates, tests) instead of two. Runtime delta: ~5-10s.
- `pnpm lint` and `pnpm format:check` cover config files. May surface new lint findings; resolved within this PR.
- `pnpm check:tests` is a new script. CI uses it; local devs can run it directly when iterating on `tests/**`.

## Verification

After this cluster ships (potentially across multiple sub-PRs):

- [ ] `pnpm check:tests` exits 0 on the cluster's final commit (or only against the baseline). Final sub-PR shrinks the baseline to zero entries.
- [ ] `tests/.tsc-baseline.json` does not exist after the final sub-PR (or contains an empty object). CI gate passes without needing the wrapper.
- [ ] CI Quality Checks job shows the new `Type-check tests` step green on every PR going forward.
- [ ] `pnpm test:all` shows the storybook project loaded (verify with `vitest --reporter=verbose | grep storybook`).
- [ ] None of the 75 existing stories crash on render after the F-050 fix; if any do, they're fixed in this cluster.
- [ ] `pnpm lint` and `pnpm format:check` cover all `*.config.{js,ts}` files (verify by deliberately introducing a violation in `vitest.config.ts` on a scratch branch).
- [ ] Stop hook runs `check:tests` when files under `tests/**` are changed (manual verification: edit a test, save, observe hook output).
- [ ] `tests/AGENTS.md` documents the baseline workflow and how to update it.
- [ ] PR description includes:
  - Initial baseline size (131-132 entries).
  - Per-sub-PR shrink trajectory if landed across multiple PRs.
  - Final baseline size (0).

## Risks

| Risk                                                                                                                                          | Mitigation                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The 132-error baseline includes errors that should have been caught in past PRs (regression risk if we add the baseline and never shrink it). | The cluster is not declared SHIPPED until the baseline is empty. Sub-PRs explicitly track shrinkage in their description.                                                                                   |
| The baseline wrapper has bugs (false negatives mask real errors, false positives block PRs).                                                  | Phase 5 includes targeted unit tests for the wrapper itself: feed a synthetic baseline and synthetic `tsc` output, assert correct diff.                                                                     |
| F-050's storybook-load fix surfaces multiple story crashes that bloat the cluster.                                                            | Triage each crash. If it's a 1-line decorator/import fix, include in Q1; if it's behavioral (e.g., a component change broke the story), defer to Cluster U (where `play()` work happens) and document.      |
| Lint scope expansion to config files breaks an unfamiliar rule (e.g., `vitest.config.ts` has a CJS-ism).                                      | Each violation is fixed in this PR. If a false positive specific to a config file pattern surfaces, add a narrow `files: [...]` config block in `eslint.config.js` rather than disabling the rule globally. |
| `tsconfig.tests.json` `rootDir` conflict with `src/` include.                                                                                 | Root tsconfig sets `rootDir: ./src`; the new tests tsconfig overrides via `compilerOptions: { rootDir: undefined }` or omits `rootDir` entirely. Verified during Phase 1 by running `tsc --showConfig`.     |
| The 132-error count is stale (Cluster B's PR may have changed it).                                                                            | Phase 1's first task is regenerating the baseline against current `main`. The 132 figure is a starting point, not a contract.                                                                               |

## Implementation Phases

All phases ship under one cluster branch base; sub-PRs are allowed but not required.

### Phase 1: Foundation + baseline (1 PR)

**Files:** `tsconfig.tests.json` (NEW), `package.json` (scripts), `scripts/check-tests-baseline.ts` (NEW), `tests/.tsc-baseline.json` (NEW, ~132 entries), `.github/workflows/ci.yml` (1 new step), `.claude/hooks/stop-quality-check.sh` (1 added branch), `tests/AGENTS.md` (new section).

- Add `tsconfig.tests.json` extending root with `include: ["tests/**/*", "src/**/*"]` and `noEmit: true`.
- Write `scripts/check-tests-baseline.ts` wrapper. Cover `--update-baseline` mode + the diff mode.
- Run `pnpm tsx scripts/check-tests-baseline.ts --update-baseline` to seed `tests/.tsc-baseline.json`.
- Add `pnpm check:tests` script (default mode: diff against baseline, fail on novel).
- Update `pnpm type-check` to chain `pnpm check:tests`.
- Add the `Type-check tests` step to CI's quality job.
- Update stop hook to run `check:tests` when `tests/**` changes.
- Document workflow in `tests/AGENTS.md`.

**Validation:** `pnpm check:tests` exits 0 (no novel errors). CI Quality job shows the new step. Stop hook runs the script when a test file is touched.

### Phase 2: F-050 storybook configDir fix (same PR or follow-up)

**Files:** `vitest.config.ts:43` (1 line).

- `configDir: path.join(dirname, '.storybook')` → `path.join(dirname, 'docs/.storybook')`.
- Run `pnpm test:all` and observe the storybook project loaded (vitest output mentions `storybook` project).
- If any of the 75 stories crash on render, triage in this phase or defer.

**Validation:** `pnpm test:all` includes the storybook project (no longer silently skipped). All 75 stories render without crash.

### Phase 3: F-052 lint/format config glob (same PR or follow-up)

**Files:** `package.json` (`lint`, `lint:fix`, `format`, `format:check`), `eslint.config.js` (optional config block).

- Update lint glob: `eslint src tests templates "*.config.{js,ts}" "scripts/**/*.ts"`.
- Update format/format:check globs to include `"*.config.{js,ts}"`.
- Run `pnpm lint && pnpm format:check`. Fix any new violations surfaced in config files.
- If a violation is a false positive specific to config files, add a `files: [...]` block at the end of `eslint.config.js`.

**Validation:** `pnpm lint && pnpm format:check` exit 0 against the new globs. CI Quality job's lint and format:check steps green.

### Phase 4: Chunked baseline shrinkage (1+ follow-up sub-PRs)

**Files:** `tests/**` (the offending test files), `tests/.tsc-baseline.json` (shrinks each PR).

- Group baseline entries by file or by error category. Pick a chunk (e.g., 20-30 entries) per sub-PR.
- Fix the type errors. Regenerate the baseline. Open sub-PR with shrink count in description.
- Repeat until baseline is empty.
- Final sub-PR deletes `tests/.tsc-baseline.json` and the wrapper's `--update-baseline` mode (or leaves it for future use).

**Validation per sub-PR:** baseline shrunk; CI green; no novel errors introduced (the wrapper enforces this automatically).

### Phase 5: Wrapper hygiene (in Phase 1 PR or as a follow-up)

**Files:** `tests/unit/scripts/check-tests-baseline.test.ts` (NEW).

- Unit tests for the wrapper: feed a synthetic baseline + synthetic `tsc` output, assert the diff is correct.
- Cases: novel error fails; baseline-only error passes (and emits shrink suggestion); same-as-baseline passes; moved file fails (until baseline regenerated).

**Validation:** wrapper has direct test coverage; `pnpm test` includes the new file.

## Acceptance

- [ ] `pnpm check:tests` exists in `package.json` scripts.
- [ ] `tsconfig.tests.json` exists, extends root, includes `tests/**`.
- [ ] `scripts/check-tests-baseline.ts` exists with `--update-baseline` and default diff modes.
- [ ] `tests/.tsc-baseline.json` initially seeded with the existing 132 errors; final state is empty (or file deleted).
- [ ] CI Quality Checks job runs `Type-check tests` step on every PR.
- [ ] Stop hook runs `check:tests` when files under `tests/**` change.
- [ ] `vitest.config.ts:43` points at `docs/.storybook`; `pnpm test:all` shows storybook project loaded.
- [ ] All 75 stories render without crash post-F-050 fix.
- [ ] `pnpm lint` covers `*.config.{js,ts}` and `scripts/**/*.ts`; exits 0.
- [ ] `pnpm format:check` covers `*.config.{js,ts}`; exits 0.
- [ ] `tests/AGENTS.md` documents the baseline workflow.
- [ ] Wrapper has direct unit-test coverage in `tests/unit/scripts/check-tests-baseline.test.ts`.
- [ ] All phases SHIPPED; status dashboard row for Q1 moved to SHIPPED with PR link(s).

## Open Questions

- ❓ **Should the baseline live at `tests/.tsc-baseline.json` (alongside test source) or `.tsc-baseline.tests.json` at the repo root?** Default: `tests/.tsc-baseline.json` so it's clearly scoped. Open to repo-root if reviewers prefer.
- ❓ **Should the wrapper use a real diff library or hand-rolled JSON-set comparison?** Default: hand-rolled (the data shape is trivial; no need for a dep). Reconsider if the wrapper grows in scope.
- ❓ **Should the `--update-baseline` mode auto-run in CI on a special PR label (e.g., `update-tests-baseline`)?** Default: no — manual runs only, to prevent drift from sneaking in unnoticed.
- ❓ **Should `tests/integration/**`and`tests/e2e/**`use the same`tsconfig.tests.json` or get their own?** Default: same. Both directories are TypeScript and benefit from the same checks. If integration's spawned subprocess code needs different lib settings, override at file level via triple-slash directives rather than splitting tsconfigs.

## Pairs With

- **Cluster A (config lifecycle hardening)** — once tests are type-checked, A's `.strict()` adoption gets type-system enforcement on its config fixtures. Land Q1 first; A's spec mentions this as a "pairs naturally with" relationship without ordering dependency.
- **Cluster B (PR #134, schema cleanup)** — already shipped. Its 13 stale `aliases` fixtures motivated F-132. Q1 closes the safety-net gap that allowed those to slip through.

# Cluster S: Mock Reduction - Specification

> Replace `vi.mock` theatre with real seams and targeted fakes so `tests/unit/` measures behavior against the actual production code paths instead of fictional mocks. Reduces `grep -rn 'vi\.mock' tests/unit | wc -l` from 238 to under 50, with the heaviest file (`theme-commands.test.ts`) under 10.

**Type:** Build/Infra
**Status:** Draft
**Author:** Mischa
**Date:** 2026-05-02
**Initiative:** [`test-infrastructure-hardening`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**F-IDs:** F-126 (full)
**Depends on:** Q1 (shipped, PR #137) - `pnpm check:tests` ensures refactored tests stay type-safe.
**Blocks:** v0.20.0 release (Initiative acceptance criterion #3).
**Branched from:** `origin/main` at d12d9348 (cluster P phase 3 merged).
**No file overlap with:** Cluster P (P touches `vitest.unit.config.ts`, `tests/integration/helpers.ts`, three new selector tests, three new init-helper tests, four new script tests; cluster S touches existing test files plus a new `tests/unit/_helpers/{prompts,tier}.ts` and an extension to the existing `tests/unit/_helpers/output.ts`).

## Overview

`tests/unit/` is dominated by `vi.mock` calls that replace whole modules with hand-written fakes. The pattern repeats: every test that touches a CLI command mocks `@clack/prompts` (silence prompts), `src/output/index.js` (silence output), and `src/utils/tier.js` (control free/pro mode). The result is 238 `vi.mock`-substring matches across 33 files, with the worst offender (`theme-commands.test.ts`) at 37 matches in a 1090-line file.

Three problems compound:

1. **Mocks drift from reality.** Each `vi.mock` factory hand-rolls a return shape. When the real module gains a method, the mock factory does not - so tests pass against a fictional API. Q1's allowlisted-then-shrunk type errors in `tests/**` are partly a symptom: the type checker can't verify mock factories against the real module types.
2. **Tests assert on mock interactions, not behavior.** A test that asserts `vi.mocked(p.confirm).toHaveBeenCalledWith('Continue?')` proves only that the production code passes that string - not that the user-visible flow works. The mock's identity becomes the test target.
3. **Refactor cost is high.** Renaming a function in `src/output/console.ts` (e.g., `warning` → `warn`) requires touching every test file that mocked it. `vi.mock` factories are write-only artifacts maintained by hand.

This cluster lands four PRs that systematically replace mocked seams with one of three patterns:

- **Production DI hooks** - small additions to `src/output/index.ts` and (new) `src/prompts/index.ts` that allow tests to register a recording or scripted instance via `setOutputForTesting()` / `setPromptsForTesting()`. Modeled on the existing `src/output/` module structure.
- **Real fixtures over mocks** - `src/utils/tier.ts` is driven by package.json contents (the production code reads `package.json` to detect tier, see `src/utils/tier.ts:44-58`). Tests write a real `package.json` to a temp dir, then call the production function unmocked. No `vi.mock` needed.
- **Targeted fakes via `vi.spyOn`** - when a single function in a real module needs scripted return values for one test (e.g., `getVersionEntry` in version-map for upgrade tests), use `vi.spyOn(module, 'fn').mockResolvedValue(...)` inside `beforeEach`. This does NOT match the `vi.mock` substring, and unlike `vi.mock` it preserves the rest of the module's real behavior.

The cluster does not blanket-ban `vi.mock`. Two cases legitimately need it: (a) `execa` and `child_process` for tests that must not actually shell out, and (b) third-party SDKs whose behavior is irrelevant to the test once the wrapper migration is complete. The `<50` target leaves room for ~30 legitimate mocks.

## Goals

- `grep -rn 'vi\.mock' tests/unit | wc -l` returns under 50.
- `tests/unit/theme-commands.test.ts` substring count under 10 (currently 37).
- No test file regresses on coverage by more than 1 percentage point versus the pre-PR-S1 measurement.
- Three sibling helpers in the existing `tests/unit/_helpers/` directory: `output.ts` (extended with `createRecordingOutput()`), new `prompts.ts`, new `tier.ts`. The Q1-era `createTestOutput()` keeps its existing signature so its 4 current consumers stay green without edits.
- `src/output/index.ts` exports `setOutputForTesting(output)` and `resetOutputForTesting()`. Production calls to `getOutput()` are unchanged.
- `src/prompts/index.ts` (new module) wraps the subset of `@clack/prompts` the CLI actually uses (`intro`, `outro`, `note`, `log`, `confirm`, `select`, `text`, `multiselect`, `spinner`, `isCancel`) and exposes `setPromptsForTesting(adapter)` / `resetPromptsForTesting()`. Every command-side import of `@clack/prompts` migrates to `src/prompts` (one PR per cluster of commands).
- `tests/AGENTS.md` documents the testing-helper pattern and lists the legitimate-use exceptions to `vi.mock`.
- A regression gate prevents the substring count from climbing back above 50: `scripts/check-mock-budget.ts` (new, runs in CI). Advisory through PR-S3, enforced from PR-S4.

## Non-Goals

- **Eliminating `vi.mock` entirely.** Network calls, child-process spawning, and similar boundaries still warrant `vi.mock`. Target is <50, not 0.
- **Touching `tests/integration/`, `tests/e2e/`, or `tests/fixtures/`.** Those are subprocess tests and use real binaries already. Out of scope.
- **Adding new tests.** Every refactored file's assertion set is preserved or strengthened, not expanded. New coverage is cluster P's job (already shipping).
- **Rewriting commands to use dependency injection at the call-site level.** The `setOutputForTesting` / `setPromptsForTesting` hooks are module-level registrations, identical in shape to the existing `src/output/` pattern. No command signature changes.
- **Banning `vi.mock` via lint rule for arbitrary modules.** The mock-budget script is a count gate, not a per-import allowlist.
- **Migrating `@clack/prompts` to a different prompts library.** The wrapper module just re-exports + adds DI hooks; behavior is identical.
- **Touching cluster A's `.strict()` adoption.** A is independent. If a cluster S test fixture happens to expose a strict-mode issue, file an A-scope follow-up; do not fix it here.
- **Introducing a parallel `tests/helpers/` directory.** Q1 shipped helpers at `tests/unit/_helpers/` and 4 tests already use them. We extend that path; we do not duplicate it.

## API Surface

| File                                                                                                                                                                                 | Change Type         | Description                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/output/index.ts`                                                                                                                                                                | Modified            | Add `setOutputForTesting(output)`, `resetOutputForTesting()`. `getOutput()` returns the registered instance if set, else `new ConsoleOutput()`.                                           |
| `src/prompts/index.ts`                                                                                                                                                               | Created             | Wrapper around `@clack/prompts`; exports the used subset + `setPromptsForTesting(adapter)` + `resetPromptsForTesting()`.                                                                  |
| `src/prompts/types.ts`                                                                                                                                                               | Created             | `PromptsAdapter` interface (mirrors clack's used surface).                                                                                                                                |
| `src/commands/theme.ts`                                                                                                                                                              | Modified (PR-S1)    | Replace `import * as p from '@clack/prompts'` with `import * as p from '../prompts/index.js'`.                                                                                            |
| `src/commands/{update,upgrade}.ts`                                                                                                                                                   | Modified (PR-S2)    | Same migration. (`src/commands/diff.ts` was originally listed here but never imported `@clack/prompts` — no production change required.)                                                  |
| `src/commands/{brand,palette}.ts`, `src/commands/init/{config-builder,existing-config,index}.ts`, `src/commands/add/*.ts`, `src/commands/registry/{add-component,add-theme,init}.ts` | Modified (PR-S3/S4) | Same migration.                                                                                                                                                                           |
| `tests/unit/_helpers/output.ts`                                                                                                                                                      | Modified            | Add sibling `createRecordingOutput()` returning a `RecordingOutput` (typed `calls` array). Existing `createTestOutput()` keeps its `vi.fn()`-based signature for its 4 current consumers. |
| `tests/unit/_helpers/prompts.ts`                                                                                                                                                     | Created             | `createTestPrompts(scripts)` returns a scripted `PromptsAdapter`. Throws "Unexpected prompt" if scripts deplete.                                                                          |
| `tests/unit/_helpers/tier.ts`                                                                                                                                                        | Created             | `writeTierFixture(dir, 'free' \| 'pro')` writes a minimal `package.json` to a temp dir.                                                                                                   |
| `tests/unit/theme-commands.test.ts`                                                                                                                                                  | Modified (PR-S1)    | Drop 7 `vi.mock` decls, switch to helpers + tier fixture + `vi.spyOn` for residual module-fakes. Substring count target < 10.                                                             |
| `tests/unit/{update,upgrade,diff,diff-roundtrip}-command.test.ts` (PR-S2), `installer.test.ts` family (PR-S3), `init-tier-migration.test.ts` (PR-S3), 11 lighter files (PR-S4)       | Modified            | Same refactor pattern.                                                                                                                                                                    |
| `scripts/check-mock-budget.ts`                                                                                                                                                       | Created             | Counts `grep -rn 'vi\.mock' tests/unit \| wc -l` and per-file count for `theme-commands.test.ts`. Advisory by default; enforced when `MOCK_BUDGET_ENFORCE=1` (set in CI from PR-S4).      |
| `package.json` `scripts.check:mocks`                                                                                                                                                 | Created             | `tsx scripts/check-mock-budget.ts`.                                                                                                                                                       |
| `.github/workflows/ci.yml`                                                                                                                                                           | Modified            | Add `Check mock budget` step in the existing Quality Checks job after `Type-check tests`.                                                                                                 |
| `.claude/hooks/stop-quality-check.sh`                                                                                                                                                | Modified            | Append `pnpm check:mocks` to the test-only fast path (`HAS_TEST_CHANGES && !HAS_SRC_CHANGES`).                                                                                            |
| `tests/AGENTS.md`                                                                                                                                                                    | Modified            | Document the helpers, the legitimate-use exceptions, and the budget gate.                                                                                                                 |
| `docs/superpowers/state/test-infrastructure-hardening-status.md`                                                                                                                     | Modified            | Flip cluster S to IN-PROGRESS at PR-S1 open; flip to SHIPPED with PR links at PR-S4 merge.                                                                                                |

## Pipeline Changes

### Today's shape

- `pnpm test` runs unit + integration. Mocks are file-local; nothing enforces a budget.
- `pnpm check:tests` (Q1) catches type errors in tests but not mock-factory drift.
- No way to inject a test output or test prompts adapter; tests `vi.mock` the modules directly.

### After cluster S

- `src/output/index.ts` and `src/prompts/index.ts` expose registration hooks. Tests register a recording instance in `beforeEach` and reset in `afterEach`. No `vi.mock` for those modules.
- `tests/unit/_helpers/` provides three small, typed helpers used by every command test that needs them. Existing helpers (`output.ts`, `kigumi-config.ts`, `add-options.ts`) keep their current signatures.
- `pnpm check:mocks` runs in CI and locally (via the stop hook). Substring count > 50 or `theme-commands` count > 10 fails the gate (advisory through PR-S3, enforced from PR-S4 forward).
- `tests/AGENTS.md` lists the exceptions: child-process boundary (`execa`, `child_process`), third-party SDKs we have no wrapper for. Reviewers reject new `vi.mock` calls outside the documented exceptions.

## Behavior & Edge Cases

### Output DI

`src/output/index.ts` becomes:

```typescript
import { ConsoleOutput, getOutput as defaultGetOutput } from './console.js';
import type { OutputInterface } from './types.js';

let registeredOutput: OutputInterface | null = null;

export function setOutputForTesting(output: OutputInterface): void {
  registeredOutput = output;
}

export function resetOutputForTesting(): void {
  registeredOutput = null;
}

export function getOutput(): OutputInterface {
  return registeredOutput ?? defaultGetOutput();
}

export type { OutputInterface, OutputSpinner } from './types.js';
export { ConsoleOutput } from './console.js';
```

Production code is unchanged: every site already calls `getOutput()` at the top of each command; it now returns the test instance when one is registered. No new public production API beyond the test hooks.

### Prompts wrapper

`src/prompts/index.ts` re-exports the `@clack/prompts` surface the CLI uses (`intro`, `outro`, `note`, `log`, `confirm`, `select`, `text`, `multiselect`, `spinner`, `isCancel` - confirmed via `grep -rh '\bp\.[a-zA-Z]\+' src/commands/`), plus a registration hook. `log` is exposed as an accessor object whose methods route through `getPrompts().log` at call time, so existing callers can still write `p.log.info(...)` and a swapped adapter takes effect immediately without re-importing. Convenience re-exports route through `getPrompts()` so call sites only change one import line:

```typescript
// Before
import * as p from '@clack/prompts';
// After
import * as p from '../prompts/index.js';
// p.confirm(...) / p.log.info(...) / etc. unchanged
```

### Tier fixture

Production code in `src/utils/tier.ts:44-58` reads `package.json` first, then falls back to token detection. Tests stop mocking the module and instead write a real fixture:

```typescript
// tests/unit/_helpers/tier.ts
import fs from 'fs-extra';
import path from 'path';

export async function writeTierFixture(
  dir: string,
  tier: 'free' | 'pro'
): Promise<void> {
  const pkg = {
    name: 'kigumi-test-fixture',
    version: '0.0.0',
    dependencies: {
      [tier === 'pro'
        ? '@awesome.me/webawesome-pro'
        : '@awesome.me/webawesome']: '*',
    },
  };
  await fs.writeJson(path.join(dir, 'package.json'), pkg);
}
```

The test calls `writeTierFixture(testDir, 'pro')` then `chdir(testDir)`; the unmocked `detectTier()` returns `'pro'`. No `vi.mock`, no `vi.mocked` accessor.

### Recording output

`createRecordingOutput()` is a sibling of the existing `createTestOutput()` in `tests/unit/_helpers/output.ts`. It captures every method call into a typed `calls` array so tests assert against `output.calls.find(...)` instead of `vi.mocked(...).toHaveBeenCalledWith(...)`.

The existing `createTestOutput()` (which uses `vi.fn()` for each method) stays unchanged; the 4 current consumers (`init-tier-migration.test.ts`, `init-file-generator.test.ts`, `init-post-install-instructions.test.ts`, `project-config.test.ts`) need no edits.

### Scripted prompts

`createTestPrompts({ confirm: [true, false], select: ['react'] })` returns an adapter whose `confirm()` returns `true` then `false`, whose `select()` returns `'react'`. If a test calls a prompt that has no scripted answer, the adapter throws `Unexpected prompt: confirm("...")` so missing scripts fail fast and loud.

### Edge case: `vi.resetModules()` and registered instances

Tests like `theme-commands.test.ts` call `vi.resetModules()` in `beforeEach` so each test gets a fresh `Command` object from `commander`. After reset, the `let registeredOutput` in the OLD module-instance of `src/output/index.ts` is stale - the next `await import(...)` re-evaluates the module, getting fresh state.

The pattern: register the instance AFTER `vi.resetModules()`, BEFORE the dynamic command import:

```typescript
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  output = createRecordingOutput();
  prompts = createTestPrompts({ select: ['awesome'] });
  const { setOutputForTesting } = await import('../../src/output/index.js');
  const { setPromptsForTesting } = await import('../../src/prompts/index.js');
  setOutputForTesting(output);
  setPromptsForTesting(prompts);
  // ... rest of setup, including dynamic import of theme command
});

afterEach(async () => {
  const { resetOutputForTesting } = await import('../../src/output/index.js');
  const { resetPromptsForTesting } = await import('../../src/prompts/index.js');
  resetOutputForTesting();
  resetPromptsForTesting();
});
```

Document this in `tests/AGENTS.md`.

### Edge case: `process.exit` in error paths

Several theme/upgrade tests assert `process.exit(1)` was called by replacing `process.exit` with `vi.fn()`. This is unrelated to `vi.mock` and remains unchanged.

### Edge case: third-party module mocks (`@clack/prompts` direct mocks)

After the prompts wrapper migration is complete (PR-S4), no test file should `vi.mock('@clack/prompts')` directly. The mock-budget script can then treat that pattern as a regression. Until then, advisory.

## Inventory (per file, current state on origin/main 2026-05-02)

Substring counts (`vi.mock` regex match) and `vi.mock(` declaration counts:

| File                                                  | Substring |  Decls | Heaviest mock targets                                                            |
| ----------------------------------------------------- | --------: | -----: | -------------------------------------------------------------------------------- |
| `tests/unit/theme-commands.test.ts`                   |        37 |      7 | clack, output, regenerate, tier, github-fetcher, github-token, registry-resolver |
| `tests/unit/init-tier-migration.test.ts`              |        28 |      2 | clack, init/migration                                                            |
| `tests/unit/update-command.test.ts`                   |        18 |      6 | clack, output, diff-renderer, template, registry, registry-cache                 |
| `tests/unit/diff-roundtrip.test.ts`                   |        13 |      6 | clack, output, diff-renderer, template, registry, registry-cache                 |
| `tests/unit/upgrade-command.test.ts`                  |        11 |      7 | clack, output, version-map, ...                                                  |
| `tests/unit/registry-add-theme.test.ts`               |        11 |      4 | clack, output, fs-extra, ...                                                     |
| `tests/unit/registry-add-component.test.ts`           |        10 |      4 | clack, output, fs-extra, ...                                                     |
| `tests/unit/remote-installer.test.ts`                 |         9 |      2 | github-fetcher, output                                                           |
| `tests/unit/palette-command.test.ts`                  |         9 |      4 | clack, output, tier, regenerate                                                  |
| `tests/unit/init-file-generator.test.ts`              |         9 |      - | (uses createTestOutput already)                                                  |
| `tests/unit/registry-router.test.ts`                  |         8 |      - | clack, output                                                                    |
| `tests/unit/registry-init-command.test.ts`            |         7 |      2 | clack, output                                                                    |
| `tests/unit/brand-command.test.ts`                    |         7 |      3 | clack, output, tier                                                              |
| `tests/unit/diff-command.test.ts`                     |         6 |      6 | output, diff-renderer, template, registry, ...                                   |
| `tests/unit/component-installer.test.ts`              |         6 |      5 | output, tier, ...                                                                |
| `tests/unit/status-json.test.ts`                      |         5 |      3 | output, tier, ...                                                                |
| `tests/unit/remote-component-selector.test.ts`        |         5 |      1 | github-fetcher                                                                   |
| `tests/unit/list.test.ts`                             |         5 |      1 | output                                                                           |
| `tests/unit/registry-list-remove-command.test.ts`     |         4 |      2 | clack, output                                                                    |
| `tests/unit/init-config-preservation.test.ts`         |         4 |      4 | clack, output, tier, ...                                                         |
| `tests/unit/component-selector.test.ts`               |         4 |      1 | (single mock)                                                                    |
| `tests/unit/regenerate.test.ts`                       |         3 |      1 | output                                                                           |
| `tests/unit/init-validate-and-prepare.test.ts`        |         3 |      2 | clack, output                                                                    |
| `tests/unit/registry-validate-command.test.ts`        |         2 |      2 | clack, output                                                                    |
| `tests/unit/list-json.test.ts`                        |         2 |      2 | output, ...                                                                      |
| `tests/unit/init-installer.test.ts`                   |         2 |      2 | clack, output                                                                    |
| `tests/unit/init-existing-config.test.ts`             |         2 |      2 | clack, output                                                                    |
| `tests/unit/github-token.test.ts`                     |         2 |      1 | (single token-source mock)                                                       |
| `tests/unit/add-command-cross-framework.test.ts`      |         2 |      2 | clack, output                                                                    |
| `tests/unit/remote-installer-local-source.test.ts`    |         1 |      1 | output                                                                           |
| `tests/unit/remote-installer-cross-framework.test.ts` |         1 |      1 | output                                                                           |
| `tests/unit/registry-connect-command.test.ts`         |         1 |      1 | output                                                                           |
| `tests/unit/add-command.test.ts`                      |         1 |      1 | output                                                                           |
| **Total**                                             |   **238** | **90** |                                                                                  |

Top mocked module targets (declarations):

| Module                              | Declarations |
| ----------------------------------- | -----------: |
| `@clack/prompts`                    |           22 |
| `../../src/output/index.js`         |           14 |
| `../../src/utils/tier.js`           |           13 |
| `../../src/utils/template.js`       |            4 |
| `../../src/utils/registry.js`       |            4 |
| `../../src/utils/registry-cache.js` |            4 |
| `../../src/utils/diff-renderer.js`  |            4 |
| `../../src/utils/regenerate.js`     |            3 |
| `execa`                             |            2 |
| `../../src/utils/github-fetcher.js` |            2 |

The first three (`@clack/prompts`, `output/`, `tier.js`) are 49 of 90 declarations and account for the majority of substring matches via their `vi.mocked(...)` accessor calls.

## PR Decomposition

The cluster ships in four PRs against `main`. Each is independently reviewable and reverts cleanly.

### PR-S1 - Spec + test infrastructure + `theme-commands.test.ts` proof point

- Add this spec file.
- Update `docs/superpowers/state/test-infrastructure-hardening-status.md` to flip cluster S to IN-PROGRESS with the PR link.
- Add `setOutputForTesting` / `resetOutputForTesting` to `src/output/index.ts`.
- Add the prompts wrapper (`src/prompts/index.ts`, `src/prompts/types.ts`).
- Add the helpers as siblings in `tests/unit/_helpers/`: extend `output.ts` with `createRecordingOutput()`, add `prompts.ts` and `tier.ts`.
- Migrate `src/commands/theme.ts` to import from `../prompts/index.js`.
- Refactor `tests/unit/theme-commands.test.ts` to substring count <10. Drop all 7 `vi.mock` declarations; replace residual module-fakes (`regenerate`, `github-fetcher`, `github-token`, `registry-resolver`) with `vi.spyOn`.
- Add `scripts/check-mock-budget.ts` and `pnpm check:mocks` (advisory). Wire into CI Quality Checks job and stop hook.
- Update `tests/AGENTS.md` with the helpers, exceptions, and budget gate.
- Acceptance: substring count after PR-S1 ~190 (down from 238); theme-commands < 10; full unit suite green; coverage delta <1pp on every touched file.

### PR-S2 - Top-tier offenders (update / upgrade / diff)

- Migrate command imports for `update`, `upgrade`, `diff` to `src/prompts`.
- Refactor `tests/unit/update-command.test.ts`, `tests/unit/upgrade-command.test.ts`, `tests/unit/diff-roundtrip.test.ts`, `tests/unit/diff-command.test.ts`.
- Acceptance: substring count ~130.

### PR-S3 - Mid-tier offenders (installer / palette / brand / init / registry-router family)

- Migrate command imports for `add` (installer), `palette`, `brand`, `init/*`, `registry/{add-component,add-theme,init,router}`.
- Refactor `init-tier-migration.test.ts`, `registry-add-{theme,component}.test.ts`, `registry-router.test.ts`, `registry-init-command.test.ts`, `remote-installer.test.ts`, `palette-command.test.ts`, `component-installer.test.ts`, `brand-command.test.ts`, `init-config-preservation.test.ts`, `init-file-generator.test.ts`.
- Switch `remote-installer.test.ts`'s `github-fetcher` mock to `undici.MockAgent` so HTTP-layer behavior is exercised without real network.
- Acceptance: substring count ~70.

### PR-S4 - Polish + budget tightening

- Refactor remaining lighter files (the ~14 with substring count ≤ 5).
- Set `MOCK_BUDGET_ENFORCE=1` in CI so `pnpm check:mocks` exits non-zero on threshold breach.
- Update `state/test-infrastructure-hardening-status.md` to SHIPPED with all four PR links.
- Acceptance: substring count <50; theme-commands <10; budget gate green; full suite + integration suite green.

## Acceptance Criteria

The cluster is SHIPPED when **all** hold simultaneously on `main`:

1. `grep -rn 'vi\.mock' tests/unit | wc -l` returns a value strictly less than 50.
2. `grep -c 'vi\.mock' tests/unit/theme-commands.test.ts` returns a value strictly less than 10.
3. `pnpm check:mocks` exists in `package.json` scripts and exits 0 when invoked from a clean checkout.
4. `pnpm check:mocks` is wired into the CI Quality Checks job and the local stop hook.
5. `MOCK_BUDGET_ENFORCE=1 pnpm check:mocks` exits 0 (gate is enforceable, not just advisory).
6. `pnpm test` (unit) is green.
7. `pnpm test:integration` is green.
8. `pnpm test:coverage` reports no per-file coverage drop greater than 1 percentage point versus the pre-cluster baseline (recorded at the top of PR-S1's description).
9. `tests/AGENTS.md` contains the helpers reference, the legitimate-use exception list, and a one-paragraph budget-gate explainer.
10. `docs/superpowers/state/test-infrastructure-hardening-status.md` shows cluster S as SHIPPED with PR-S1..S4 links.

## Open Questions

- **❓ Prompts wrapper vs. `vi.spyOn`-only.** This spec introduces `src/prompts/index.ts` as a wrapper around `@clack/prompts`. Alternative: leave `@clack/prompts` imports in place and use `vi.spyOn(p, 'confirm').mockResolvedValue(true)` inside `beforeEach`. The wrapper is more invasive (~15 import-site changes across 4 PRs) but mirrors the existing `src/output/` pattern and centralizes prompt UX. **Default chosen here: wrapper.**
- **❓ HTTP boundary fakes.** PR-S3 uses `undici.MockAgent` for `github-fetcher`-driven tests. Alternative: msw. undici ships with Node already; msw adds a dev dep. **Default chosen here: undici.MockAgent.** Final decision deferred to PR-S3.
- **❓ Mock-budget gate enforcement timing.** PR-S1 ships the script as advisory (logs warnings, exits 0 by default; exits non-zero only when `MOCK_BUDGET_ENFORCE=1`). Enforced from PR-S4. Alternative: ratchet the threshold each PR. The ratchet pattern matches Q1's tsc-baseline approach but adds review overhead. **Default chosen here: advisory then enforced.**
- **❓ `setOutputForTesting` location.** Module-level `let registeredOutput` vs. `globalThis.__kigumi_test_output__`. The former is simpler; the latter is robust to `vi.resetModules()`. PR-S1 uses module-level and tests register the instance after the dynamic command import. If a test needs cross-`resetModules` continuity, escalate to globalThis at that point. **Default chosen here: module-level.**

## Risks & Mitigations

| Risk                                                                                                           | Mitigation                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Refactor silently weakens assertions ("test passes against fewer mocks but no longer checks behavior").        | Each PR description includes `git diff` of the test bodies plus a "before/after" assertion-count summary. Reviewer confirms every original assertion still holds.                                                                    |
| Prompts wrapper introduces a regression in interactive flows.                                                  | The wrapper is a thin re-export; behavior matches `@clack/prompts` 1:1 unless a test adapter is registered. Smoke-test with `kigumi init` against a fresh React project before merging PR-S1.                                        |
| Mock-budget gate flaps on unrelated PRs.                                                                       | The gate is advisory through PR-S3. Promotion to "exit non-zero" happens only in PR-S4, when the substring count is already below 50.                                                                                                |
| `vi.spyOn` substitutes for `vi.mock` and inflates `vi.mocked` accessors elsewhere.                             | The mock-budget script counts the `vi\.mock` substring (matches both `vi.mock` and `vi.mocked`). Both decline together as helpers replace them.                                                                                      |
| Adding `setOutputForTesting` in production code introduces a new failure mode (test instance leaks into prod). | The hook is a no-op when `registeredOutput` is `null` (default). Tests `resetOutputForTesting()` in `afterEach`. PR-S1 ships a guard test that asserts `getOutput()` returns a `ConsoleOutput` after reset.                          |
| Existing `createTestOutput()` consumers regress.                                                               | New helper is a sibling (`createRecordingOutput()`), not a modification. The 4 existing consumers (`init-{tier-migration,file-generator,post-install-instructions}.test.ts`, `project-config.test.ts`) need no edits and stay green. |

## Verification

Local validation steps (each PR):

```bash
# Mock budget
grep -rn 'vi\.mock' tests/unit | wc -l       # < 50 by PR-S4
grep -c 'vi\.mock' tests/unit/theme-commands.test.ts  # < 10 by PR-S1

# Full quality loop
pnpm type-check
pnpm lint
pnpm test
pnpm test:integration
pnpm validate:registry
pnpm validate:templates
pnpm check:tests          # Q1 gate
pnpm check:mocks          # NEW

# Coverage delta
pnpm test:coverage > coverage/post.txt
diff coverage/pre.txt coverage/post.txt   # captured at PR open
```

Smoke test the prompts wrapper after PR-S1:

```bash
pnpm build
mkdir -p /tmp/kigumi-smoke && cd /tmp/kigumi-smoke
node /path/to/kigumi-cli/dist/bin.js init --framework react --yes
# Confirm intro / outro / spinner UI all render normally
```

CI gates that must be green:

- Quality Checks job: lint, format, type-check (incl. `check:tests` + `check:mocks`), validate:registry, validate:templates.
- Unit tests across the React 18/19 matrix.
- Integration + e2e jobs (no behavioral change expected).

## References

- Q1 helper precedent: `tests/unit/_helpers/{output,kigumi-config,add-options}.ts` (4 current consumers of `output.ts`).
- Q1 baseline gate: `scripts/check-tests-baseline.ts` (pattern reused by `scripts/check-mock-budget.ts`).
- Existing output abstraction: `src/output/{index,console,types}.ts` (the DI hook is added one layer above the console implementation).
- `@clack/prompts` API surface used by the CLI (verified via `grep -rh '\bp\.[a-zA-Z]\+' src/commands/`): `confirm`, `intro`, `isCancel`, `log`, `multiselect`, `note`, `outro`, `select`, `spinner`, `text`.

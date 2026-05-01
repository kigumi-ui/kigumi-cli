# Cluster P: Coverage Rationalization - Specification

> Make `pnpm test:coverage` reflect what is actually tested: subprocess instrumentation surfaces integration and e2e contributions, generated artifacts stop inflating the denominator, and three orphan command paths get unit tests so the gates can finally be raised.

**Type:** Implementation spec
**Status:** Draft
**Author:** Mischa
**Date:** 2026-05-01
**Initiative:** [`test-infrastructure-hardening`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**F-IDs:** F-120, F-121, F-122, F-123, F-124, F-125
**Depends on:** Q1 (shipped, PR #137)
**Blocks:** v0.20.0 release
**Branched from:** `main`

## Overview

Coverage as it stands today is a metric without ground truth. `pnpm test:coverage` runs unit tests only, against a denominator that includes the CLI's own executable entry (`src/bin.ts`, never imported by tests) and runtime artifacts emitted into user projects (`src/lib/`, written by `kigumi init`). The numerator misses everything covered exclusively by integration or e2e tests, because v8 coverage does not propagate into child processes by default. Reported "lines: 78.42%" therefore overstates the denominator AND understates the numerator simultaneously. Six findings address this:

- **F-122**: extend the coverage exclude list to drop runtime artifacts from the denominator (`src/lib/**`, `src/bin.ts`, `src/styles/**`).
- **F-124**: propagate `NODE_V8_COVERAGE` through `tests/integration/helpers.ts` so child CLI processes contribute coverage; merge unit + subprocess via a new `pnpm coverage:all` script.
- **F-120**: write unit tests for three runtime CLI commands at 0% coverage (`src/commands/registry.ts`, `src/commands/registry/add-component.ts`, `src/commands/registry/add-theme.ts`).
- **F-121**: lift coverage on `src/commands/init/index.ts` (16.29%) and `src/commands/init/file-generator.ts` (0%) via partial extraction of pure helpers plus tests of the already-exported `validateAndPrepare`.
- **F-123**: extract pure choice-building from interactive selectors and unit-test it directly.
- **F-125**: snapshot-test the three template generator scripts and `post-changeset-version.ts`.

F-122 and F-124 ship together (they both move the single coverage number; splitting causes two CI threshold ratchets that fight each other). F-120 + F-123 batch in one test-additions PR after the infra PR. F-121 ships in its own PR because the pure-helper extraction has refactor risk. F-125 ships last because it expands the coverage `include` set and should not be conflated with a threshold raise.

Backlog drift caught during planning: F-121 references `src/commands/init/setup-generator.ts` (349 lines). The actual file is `src/commands/init/file-generator.ts` (118 lines). The backlog text is stale and gets a follow-up correction note.

## Goals

1. `pnpm test:coverage` denominator excludes generated runtime artifacts (`src/lib/**`, `src/bin.ts`, `src/styles/**`).
2. `pnpm coverage:all` exists, runs unit + integration + e2e, and produces a single merged report at `coverage-merged/coverage-summary.json`.
3. The merged report shows `src/commands/init/index.ts` above 50% lines (vs. 16.29% from unit alone), demonstrating subprocess instrumentation is collecting and merging.
4. The three runtime registry commands (`registry.ts`, `add-component.ts`, `add-theme.ts`) all report above 70% line coverage in the unit-only report.
5. The two interactive selectors (`component-selector.ts`, `remote-component-selector.ts`) both report above 70% line coverage.
6. `init/index.ts` and `init/file-generator.ts` both report above 70% line coverage in the merged report.
7. Coverage thresholds rise from 68/57/77/68 to at least 85/75/86/85, set 2 to 3 points below the new measured numbers.
8. A deliberate regression in any of the three `generate-*-templates.ts` scripts flips the corresponding snapshot test red.

## Non-Goals

- Replacing the unit-only `pnpm test:coverage` gate with `pnpm coverage:all`. Subprocess coverage is informational until the merged numbers stabilize over multiple PRs.
- Refactoring `init/index.ts` into a fully pure `runInit(env, prompts, fs)` function. Partial extraction is sufficient (see Behavior section below).
- Excluding `src/utils/component-metadata.ts` from coverage. It is a generated file but trivially covered; leaving it in is a denominator wash.
- Adding tests for the remaining 13 untested scripts in `scripts/` (e.g., `validate-*.ts`, `setup-npmrc.mjs`). F-125 covers only the four highest-leverage scripts.
- Mutation testing or fault-injection. Cluster V handles those.
- New CI matrix entries or workflows. Cluster Q2 already shipped the matrix; this cluster does not modify CI.

## API Surface

Files this cluster touches.

| File                                                                                                                | Change                                                                                       |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `vitest.unit.config.ts`                                                                                             | extend `coverage.exclude`; raise thresholds in two steps; extend `coverage.include` in PR-P4 |
| `tests/integration/helpers.ts`                                                                                      | propagate `NODE_V8_COVERAGE` in `runKigumi` env block                                        |
| `tests/e2e/smoke.test.ts`, `tests/e2e/diff.test.ts`                                                                 | propagate `NODE_V8_COVERAGE` in their execa env (verify location during implementation)      |
| `package.json` (scripts)                                                                                            | add `coverage:all`                                                                           |
| `scripts/coverage-all.mts` (new)                                                                                    | merge harness for unit + subprocess coverage                                                 |
| `tests/unit/registry-add-component.test.ts` (new)                                                                   | F-120                                                                                        |
| `tests/unit/registry-add-theme.test.ts` (new)                                                                       | F-120                                                                                        |
| `tests/unit/registry-router.test.ts` (new)                                                                          | F-120                                                                                        |
| `tests/unit/component-selector.test.ts` (new)                                                                       | F-123                                                                                        |
| `tests/unit/remote-component-selector.test.ts` (new)                                                                | F-123                                                                                        |
| `tests/unit/init-validate-and-prepare.test.ts` (new)                                                                | F-121                                                                                        |
| `tests/unit/init-file-generator.test.ts` (new)                                                                      | F-121                                                                                        |
| `tests/unit/init-post-install-instructions.test.ts` (new)                                                           | F-121                                                                                        |
| `src/commands/init/index.ts`                                                                                        | promote `showPostInstallInstructions`, `confirmInstallation`, `confirmMigration` to `export` |
| `src/commands/add/component-selector.ts`                                                                            | extract `buildSelectorChoices` pure helper                                                   |
| `src/commands/add/remote-component-selector.ts`                                                                     | export the existing filter logic if needed for direct testing                                |
| `tests/unit/scripts/generate-react-templates.test.ts` (new)                                                         | F-125                                                                                        |
| `tests/unit/scripts/generate-vue-templates.test.ts` (new)                                                           | F-125                                                                                        |
| `tests/unit/scripts/generate-angular-templates.test.ts` (new)                                                       | F-125                                                                                        |
| `tests/unit/scripts/post-changeset-version.test.ts` (new)                                                           | F-125                                                                                        |
| `scripts/generate-react-templates.ts`, `scripts/generate-vue-templates.ts`, `scripts/generate-angular-templates.ts` | add `export` to functions tests need to call                                                 |

`.github/workflows/ci.yml` is intentionally NOT touched in this cluster. A new informational `coverage` job is a follow-up PR after cluster P closes.

## Pipeline Changes

### Today's shape

- `pnpm test:coverage` collects v8 coverage from unit tests only. Threshold gate at 68/57/77/68. Reporter writes `coverage/coverage-summary.json`.
- `pnpm test:integration` runs subprocess CLI tests with no coverage collection.
- `pnpm test:e2e` runs subprocess CLI tests with no coverage collection.
- No merged coverage exists.

### After P

- `pnpm test:coverage` continues unchanged in form; thresholds rise after PR-P2 and PR-P3.
- `pnpm test:integration` and `pnpm test:e2e` produce subprocess V8 coverage when invoked under `coverage:all` (writes to `$NODE_V8_COVERAGE` directory; emit is silent otherwise).
- `pnpm coverage:all` (new) runs a Node.js harness that:
  1. Creates a temp `NODE_V8_COVERAGE` directory.
  2. Runs `vitest run tests/unit` WITHOUT `--coverage`. With `NODE_V8_COVERAGE` set, Node and its workers write raw V8 JSON to the temp dir directly.
  3. Runs `vitest run tests/integration` (children write raw V8 JSON to the temp dir).
  4. Runs `vitest run tests/e2e` (same).
  5. Merges via `c8 report --temp-directory <tempDir>` (or vitest 4.x `mergeReports` API if available and stable).
  6. Writes merged summary to `coverage-merged/coverage-summary.json`.

The unit run keeps `--coverage` ONLY in `pnpm test:coverage`, NOT in `pnpm coverage:all`. `pnpm test:coverage` is the unit-only threshold gate; `pnpm coverage:all` is a parallel pipeline that produces the merged informational report.

CI: a new `coverage` informational job is OUT OF SCOPE for cluster P. It lands as a separate follow-up PR after cluster P closes (rationale: the optional CI surface adds review burden without unblocking any acceptance criterion). The harness exists locally so contributors can run `pnpm coverage:all` on demand.

## Behavior & Edge Cases

### F-122: Coverage exclude list

Before:

```
exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.d.ts']
```

After:

```
exclude: [
  '**/node_modules/**',
  '**/dist/**',
  '**/*.test.ts',
  '**/*.d.ts',
  'src/lib/**',
  'src/bin.ts',
  'src/styles/**',
]
```

Rationale:

- `src/bin.ts` (5 lines, 0% covered) is the CLI's executable entry, never imported by tests.
- `src/lib/` is expected to contain files emitted into user projects via `kigumi init` (template artifacts, not CLI runtime). Implementing agent verifies `src/lib/` exists and contains the claimed files; if it does not, drop that pattern from the exclude list.
- `src/styles/**` is expected to contain runtime CSS assets, not testable. Implementing agent verifies similarly.

After exclusion, `coverage-summary.json` no longer lists these paths. "All files" line totals tick up by at least 0.1 points (just from removing `src/bin.ts`'s 5 zero-covered lines from the 3657 denominator). If `src/lib/kigumi.ts` is removed too (the F-122 backlog text claims 37 zero-covered lines there), the jump is closer to 0.9 points. The conservative floor is 78.5% lines.

### F-124: NODE_V8_COVERAGE propagation

`tests/integration/helpers.ts:303` currently hardcodes the env block. Change:

```diff
  const result = await execa('node', [CLI_PATH, ...args], {
    cwd,
    env: {
      ...process.env,
      CI: 'true',
      WEBAWESOME_NPM_TOKEN: '',
      KIGUMI_SKIP_GLOBAL_NPMRC: 'true',
+     NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || '',
    },
  });
```

When `coverage:all` sets `NODE_V8_COVERAGE` to a temp directory in `process.env`, the spread forwards it to the child. Node.js writes raw V8 coverage JSON to that directory on process exit. When `NODE_V8_COVERAGE` is unset (e.g., during plain `pnpm test:integration`), the empty string is a no-op (Node treats it as not-set).

Edge case: if a child process is killed before clean exit, its coverage data is lost. Acceptable for happy-path tests. The merged report degrades gracefully (one missing process means a lower numerator, not test failure).

The same propagation pattern applies to `tests/e2e/smoke.test.ts:45` and `tests/e2e/diff.test.ts:36`. Verify their env block shape during implementation; either inline the env addition or refactor them through a shared helper.

### F-124: coverage:all merge harness

New file `scripts/coverage-all.mts` (sketch; the implementing agent finalizes the merge approach after verifying how `@vitest/coverage-v8` interacts with `NODE_V8_COVERAGE` at runtime):

```ts
#!/usr/bin/env tsx
import { execa } from 'execa';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-coverage-'));
const env = { ...process.env, NODE_V8_COVERAGE: tempDir };

try {
  await execa(
    'vitest',
    ['run', 'tests/unit', '--config', 'vitest.unit.config.ts'],
    { stdio: 'inherit', env }
  );
  await execa(
    'vitest',
    ['run', 'tests/integration', '--config', 'vitest.integration.config.ts'],
    { stdio: 'inherit', env }
  );
  await execa('vitest', ['run', 'tests/e2e', '--testTimeout=300000'], {
    stdio: 'inherit',
    env,
  });
  await execa(
    'c8',
    [
      'report',
      '--temp-directory',
      tempDir,
      '--src',
      'src/',
      '--reporter',
      'text',
      '--reporter',
      'json-summary',
      '--reports-dir',
      'coverage-merged',
    ],
    { stdio: 'inherit' }
  );
} finally {
  await fs.remove(tempDir);
}
```

Important: the unit run drops `--coverage` here on purpose. With `NODE_V8_COVERAGE` set, Node and its workers write raw V8 JSON to `tempDir`. `c8 report` then reads everything in `tempDir` and produces the merged report. If the unit run kept `--coverage`, vitest's coverage-v8 would write a separate report to `coverage/` that `c8 report` does not see. The `pnpm test:coverage` script keeps `--coverage` and remains the unit-only threshold gate; `pnpm coverage:all` is a parallel pipeline.

Adds `c8` as a versioned dev dependency for the merge step. Vitest's `coverage-v8` 4.x uses c8 internally; adding `c8` directly is consistent and gives access to its CLI. Alternative: if vitest 4.x exposes a stable `mergeReports` API, prefer it and skip the c8 addition. The implementing agent picks one approach in PR-P1 after a short spike.

### F-120: registry test files

Three new test files. Pattern reference: `tests/unit/registry-init-command.test.ts`. Cluster S coordination: that reference is mock-heavy (mocks `@clack/prompts` and `output` at the module level). Cluster S will reduce mock counts later. New tests in PR-P2 should mock only what is genuinely interactive (`@clack/prompts.text` for prompt return values) and use real `fs` plus temp dirs for everything else. This way PR-P2 does not add mocks that S then has to remove.

- `tests/unit/registry-add-component.test.ts`: creates a temp dir with a fixture `registry.json`. Calls `registryAddComponentAction({ slug: 'wa-test', name: 'WA Test', component: 'src/test.tsx', css: 'src/test.css', cwd: testDir })`. Asserts `registry.json` now has the new entry by reading the file back. Edge cases: invalid slug (kebab-case violation), duplicate slug, missing `registry.json`. Use real fs operations; mock only `@clack/prompts` at the call sites that genuinely prompt.
- `tests/unit/registry-add-theme.test.ts`: same shape for `registryAddThemeAction`.
- `tests/unit/registry-router.test.ts`: imports `registryCommand`, asserts `.commands` array has 7 entries with the expected names (`init`, `validate`, `connect`, `list`, `remove`, `add-component`, `add-theme`). Catches accidental sub-command removal at the router level. No mocks needed.

Coverage targets: each of the three target files reports above 70% line coverage in the unit report.

### F-121: init orchestrator partial extraction

Decision (recorded from planning session): partial extraction.

1. The already-exported `validateAndPrepare(options, cwd, output)` at `src/commands/init/index.ts:245` is unit-tested directly. Mocks `@clack/prompts`, `output`, and the `loadConfig` / `getProjectInfo` / `detectTier` utilities. Tests cover: existing-config branches, non-interactive vs interactive detection, tier detection, pre-flight check failures.
2. `showPostInstallInstructions` (currently file-private at line 539, pure function with no async I/O) gets `export`. New unit test calls it with various combinations of `tier` (`free` / `pro`), `isNext` (true/false), `nextRouter` (`app` / `pages` / undefined), and `framework` (`react` / `vue`). Asserts the output sequence (Next steps, theme info, etc.) via the `mockOutput.info` / `mockOutput.log` calls.
3. `confirmInstallation` and `confirmMigration` get `export`. Trivial tests assert they return `true` in non-interactive mode and respect the `p.confirm` result otherwise.
4. `src/commands/init/file-generator.ts` (118 lines, single exported `generateProjectFiles`) gets a focused unit test that creates a temp dir, calls `generateProjectFiles` directly, and asserts the right files are written for each branch (Vite vs Next App vs Next Pages, Free vs Pro, with/without Pro token, src vs no-src layouts) by reading the temp dir's contents back. Mock `regenerate.ts`'s helpers only where deterministic input is required (e.g., to pin generated theme content); prefer real fs writes for everything else. This keeps the test compatible with cluster S's mock-reduction goals.
5. The orchestrator body of `initCommand` itself stays untested at the unit level. Subprocess coverage from F-124 picks it up via `tests/integration/init.test.ts`.

Coverage targets: `init/index.ts` reaches above 70% in the merged report (subprocess covers the orchestrator; unit tests cover the exported helpers). `file-generator.ts` reaches above 70% in unit alone.

Backlog drift note: the F-121 backlog entry references `setup-generator.ts` (349 lines, 0%). The actual file is `file-generator.ts` (118 lines, 0%). Open a follow-up to correct the backlog text after this cluster lands.

### F-123: selector test surface

`component-selector.ts` (16.66%, 18 lines):

- Extract `buildSelectorChoices(components, tier, query): Choice[]` as a new exported pure function. Strip the `p.multiselect` call from `selectComponentsInteractive`; replace with a call to `buildSelectorChoices` followed by `p.multiselect` on the result.
- Unit-test `buildSelectorChoices` with table-driven cases: free tier filters out Pro components, search query narrows results, dependency-attached components show in the "depends on" column.

`remote-component-selector.ts` (35.29%, 17 lines):

- `getAvailableRemoteComponents` is already exported (line 43). Add unit tests for the filter logic without further extraction.
- Cancel-path coverage: mock `@clack/prompts.isCancel` to return true; assert the function exits cleanly without writing.

Coverage targets: both files above 70% line coverage.

### F-125: generator + post-changeset snapshot tests

Each generator script gets two snapshot tests:

- One against a complex component (`Button`): exercises forwardRef, ref methods, event handlers, props with values.
- One against a simple component (`Badge`): exercises the no-events / no-methods branches.

Snapshot fixtures live at `tests/unit/scripts/__snapshots__/` (Vitest's default, alongside the test file). Tests call the generator function directly (not via the script's CLI entry). Test setup pins the input `ComponentDefinition` inline to avoid noise from `component-metadata.ts` updates.

`post-changeset-version.ts`: unit-tested with an inline `CHANGELOG.md` fixture string. Asserts the rewritten output matches Keep-a-Changelog format. No file I/O in the test.

Generator scripts need `export` keywords on the functions tests call. Currently NONE of the functions in `scripts/generate-*-templates.ts` are exported (verified during planning by grep). Phase 4 adds `export` to:

- `generateReactTypescriptTemplate`, `generateCSSTemplate`, `generateTestTypescriptTemplate` in each of the three generator scripts.
- The `main()` function stays unexported as the CLI entry.

The coverage `include` extends to:

```
include: ['src/**/*.ts', 'scripts/generate-*-templates.ts', 'scripts/post-changeset-version.ts']
```

Other scripts in `scripts/` stay unincluded (out of scope for this cluster).

## Dependencies

- Cluster Q1 (shipped, PR #137): provides `tsconfig.tests.json` and `pnpm check:tests` so test files type-check.
- Cluster Q2 (shipped, PR #138): provides the CI matrix shape that any future `coverage` follow-up plugs into. P itself does not modify CI.
- Cluster R (PR #141 in review at planning time): no functional dependency, but lands first to avoid merge conflicts in `tests/integration/helpers.ts`. R adds the snapshot harness for starter output; P adds `NODE_V8_COVERAGE` propagation. Wait until #141 merges before opening PR-P1.

## Breaking Changes

None for end users. No CLI flag changes, no config schema changes, no output format changes.

For contributors:

- Coverage thresholds rise. PRs that previously squeaked through at 69% lines will now fail at 80% (after PR-P2) or 85% (after PR-P3). Update internal docs that reference the old thresholds.
- `pnpm test:coverage` denominator changes (some files no longer counted). Reported coverage for `src/` paths may shift by ~0.2 points without any test changes.

## Verification

Per-phase checklist (each PR must pass its phase's verification before merge):

- [ ] PR-P1: `pnpm test:coverage` exits 0 with the new exclude list. `coverage-summary.json` no longer lists `src/bin.ts`. "All files" lines % is at least 78.5 (conservative floor; actual jump depends on whether `src/lib/kigumi.ts` exists).
- [ ] PR-P1: `pnpm coverage:all` produces a valid `coverage-merged/coverage-summary.json` containing data from all three suites. The script exits 0 when every suite passes and exits non-zero otherwise without skipping the merge step. The acceptance signal is the merged report, not the exit code; on a clean checkout the script currently exits non-zero because of the pre-existing `tests/e2e/smoke.test.ts` "should install Web Awesome package" failure (independent of cluster P) and will exit 0 once that e2e issue is fixed.
- [ ] PR-P1: the merged report shows `src/commands/init/index.ts` above 50% lines (vs. 16.29% unit-only baseline).
- [ ] PR-P2: `pnpm test:coverage` shows `registry.ts`, `registry/add-component.ts`, `registry/add-theme.ts` all above 70% lines. `component-selector.ts`, `remote-component-selector.ts` both above 70%. CI passes with thresholds raised to 80/70/84/80.
- [ ] PR-P3: `pnpm test:coverage` shows `init/index.ts` above 50% (where `validateAndPrepare` and the exported helpers reach) and `file-generator.ts` above 70%. The merged report shows `init/index.ts` above 70%. CI passes with thresholds 85/75/86/85.
- [ ] PR-P4: a deliberate change to `generateReactTypescriptTemplate` (e.g., remove the forwardRef wrapper) flips the Button snapshot test red. `pnpm test:coverage` shows the four generator + post-changeset scripts in the report at above 70%.
- [ ] All four PRs: `pnpm check:tests`, `pnpm lint`, `pnpm test:integration`, and `pnpm test:e2e` (where applicable) pass.

## Risks

| Risk                                                                                                                                | Mitigation                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subprocess coverage is flaky if a child process exits abnormally and loses its coverage write.                                      | Acceptable for happy-path tests. Document the limitation. The merged report degrades gracefully (one missing process means a lower numerator, not test failure).                                                                            |
| Vitest 4.x does not expose a public `mergeReports` API and the c8 CLI changes flags.                                                | Pin `c8` as a versioned dev dependency. Add a small unit test for the merge harness itself (input two synthetic V8 JSONs, assert merged shape).                                                                                             |
| The threshold raise to 85/75/86/85 is too tight; CI fails on unrelated PRs.                                                         | Set thresholds 2 to 3 points below the measured number after each raise. If a future PR adds a new untested file, its drop is bounded; the gate triggers a rationalization conversation rather than a false failure.                        |
| `src/lib/` exclusion is wrong (file does not exist or has different contents than the F-122 backlog claims).                        | Implementing agent verifies in PR-P1 by checking `ls src/lib/` and the actual `coverage-summary.json`. Adjust the exclude pattern accordingly.                                                                                              |
| F-121 partial extraction breaks the init orchestrator's behavior.                                                                   | The exported `showPostInstallInstructions`, `confirmInstallation`, `confirmMigration` are pure; lifting them to `export` is a no-behavior-change refactor. Existing integration tests (`tests/integration/init.test.ts`) catch regressions. |
| Generator snapshots become noisy on every `component-metadata.ts` regeneration.                                                     | Tests call generator functions with inline `ComponentDefinition` fixtures, not by reading `component-metadata.ts`. Snapshot stability is decoupled from upstream WA metadata changes.                                                       |
| Adding `c8` as a dev dep adds maintenance burden.                                                                                   | If vitest 4.x `mergeReports` API is available and stable, prefer it and skip the `c8` addition.                                                                                                                                             |
| The merge report shows lower numbers than expected because integration tests do not actually exercise enough orchestrator branches. | Document the gap. F-121's targeted unit tests fill the orchestrator-specific gap so the merged report is not the sole signal for `init/index.ts`.                                                                                           |
| The optional CI `coverage` job slows PR runtime.                                                                                    | Run it only on `main` pushes, not every PR. Or run it nightly. Document the cadence. Recommend deferring this job to a follow-up PR after the cluster closes.                                                                               |

## Implementation Phases

### Phase 1: Coverage infrastructure (PR-P1)

**Files:** `vitest.unit.config.ts`, `tests/integration/helpers.ts`, `tests/e2e/smoke.test.ts`, `tests/e2e/diff.test.ts`, `package.json`, `scripts/coverage-all.mts` (new).

- Extend `vitest.unit.config.ts` `coverage.exclude` with `'src/lib/**'`, `'src/bin.ts'`, `'src/styles/**'`. Verify each pattern points at real content; drop any that do not.
- Add `NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || ''` to the env block in `runKigumi` (helpers.ts:303).
- Apply the same env-propagation pattern to e2e tests' execa env. Read `tests/e2e/smoke.test.ts:45` and `tests/e2e/diff.test.ts:36` to confirm the exact location during implementation.
- Add `pnpm coverage:all` script. Implementation in `scripts/coverage-all.mts` per the harness draft above. Add `c8` as a versioned dev dependency.
- Defer the optional CI `coverage` job to a follow-up PR.

**Validation:** `pnpm test:coverage` passes with current thresholds (no regression). `pnpm coverage:all` exits 0. The merged report shows `init/index.ts` above 50% lines.

### Phase 2: Registry + selector tests (PR-P2)

**Files:** new test files for F-120 (3) and F-123 (2). Refactor of `component-selector.ts` to extract `buildSelectorChoices`. Update of `vitest.unit.config.ts` thresholds.

- Write `tests/unit/registry-add-component.test.ts`, `tests/unit/registry-add-theme.test.ts`, `tests/unit/registry-router.test.ts` per the F-120 design above.
- Extract `buildSelectorChoices` as an exported pure function in `src/commands/add/component-selector.ts`. Update `selectComponentsInteractive` to call it.
- Write `tests/unit/component-selector.test.ts` and `tests/unit/remote-component-selector.test.ts` per the F-123 design.
- Raise thresholds in `vitest.unit.config.ts` to `lines: 80, branches: 70, functions: 84, statements: 80`.

**Validation:** all five new test files pass. The five target files all above 70% line coverage. CI green at the new thresholds.

### Phase 3: Init orchestrator coverage (PR-P3)

**Files:** `src/commands/init/index.ts` (add `export` to three helpers), new test files for F-121, threshold update.

- Add `export` to `showPostInstallInstructions`, `confirmInstallation`, `confirmMigration` in `src/commands/init/index.ts`.
- Write `tests/unit/init-validate-and-prepare.test.ts`, `tests/unit/init-post-install-instructions.test.ts`, `tests/unit/init-file-generator.test.ts` per the F-121 design.
- Raise thresholds in `vitest.unit.config.ts` to `lines: 85, branches: 75, functions: 86, statements: 85`.
- Verify the merged report (via `pnpm coverage:all`) shows `init/index.ts` above 70%.

**Validation:** new test files pass. `init/index.ts` above 70% in the merged report; `file-generator.ts` above 70% in unit. CI green at the higher thresholds.

### Phase 4: Generator + post-changeset snapshot tests (PR-P4)

**Files:** new test files for F-125 (4), `export` additions in three generator scripts, coverage `include` extension in `vitest.unit.config.ts`.

- Add `export` to `generateReactTypescriptTemplate`, `generateCSSTemplate`, `generateTestTypescriptTemplate` in each of the three `generate-*-templates.ts` scripts.
- Write `tests/unit/scripts/generate-react-templates.test.ts`, `tests/unit/scripts/generate-vue-templates.test.ts`, `tests/unit/scripts/generate-angular-templates.test.ts` with inline `Button` and `Badge` fixtures.
- Write `tests/unit/scripts/post-changeset-version.test.ts` with an inline CHANGELOG fixture.
- Extend `vitest.unit.config.ts` `coverage.include` to `['src/**/*.ts', 'scripts/generate-*-templates.ts', 'scripts/post-changeset-version.ts']`.

**Validation:** snapshot tests pass on a clean tree. Deliberate change to `generateReactTypescriptTemplate` flips the Button snapshot red. The four scripts appear in `coverage-summary.json` at above 70% lines.

## Acceptance

The cluster ships when all of the following are true:

- [ ] `pnpm test:coverage` denominator excludes `src/lib/**`, `src/bin.ts`, `src/styles/**`. (PR-P1)
- [ ] `pnpm coverage:all` exists and produces `coverage-merged/coverage-summary.json`. (PR-P1)
- [ ] The merged report shows `src/commands/init/index.ts` above 50% lines. (PR-P1, validation gate)
- [ ] Three runtime registry commands (`registry.ts`, `add-component.ts`, `add-theme.ts`) all show above 70% line coverage in `pnpm test:coverage`. (PR-P2)
- [ ] Both selectors (`component-selector.ts`, `remote-component-selector.ts`) show above 70% line coverage. (PR-P2)
- [ ] `init/index.ts` shows above 70% in the merged report; `file-generator.ts` above 70% in the unit report. (PR-P3)
- [ ] Three generator scripts plus `post-changeset-version.ts` show above 70% line coverage in `pnpm test:coverage`. (PR-P4)
- [ ] A deliberate regression in any of the three generators (drop forwardRef, swap event names, change ref shape) flips the corresponding snapshot test red. (PR-P4)
- [ ] `vitest.unit.config.ts` thresholds reach at least 85/75/86/85. (PR-P3)
- [ ] All existing tests continue to pass. (every PR)
- [ ] Status dashboard (`docs/superpowers/state/test-infrastructure-hardening-status.md`) shows P as SHIPPED with all four PR links. (PR-P4 close)

## Open Questions

❓ Should `c8` be added as a dev dep, or use vitest 4.x's `mergeReports` API if it exists? Default: implementing agent runs a short spike in PR-P1 and picks the simpler option. Document the decision in the PR description.

❓ How does `@vitest/coverage-v8` interact with `NODE_V8_COVERAGE`? Specifically: when vitest is invoked WITHOUT `--coverage` but WITH `NODE_V8_COVERAGE` set, does vitest forward the env to its workers, or does it spawn workers in a way that strips it? The merge harness sketch assumes forwarding works. Verify in PR-P1 with a 5-line spike before committing the harness.

❓ Should `src/utils/component-metadata.ts` be added to the F-122 exclude list? Default: leave in. It is genuinely runtime code (just trivially covered).

❓ Should F-125 cover the four highest-leverage scripts only, or expand to include the validate scripts? Default: four-script scope as written. Validate scripts are out of scope for this cluster.

❓ Should the backlog correction (F-121 references `setup-generator.ts`, actual file is `file-generator.ts`) be a PR to a 2nd-brain memory file, or just an inline note in the spec? Default: 2nd-brain memory update after cluster P lands. The spec already flags the drift in the F-121 design section.

## Pairs With

- **Cluster S (mock reduction):** can run in parallel session. S touches different files (theme-commands.test.ts and others) with no overlap.
- **Cluster T (property-based + edge cases):** lands after P. T's negative-path inventory uses the new merged coverage to prove edge-case tests contribute.
- **Cluster V (evidence layer):** mutation testing in V runs against the typed test surface; V's mutation score is calculated against `src/**` after P's denominator changes settle. Coordinate threshold tuning if mutation score is below V's 80% gate.

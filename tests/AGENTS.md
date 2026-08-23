# Testing Guide

> Test suite for Kigumi CLI - extends [root AGENTS.md](../AGENTS.md)

## Directory Structure

```
tests/
├── unit/                    # Fast, isolated tests (94 files at top level, ~1500 tests; more under scripts/, schemas/)
│   ├── add-command.test.ts          # Add command (built-in + remote)
│   ├── add-command-cross-framework.test.ts # Add command --cross-framework flag
│   ├── add-validator.test.ts        # Component validation
│   ├── brand-command.test.ts        # Brand color command
│   ├── check-runner.test.ts         # Pre-flight check runner
│   ├── component-installer.test.ts  # Component installer logic
│   ├── community-registry.test.ts   # Registry schema, URL parsing, deps
│   ├── concurrency.test.ts          # Cluster T: saveConfig load-modify-write race + write-failure propagation
│   ├── failure-modes.test.ts        # Cluster T: disk (ENOSPC/EACCES) + GitHub fetcher (401/403/429/404) + network (ECONNREFUSED)
│   ├── component-selector.test.ts   # buildSelectorChoices + selectComponents dispatch
│   ├── config.test.ts               # Config loading/saving
│   ├── config-checks.test.ts        # Config validation checks
│   ├── config-error-surface.test.ts # Config error surface (cluster A: ConfigInvalidError vs TypeError)
│   ├── config-schema.test.ts        # Zod config schema validation
│   ├── detect-framework.test.ts     # Framework/TS/PM detection
│   ├── diff-command.test.ts         # Diff command (component comparison)
│   ├── diff-renderer.test.ts        # Diff renderer terminal output
│   ├── diff-roundtrip.test.ts       # Diff renderer round-trip fidelity
│   ├── display-options.test.ts      # Theme/palette/brand display data
│   ├── doctor.test.ts               # Doctor command (import fixes)
│   ├── edge-cases.test.ts           # Edge case handling
│   ├── error-classes.test.ts        # Error class hierarchy
│   ├── errors.test.ts               # Error formatting
│   ├── file-diff.test.ts            # File modification detection
│   ├── find-cem.test.ts             # find-cem pinned-version CEM resolution (F-152)
│   ├── framework-detection.test.ts  # Extended framework detection
│   ├── github-token.test.ts         # GitHub PAT resolution chain
│   ├── helpers.test.ts              # Cluster S helpers (createRecordingOutput, createTestPrompts, writeTierFixture)
│   ├── init-config-preservation.test.ts # Init with config preservation scenarios
│   ├── init-existing-config.test.ts # Init with existing project
│   ├── init-file-generator.test.ts  # Init file generator (per-framework setup file emission)
│   ├── init-installer.test.ts       # Init installer logic
│   ├── init-validate-and-prepare.test.ts # Init pre-flight validation + prep
│   ├── json.test.ts                 # JSON with comments parsing
│   ├── list.test.ts                 # List command
│   ├── list-json.test.ts            # List --json output
│   ├── migration.test.ts            # Free↔Pro migration
│   ├── network-errors.test.ts       # Network error classes
│   ├── next-support.test.ts         # Next.js detection + 'use client' + suppressHydrationWarning + layers.css emission (App + Pages)
│   ├── no-handlebars-tokens.test.ts # Regression guard: no `{{...}}` tokens in any template
│   ├── options-schema.test.ts       # Command options schemas
│   ├── output-di.test.ts            # Output DI hook (setOutputForTesting / resetOutputForTesting)
│   ├── palette-command.test.ts      # Palette command
│   ├── preflight-errors.test.ts     # Pre-flight error classes
│   ├── project-config.test.ts       # Project config helpers
│   ├── prompts-wrapper.test.ts      # Prompts wrapper (setPromptsForTesting routing)
│   ├── regenerate.test.ts           # File regeneration utilities
│   ├── remote-component-selector.test.ts # getAvailableRemoteComponents + cancel path
│   ├── remote-installer.test.ts     # Remote (community) component installer
│   ├── remote-installer-cross-framework.test.ts # Cross-framework staging branch
│   ├── remote-installer-local-source.test.ts    # Local filesystem registry source
│   ├── registry.test.ts             # Component registry lookups
│   ├── registry-add-component.test.ts     # Registry add-component command
│   ├── registry-add-theme.test.ts         # Registry add-theme command
│   ├── registry-cache.test.ts       # Disk cache for registries
│   ├── registry-connect-command.test.ts   # Registry connect command (mismatch warning)
│   ├── registry-init-command.test.ts      # Registry init command
│   ├── registry-list-remove-command.test.ts # Registry list/remove
│   ├── registry-router.test.ts            # Registry router structural + wiring
│   ├── registry-validate-command.test.ts  # Registry validate command
│   ├── status.test.ts               # Status command
│   ├── snapshot.test.ts             # Snapshot CRUD and community install snapshots
│   ├── status-json.test.ts          # Status --json output
│   ├── storybook-generator.test.ts  # Storybook story generation
│   ├── surgical-rewrite-layers-css.test.ts # Surgical @import rewrite for layers.css
│   ├── template.test.ts             # Template materialization + tier swap
│   ├── test-detection.test.ts       # Test framework detection
│   ├── theme.test.ts                # Theme validation
│   ├── theme-commands.test.ts       # Theme set/list/show/install commands
│   ├── theme-install-local-source.test.ts  # `theme install --from` with a local registry
│   ├── three-way-merge.test.ts      # Three-way merge algorithm
│   ├── tier.test.ts                 # Tier detection
│   ├── tier-consistency.test.ts     # Registry/tier consistency validation
│   ├── tier-restrictions.test.ts    # Tier restriction logic
│   ├── tier-schema.test.ts          # Tier schema validation
│   ├── token.test.ts                # Token handling
│   ├── type-installation.test.ts    # TypeScript type installation
│   ├── update-check.test.ts         # CLI update notification check
│   ├── update-command.test.ts       # Update command (three-way merge)
│   ├── upgrade-command.test.ts      # Upgrade command (version management)
│   ├── validate-changes.test.ts     # AI guard-rail checks + anti-pattern matcher
│   ├── validate-cem-sync.test.ts    # CEM sync validation
│   ├── validate-parity.test.ts      # Template parity validation
│   ├── validate-parity-detection.test.ts  # Parity detection proven on a synthetic registry
│   ├── validate-wa-pins.test.ts     # Web Awesome pin consistency across all six locations
│   ├── post-changeset-version.test.ts  # Release version markers (AGENTS.md + llms.txt)
│   ├── validate-registry.test.ts    # Registry validator (fields, props, tags)
│   ├── parse-custom-elements-css.test.ts  # CEM → CSS_METADATA extraction + framework parity
│   ├── validation-errors.test.ts    # Validation error classes
│   ├── version-check.test.ts        # CLI vs project version check
│   ├── version-error.test.ts        # Version error classes
│   ├── version-map.test.ts          # Version history data
│   ├── angular-templates.test.ts    # Angular template generation validation (collision-resolution exercised against Tooltip — Dialog is no longer a collision case since WA 3.5.0 marked its show()/requestClose() private)
│   ├── vue-templates.test.ts        # Vue template generation validation
│   ├── scripts/
│   │   ├── check-generated-fresh.test.ts       # Pure helpers of the validate:generated-fresh drift guard (CSS comment-strip, rule-block split, at-rule guard, docs-only allowlist, event-subset)
│   │   ├── check-tests-baseline.test.ts        # Tests for the tsc baseline gate wrapper
│   │   ├── generate-angular-templates.test.ts  # Snapshot-pinned Angular wrapper generator (Button + Badge)
│   │   ├── generate-react-templates.test.ts    # Snapshot-pinned React wrapper generator (Button + Badge)
│   │   ├── generate-vue-templates.test.ts      # Snapshot-pinned Vue wrapper generator (Button + Badge + Switch)
│   │   └── post-changeset-version.test.ts      # Snapshot-pinned changeset → Keep-a-Changelog rewrite
│   ├── schemas/
│   │   ├── config-corrupt.test.ts              # Cluster T: corrupt-config edge cases (BOM, trailing comma, truncated, null byte, wrong-type per required field)
│   │   └── config-property.test.ts             # Cluster T: fast-check property tests (round-trip, strict rejection, mergeWithDefaults invariance)
│   ├── regression/                             # Cluster V: bug-bash regression suite (≥ 10 entries, each protecting a historical PR/F-ID)
│   │   ├── README.md                           # Directory contract + how to add a new entry
│   │   ├── pr-117-config-safe-parse.test.ts    # F-037 — init safeParse on malformed config
│   │   ├── pr-130-community-registry-hardening.test.ts  # F-094/097/102/103/116 — safe paths, semver, typed error
│   │   ├── pr-130-registry-schema-strict.test.ts        # Cluster A — kigumiConfigSchema.strict()
│   │   ├── pr-134-aliases-removal.test.ts      # F-064 — aliases dropped, toKigumiAlias substitute
│   │   ├── pr-95-init-preservation-length.test.ts       # Record vs array .length on installedComponents
│   │   ├── pr-126-react-ref-typing.test.ts     # F-072 — useRef<Wa* | null> + useCallback setter
│   │   ├── f-068-vue-boolean-prop-filter.test.ts        # Vue definedProps strips false (else attrs stick)
│   │   ├── f-013-palette-tier-gating.test.ts   # Free tier rejects Pro palettes (B3 bug-injection mirror)
│   │   ├── resolve-components-tolowercase.test.ts       # Multi-word components survive kebab/Pascal
│   │   └── f-058-config-monorepo-isolation.test.ts      # loadConfig stopDir: cwd, no parent inheritance
│   └── _setup/
│       └── fast-check.ts                        # Cluster T: fast-check global config (pinned seed=1; FC_SEED env override)
├── integration/             # Integration tests (build + run CLI)
│   └── *.test.ts            # Tests that require built CLI
├── e2e/                     # Full CLI integration
│   ├── smoke.test.ts            # End-to-end workflows
│   └── starter-snapshots.test.ts # Byte-level diff of `kigumi add` output against frozen fixtures (env-gated; see Cluster R)
├── fixtures/                # Frozen golden output for regression tests
│   ├── migration/               # Pre-0.20 config shapes for migration tests
│   └── starter-snapshots/{react,vue,angular,next}/  # Per-starter `kigumi add` output (regen via `pnpm update:starter-snapshots`)
└── .tmp-react-*/            # Temporary test projects (gitignored)
```

## Commands

```bash
pnpm test              # Unit tests (fast)
pnpm test:integration  # Integration tests (requires build first)
pnpm test:e2e          # E2E tests (slow, creates real projects)
pnpm test:starters     # Snapshot diff against a real starter (env-gated; KIGUMI_STARTER + KIGUMI_STARTER_DIR required)
pnpm test:stories      # Storybook play() interactions (browser-mode vitest in docs/)
pnpm test:coverage     # Unit tests with coverage report
pnpm test:mutation     # Mutation testing via Stryker (cluster V; weekly cron + manual)
pnpm test:mutation:incremental  # Stryker incremental mode (skip already-tested mutants)
pnpm test:all          # Build + unit + integration + e2e + stories (sequential, fail-fast)
pnpm test:watch        # Watch mode
```

`pnpm test:all` (and `pnpm test:stories`) require Chromium for the storybook lane; install once with `cd docs && pnpm exec playwright install chromium`.

`pnpm test:mutation` is documented in detail in the [Mutation testing](#mutation-testing-pnpm-testmutation) section below.

---

## Type-Checking Tests

`tests/**` is included in `tsconfig.tests.json` and gated by `pnpm check:tests`.
The script runs `tsc --noEmit -p tsconfig.tests.json` and fails CI on any error.
The historical baseline at `tests/.tsc-baseline.json` was retired in PR #137
once the existing 133 errors were fixed; the gate is now strict.

```bash
pnpm check:tests                       # gate; fails on any tests/ type error
pnpm check:tests --update-baseline     # re-create the baseline (only if a deliberate
                                       # batch of new errors needs allowlisting)
```

### When `tsc` upgrades introduce new error codes

A TypeScript minor bump can flag previously-silent issues. Fix the new errors
in the upgrade PR. Re-introducing the baseline file is a last resort and should
be paired with a follow-up plan to drain it.

---

## Test Helpers (`tests/unit/_helpers/`)

Sibling modules shared across unit tests. Prefer these over per-file `vi.mock`
factories (cluster S).

| Helper                                                                               | Use when                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestOutput()` (from `_helpers/output.ts`)                                     | You only need a satisfies-the-interface output that records via `vi.fn()` and lets you assert with `vi.mocked(output.success).toHaveBeenCalledWith(...)`. The 4 init-family tests still use this shape.                                                                                                                                                                           |
| `createRecordingOutput()` (from `_helpers/output.ts`)                                | You want a `RecordingOutput` with a typed `calls` array. Assert via `expect(output.calls).toContainEqual({ method: 'note', args: ['Settings', expect.stringContaining('awesome')] })`. Pair with `setOutputForTesting(output)`.                                                                                                                                                   |
| `createTestPrompts(scripts)` (from `_helpers/prompts.ts`)                            | You need a scripted `PromptsAdapter`. Pass arrays for `confirm`, `select`, `text`, `multiselect`; the adapter dispenses them in order. Throws "Unexpected prompt" when a script is exhausted or an unconfigured method is called, so missing setup fails loud. Pair with `setPromptsForTesting(prompts)`. Set `cancelSymbol` to drive the cancellation path through `isCancel()`. |
| `writeTierFixture(dir, 'free' \| 'pro')` (from `_helpers/tier.ts`)                   | You need `detectTier()` to read a real `package.json` instead of mocking `src/utils/tier.js`. Call after `mkdtemp` + `chdir(testDir)`; production code reads the dependencies map and returns the requested tier.                                                                                                                                                                 |
| `createTestKigumiConfig(overrides)` (from `_helpers/kigumi-config.ts`)               | You need a fully-typed `KigumiConfig` for `parseKigumiConfig()` callers.                                                                                                                                                                                                                                                                                                          |
| `createTestAddOptions(overrides)` (from `_helpers/add-options.ts`)                   | You need a fully-typed `AddOptions` for command tests.                                                                                                                                                                                                                                                                                                                            |
| `registerTestSeams(output, prompts)` / `clearTestSeams()` (from `_helpers/seams.ts`) | You're wiring both the output and prompts seams in the same test file. Call `registerTestSeams` after `vi.resetModules()` in `beforeEach`, and `clearTestSeams` in `afterEach`. Wraps the dynamic-import dance below.                                                                                                                                                             |

The DI hooks live on the production modules. Prefer `registerTestSeams` /
`clearTestSeams` from `_helpers/seams.ts` so the dynamic-import boilerplate
stays in one place:

```typescript
// In beforeEach (after vi.resetModules()):
await registerTestSeams(
  createRecordingOutput(),
  createTestPrompts({ select: ['react'] })
);

// In afterEach:
await clearTestSeams();
```

Direct seam access is still available when only one of the two seams is
needed (e.g. `setOutputForTesting` alone):

```typescript
const outMod = await import('../../src/output/index.js');
outMod.setOutputForTesting(createRecordingOutput());
// ...
(await import('../../src/output/index.js')).resetOutputForTesting();
```

The dynamic imports are required because the registered instance lives in
module-level state, and `vi.resetModules()` evicts the module so the next
import re-evaluates with fresh state - register the test instance after
the reset, before the production command's dynamic import.

For other module-level seams (`regenerate`, `github-fetcher`, `github-token`,
`registry-resolver`, `version-map`, `template`, `registry`), prefer
`vi.spyOn(module, 'fn').mockResolvedValue(...)` per-test inside the
beforeEach or test body. `vi.spyOn` does not match the `vi\.mock`
substring used by the budget gate (see below) and preserves the rest of
the module's real behavior.

## Mock Budget (`pnpm check:mocks`)

`scripts/check-mock-budget.ts` walks `tests/unit/`, counts `vi.mock`
substring matches, and gates against:

- **Total**: < 50 across `tests/unit/` (currently 16; cluster S PR-S4
  closed out the initiative).
- **Per-file**: `theme-commands.test.ts` < 10 (currently 0).

Modes:

```bash
pnpm check:mocks                        # advisory; prints counts, exits 0
MOCK_BUDGET_ENFORCE=1 pnpm check:mocks  # enforced; exits 1 on threshold breach
```

CI runs the gate in enforce mode (`MOCK_BUDGET_ENFORCE=1` set in the
`Check mock budget` step in `.github/workflows/ci.yml`); the local
stop-hook stays advisory and runs alongside `check:tests` on the
test-only fast path.

### Legitimate exceptions to `vi.mock`

The cluster S target leaves room for ~30 mocks. These are the documented
exceptions:

- **`execa` / `node:child_process`**: tests that must not actually shell
  out (subprocess boundaries are fine to mock; spawning a real binary in
  unit tests is the smell).
- **Third-party SDKs without a kigumi wrapper**: when no internal seam
  exists yet. Add the seam in a follow-up if the same SDK gets mocked in
  three or more places.

`@clack/prompts` is **not** an exception once the wrapper migration is
complete. New tests must register a `setPromptsForTesting()` adapter
instead.

---

## Negative-Path Inventory

Every user-facing command must have at least three negative-path tests
(invalid input, missing dependency, failed pre-flight, surfaced error).
The table below tracks current coverage; reviewers extending a command
must add or update a row when introducing a new failure mode.

Cluster T (PR-T3) ships this section. New tests added in cluster T
are noted as `[T1]` (property tests), `[T2]` (corrupt-config), and
`[T3]` (concurrency / failure-modes).

| Command                  | Scenario                                       | Expected Surface                | Test File                                         | Test Name (substring)                                                        |
| ------------------------ | ---------------------------------------------- | ------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `init`                   | unsupported framework                          | `ConfigInvalidError`            | `tests/unit/options-schema.test.ts`               | `rejects invalid framework`                                                  |
| `init`                   | unknown top-level config key (e.g. `framwork`) | `ConfigInvalidError`            | `tests/unit/schemas/config-property.test.ts` [T1] | `rejects an arbitrary unknown top-level key on kigumiConfigSchema`           |
| `init`                   | `--yes` mode with missing required arg         | `ValidationError`               | `tests/unit/options-schema.test.ts`               | `throws formatted error on invalid input`                                    |
| `init`                   | user cancels prompt mid-flow                   | `UserCancelledError`            | `tests/unit/init-validate-and-prepare.test.ts`    | `throws UserCancelledError when the user picks "cancel"`                     |
| `init`                   | missing `package.json`                         | `PreFlightCheckError`           | `tests/unit/init-validate-and-prepare.test.ts`    | `rejects with PreFlightCheckError when package.json is missing`              |
| `add`                    | no config present                              | error output (no throw)         | `tests/unit/add-command.test.ts`                  | `should fail without config file`                                            |
| `add`                    | malformed config JSON                          | `ConfigInvalidError`            | `tests/unit/add-command.test.ts`                  | `should fail with invalid config (completely broken JSON)`                   |
| `add`                    | typo'd config key                              | `ConfigInvalidError`            | `tests/unit/add-command.test.ts`                  | `surfaces ConfigInvalidError instead of the generic post-check fallback`     |
| `add`                    | invalid component name                         | error output                    | `tests/unit/add-command.test.ts`                  | `should handle invalid component names`                                      |
| `add`                    | GitHub fetcher 401 / 403                       | `Error` "Authentication failed" | `tests/unit/failure-modes.test.ts` [T3]           | `fetchFile throws on 403 with "Authentication failed"`                       |
| `add`                    | GitHub fetcher 429                             | `Error` with status code        | `tests/unit/failure-modes.test.ts` [T3]           | `fetchFile throws on 429 with the status code in the message`                |
| `add`                    | network unreachable (ECONNREFUSED)             | `TypeError`                     | `tests/unit/failure-modes.test.ts` [T3]           | `fetchFile rethrows a TypeError when fetch rejects with ECONNREFUSED`        |
| `update`                 | no config present                              | `output.error` call             | `tests/unit/update-command.test.ts`               | `should call output.error when no config is found`                           |
| `update`                 | empty `componentsDir`                          | "no installed components"       | `tests/unit/update-command.test.ts`               | `should report no installed components when componentsDir is empty`          |
| `update`                 | snapshot/template merge conflict               | conflict markers written        | `tests/unit/update-command.test.ts`               | `should write conflict markers when changes overlap`                         |
| `upgrade`                | no config file                                 | `output.error` + exit           | `tests/unit/upgrade-command.test.ts`              | `should error when no config file exists`                                    |
| `upgrade`                | typo'd config key                              | hint + non-zero exit            | `tests/unit/upgrade-command.test.ts`              | `prepends a friendly hint and exits non-zero on typo configs`                |
| `diff`                   | no config present                              | `output.error` call             | `tests/unit/diff-command.test.ts`                 | `should call output.error when no config is found`                           |
| `diff`                   | empty `componentsDir`                          | "no installed components"       | `tests/unit/diff-command.test.ts`                 | `should report no installed components when componentsDir is empty`          |
| `diff`                   | non-existent `componentsDir`                   | "no installed components"       | `tests/unit/diff-command.test.ts`                 | `should report no installed components when componentsDir does not exist`    |
| `theme set`              | no config file                                 | error                           | `tests/unit/theme-commands.test.ts`               | `should fail without config file`                                            |
| `theme set`              | pro theme on free tier                         | `ProThemeRequiredError`         | `tests/unit/theme-commands.test.ts`               | `should reject pro theme on free tier with ProThemeRequiredError`            |
| `theme set`              | typo'd config key                              | `ConfigInvalidError`            | `tests/unit/config-error-surface.test.ts`         | `theme command surfaces ConfigInvalidError on typo config`                   |
| `theme set`              | user cancellation                              | `UserCancelledError`            | `tests/unit/theme-commands.test.ts`               | `should handle user cancellation`                                            |
| `theme show`             | no config file                                 | error                           | `tests/unit/theme-commands.test.ts`               | `should fail without config file` (in `show` describe)                       |
| `theme show`             | pro theme on free tier                         | `ProThemeRequiredError`         | `tests/unit/theme-commands.test.ts`               | `should reject pro theme on free tier`                                       |
| `theme show`             | malformed config                               | `ConfigInvalidError`            | `tests/unit/config-error-surface.test.ts`         | `theme command surfaces ConfigInvalidError on typo config`                   |
| `theme install`          | no config file                                 | error                           | `tests/unit/theme-commands.test.ts`               | `should fail without config file` (in `install` describe)                    |
| `theme install`          | invalid theme name                             | error output                    | `tests/unit/theme-commands.test.ts`               | `should fail when theme not found in registry`                               |
| `theme install`          | typo'd config key                              | `ConfigInvalidError`            | `tests/unit/config-error-surface.test.ts`         | `theme command surfaces ConfigInvalidError on typo config`                   |
| `palette`                | no config file                                 | error                           | `tests/unit/palette-command.test.ts`              | `should fail without config file`                                            |
| `palette`                | invalid palette name                           | exits non-zero                  | `tests/unit/palette-command.test.ts`              | `should reject invalid palette name and call process.exit`                   |
| `palette`                | pro palette on free tier                       | `ProThemeRequiredError`         | `tests/unit/palette-command.test.ts`              | `should reject pro palettes on free tier`                                    |
| `palette`                | typo'd config key                              | `ConfigInvalidError`            | `tests/unit/config-error-surface.test.ts`         | `palette command surfaces ConfigInvalidError on typo config`                 |
| `brand`                  | no config file                                 | error                           | `tests/unit/brand-command.test.ts`                | `should fail without config file`                                            |
| `brand`                  | invalid brand color                            | exits non-zero                  | `tests/unit/brand-command.test.ts`                | `should reject invalid brand color and call process.exit`                    |
| `brand`                  | typo'd config key                              | `ConfigInvalidError`            | `tests/unit/config-error-surface.test.ts`         | `brand command surfaces ConfigInvalidError on typo config`                   |
| `brand`                  | user cancellation                              | `UserCancelledError`            | `tests/unit/brand-command.test.ts`                | `should handle user cancellation`                                            |
| `status`                 | no config file                                 | thrown error                    | `tests/unit/status.test.ts`                       | `should throw error when config not found`                                   |
| `status`                 | tier mismatch (pro package without token)      | warning                         | `tests/unit/status.test.ts`                       | `should warn about tier mismatch (pro package without token)`                |
| `status`                 | duplicate WA packages installed                | warning                         | `tests/unit/status.test.ts`                       | `should warn about duplicate packages`                                       |
| `status`                 | missing components directory                   | graceful handling               | `tests/unit/status.test.ts`                       | `should handle missing components directory gracefully`                      |
| `registry init`          | existing `registry.json`                       | warn (do not overwrite)         | `tests/unit/registry-init-command.test.ts`        | `should warn if registry.json already exists`                                |
| `registry init`          | user provides bad arg                          | exits with error                | `tests/unit/registry-init-command.test.ts`        | (see scaffold negative-path describes)                                       |
| `registry init`          | user cancellation                              | `UserCancelledError`            | `tests/unit/registry-init-command.test.ts`        | (interactive-prompts describe)                                               |
| `registry validate`      | missing `registry.json`                        | failure                         | `tests/unit/registry-validate-command.test.ts`    | `should fail when registry.json does not exist`                              |
| `registry validate`      | invalid JSON                                   | failure                         | `tests/unit/registry-validate-command.test.ts`    | `should fail on invalid JSON`                                                |
| `registry validate`      | invalid Zod schema                             | failure                         | `tests/unit/registry-validate-command.test.ts`    | `should fail on invalid schema`                                              |
| `registry validate`      | missing referenced files                       | failure                         | `tests/unit/registry-validate-command.test.ts`    | `should detect missing referenced files`                                     |
| `registry validate`      | wrong file extension for framework             | failure                         | `tests/unit/registry-validate-command.test.ts`    | `should detect wrong file extensions for framework`                          |
| `registry connect`       | foreign-framework registry                     | warn (proceed)                  | `tests/unit/registry-connect-command.test.ts`     | `warns (does not throw) when connecting a foreign-framework registry`        |
| `registry connect`       | duplicate connection                           | no-op                           | `tests/unit/registry-connect-command.test.ts`     | `does not duplicate when the same local registry is connected twice`         |
| `registry connect`       | typo'd config key                              | `ConfigInvalidError`            | `tests/unit/config-error-surface.test.ts`         | `registry list-sources action surfaces ConfigInvalidError on typo config`    |
| `registry list`          | no registries configured                       | message + zero exit             | `tests/unit/registry-list-remove-command.test.ts` | `should show message when no registries configured`                          |
| `registry list`          | missing config file                            | non-zero exit                   | `tests/unit/registry-list-remove-command.test.ts` | `should exit with error code when config is missing`                         |
| `registry list`          | typo'd config key                              | `ConfigInvalidError`            | `tests/unit/config-error-surface.test.ts`         | `registry list-sources action surfaces ConfigInvalidError on typo config`    |
| `registry remove`        | unknown registry URL/name                      | warn                            | `tests/unit/registry-list-remove-command.test.ts` | `should warn when registry not found`                                        |
| `registry remove`        | components depend on it                        | warn about affected components  | `tests/unit/registry-list-remove-command.test.ts` | `should warn about affected components when removing registry`               |
| `registry remove`        | missing config file                            | non-zero exit                   | `tests/unit/registry-list-remove-command.test.ts` | `should exit with error code when config is missing`                         |
| `registry add-component` | missing `registry.json`                        | no-op                           | `tests/unit/registry-add-component.test.ts`       | `returns without writing when registry.json is missing`                      |
| `registry add-component` | invalid `registry.json`                        | no-op                           | `tests/unit/registry-add-component.test.ts`       | `returns without writing when registry.json fails Zod parse`                 |
| `registry add-component` | duplicate slug                                 | rejection                       | `tests/unit/registry-add-component.test.ts`       | `rejects duplicate slug via the slug prompt validate function`               |
| `registry add-component` | user cancellation                              | `UserCancelledError`            | `tests/unit/registry-add-component.test.ts`       | `aborts via UserCancelledError when the user cancels mid-flow`               |
| `registry add-theme`     | missing `registry.json`                        | no-op                           | `tests/unit/registry-add-theme.test.ts`           | `returns without writing when registry.json is missing`                      |
| `registry add-theme`     | invalid `registry.json`                        | no-op                           | `tests/unit/registry-add-theme.test.ts`           | `returns without writing when registry.json fails Zod parse`                 |
| `registry add-theme`     | duplicate / non-kebab / empty slug             | rejection                       | `tests/unit/registry-add-theme.test.ts`           | `rejects duplicate slug, non-kebab-case, and empty via slug prompt validate` |

### Cross-cutting infrastructure (covers many commands)

| Surface                    | Scenario                                 | Expected Behavior          | Test File                                        | Test Name (substring)                                              |
| -------------------------- | ---------------------------------------- | -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| `loadConfig` / `getConfig` | BOM-prefixed JSON                        | throws via cosmiconfig     | `tests/unit/schemas/config-corrupt.test.ts` [T2] | `throws when kigumi.config.json starts with a UTF-8 BOM`           |
| `loadConfig` / `getConfig` | trailing-comma JSON                      | throws                     | `tests/unit/schemas/config-corrupt.test.ts` [T2] | `throws when JSON has a trailing comma`                            |
| `loadConfig` / `getConfig` | truncated mid-write                      | throws                     | `tests/unit/schemas/config-corrupt.test.ts` [T2] | `throws when the config file was truncated`                        |
| `loadConfig` / `getConfig` | wrong type per required field            | `ConfigInvalidError`       | `tests/unit/schemas/config-corrupt.test.ts` [T2] | `rejects $field set to a wrong-type value via ConfigInvalidError`  |
| `saveConfig`               | concurrent disjoint patches (race)       | at-least-one-fulfils       | `tests/unit/concurrency.test.ts` [T3]            | `leaves disk in a valid JSON state and at least one patch fulfils` |
| `saveConfig`               | mid-write `loadConfig` race              | `ConfigNotFoundError` on B | `tests/unit/concurrency.test.ts` [T3]            | `exposes the load-modify-write race`                               |
| `saveConfig`               | `fs.writeJson` rejects (ENOSPC / EACCES) | propagates with code       | `tests/unit/failure-modes.test.ts` [T3]          | `saveConfig propagates ENOSPC ... with code preserved`             |

---

## Regression suite (`tests/unit/regression/`)

Cluster V (F-X11) bug-bash arm. Each test in this directory protects against
a specific historical bug that real users hit and the project later fixed.
Mutation testing (next section) measures _whether_ tests catch generic
breakage; this directory provides documented evidence that the suite catches
the specific breakage on file.

**Where it lives.** The cluster-V spec writes the path as `tests/regression/`.
Execution placed it under `tests/unit/regression/` so the existing positional
`pnpm test tests/unit` glob, the `tests/unit/`-scoped `pnpm check:mocks`
budget, the `tsconfig.tests.json` baseline, and `.lintstagedrc.json`'s
`vitest related` gate all cover these tests automatically. `tests/regression/`
remains an option for a future move; the rename is mechanical.

**File-header contract.** Every test opens with:

```ts
/**
 * Protects: PR #117 (F-037)
 * Bug: <one-line user-visible symptom>
 * Fix: <commit-SHA-of-original-fix> — <one-line summary>
 */
```

The `describe()` block name should match the protected PR/F-ID.

**Adding a new entry.** Pick a bug from `~/.claude/projects/kigumi-cli-overview.md`
or recent merged PRs that (a) was user-visible, (b) had a non-trivial fix,
(c) covers a structural area the rest of the suite touches. Write a test that
asserts the invariant the fix established. Verify on a scratch branch:

```bash
git checkout -b scratch/regression-verify-<id> main
git revert <fix-merge-sha> --mainline 1
pnpm test tests/unit/regression/<your-file>
# must fail
git checkout main && git branch -D scratch/regression-verify-<id>
```

If `git revert` is impossible (later refactors renamed files), assert the
logical invariant instead and note "revert verification by manual code
rollback" in the file header.

See `tests/unit/regression/README.md` for the full contract.

## Mutation testing (`pnpm test:mutation`)

Cluster V (F-X10). [StrykerJS](https://stryker-mutator.io/) mutates a
declared subset of `src/**` and runs the unit suite per mutant. The
percentage of mutants killed by _any_ test = the mutation score. The break
threshold is **80 %**; below that the run fails.

Run locally with `pnpm test:mutation`. Output:
`reports/mutation/mutation.html` (gitignored). The CI workflow at
`.github/workflows/mutation.yml` runs weekly (Sun 02:00 UTC) plus on manual
`workflow_dispatch`, with a 30-day artifact retention.

V1 baseline scope: `src/utils/tier.ts` only (89.13 % kill rate). Wider
scopes hit two upstream blockers and are tracked as follow-up: see
`stryker.conf.mjs` for the full investigation. The mutate list is
intentionally a literal array of paths so future PRs widen it explicitly.

**Why `coverageAnalysis: 'all'`** instead of the spec's `'perTest'`
preference: the patched `@stryker-mutator/vitest-runner@9.6.1` plus vitest
4.x hangs the `perTest` dry run on this codebase regardless of mutate
scope. `'all'` is functionally equivalent for the score (it runs all tests
per mutant; the kill criterion is the same).

**Why `disableTypeChecks: 'src/**/\*.ts'`** is on: Stryker's mutators
intentionally introduce type errors; treating them as failures would
pollute the score. Type safety is enforced separately by `pnpm type-check`and`pnpm check:tests` (Cluster Q1's tests baseline).

**Why the upstream `@stryker-mutator/vitest-runner` is patched** (see
`patches/`): vitest 4.x's threads pool forbids `process.chdir()`, which 5
legacy unit tests rely on. The runner hardcodes `pool: 'threads'`. The
patch switches it to `pool: 'forks'` (singleFork) so all tests run.

---

## Local Pre-Commit Signal

`.husky/pre-commit` runs `pnpm lint-staged && pnpm type-check` on every commit.
The lint-staged config at `.lintstagedrc.json` scopes test execution narrowly:

- `src/**/*.{ts,tsx}` and `tests/unit/**/*.{ts,tsx}`: eslint, prettier, and
  `vitest related --run` (runs only the unit tests that import the staged files).
- `tests/integration/**`, `tests/e2e/**`, `scripts/**`: eslint and prettier only.
  Integration and e2e suites are CI-only; firing them on commit would block for
  minutes.
- Other globs (json/md/vue/css/etc.): prettier-only formatting.

Typical commit overhead is 5 to 30 seconds depending on how many unit tests the
staged files transitively touch. Failures block the commit; fix the failing
test or back out the change before retrying.

```bash
HUSKY=0 git commit -m '...'    # emergency escape hatch; skips both halves
```

Use the escape hatch only for branch-state operations (rebase fixups, WIP
snapshots) where running tests would be premature. CI re-runs lint, type-check,
and the full unit suite on every PR, so escaped commits get caught at push.

`vitest related` uses the root `vitest.config.ts`, which includes only
`tests/unit/**`. The e2e suite has its own `vitest.e2e.config.ts` (used by
`pnpm test:e2e`); integration uses `vitest.integration.config.ts`. Neither
fires from the pre-commit hook.

---

## Test Types

### Unit Tests (`tests/unit/`)

Fast, isolated tests for utilities and business logic.

```typescript
import { describe, it, expect } from 'vitest';
import { detectTier } from '@/utils/tier';

describe('detectTier', () => {
  it('returns free when no .env exists', async () => {
    const tier = await detectTier('/nonexistent');
    expect(tier).toBe('free');
  });
});
```

**What to unit test:**

- Pure functions
- Utility helpers
- Zod schema validation
- Tier detection logic
- Config parsing
- Command handlers (diff, upgrade, doctor, theme, brand, palette)
- File regeneration (kigumi.ts, layers.css, theme.css)
- Community registry schema validation
- GitHub URL parsing and token resolution
- Registry caching (disk cache TTL, invalidation)
- Dependency resolution (topological sort, circular detection)

### E2E Tests (`tests/e2e/`)

Full CLI integration tests that create real projects.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';

describe('smoke test', () => {
  const testDir = 'tests/.tmp-smoke';

  beforeAll(async () => {
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    await fs.remove(testDir);
  });

  it('initializes a React project', async () => {
    const result = await execa(
      'node',
      [
        'dist/index.js',
        'init',
        '--framework=react',
        '--theme=awesome',
        '--yes',
      ],
      { cwd: testDir }
    );

    expect(result.exitCode).toBe(0);
    expect(await fs.pathExists(`${testDir}/kigumi.config.json`)).toBe(true);
  });
});
```

---

## Test Guidelines

### Do Test

- Tier detection from `.env`
- Config validation with Zod
- Migration logic (Free↔Pro)
- Component registry lookups
- Error handling paths

### Don't Test

- Third-party libraries (Commander, Zod)
- File system mocking (use real temp dirs)
- Generated component output (test in browser)

### JSON with Comments

Use `readJSONWithComments()` when testing with Vite configs:

```typescript
import { readJSONWithComments } from '@/utils/json';

// tsconfig.app.json has comments that break fs.readJSON()
const tsconfig = await readJSONWithComments(tsconfigPath);
```

### Internals Exported for Test Coverage

Some command helpers are exported solely for direct unit testing when the
surrounding command handler would require too much mocking to exercise the
helper's logic in isolation. Current cases:

- `resolveComponents` in `src/utils/installed-components.ts` — shared by the
  `diff` and `update` commands, and asserted directly by
  `tests/unit/update-command.test.ts`, `tests/unit/diff-command.test.ts`, and
  `tests/unit/regression/f-095-community-component-skip.test.ts` (multi-word
  kebab↔PascalCase canonicalization, and the builtin/community split).
- `handleTierMigration`, `confirmMigration`, `confirmInstallation`, and
  `showPostInstallInstructions` in `src/commands/init/index.ts` — exported so
  `tests/unit/init-tier-migration.test.ts`,
  `tests/unit/init-post-install-instructions.test.ts`, and
  `tests/unit/init-validate-and-prepare.test.ts` can cover Free↔Pro migration
  prompts, post-install instruction branches, and the non-interactive paths
  without staging the entire `initCommand` orchestration.

If you add a similar export, keep it at the bottom of the module, mark its
role in the accompanying test's describe block, and avoid adding new public
callers — these are test-only seams.

---

## E2E Test Projects

E2E tests create temporary projects in `tests/.tmp-*`:

| Directory        | Purpose                  |
| ---------------- | ------------------------ |
| `.tmp-react-ts/` | TypeScript React project |
| `.tmp-react-js/` | JavaScript React project |
| `.tmp-smoke/`    | Smoke test artifacts     |

These are gitignored and recreated on each run.

---

## Browser Testing

Component behavior is verified manually in browser:

1. Build CLI: `pnpm build`
2. Initialize project: `node dist/index.js init --framework=react --yes`
3. Add component: `node dist/index.js add dialog`
4. Run dev server: `cd tests/.tmp-react-ts && pnpm dev`
5. Verify in browser

**Check:**

- Components render with styles
- Events fire correctly
- TypeScript has no errors
- Console has no errors

---

## Tier Migration Testing

Critical tests for Free↔Pro migration:

```bash
# Setup
npm create vite@latest tests/test-migration -- --template react-ts

# Test Free→Pro
cd tests/test-migration
node ../../dist/index.js init --framework=react --theme=awesome --yes
echo "WEBAWESOME_NPM_TOKEN=your_token" > .env
node ../../dist/index.js init --framework=react --theme=brutalist

# Verify: Only @awesome.me/webawesome-pro in package.json
grep webawesome package.json

# Test Pro→Free
rm .env
node ../../dist/index.js init --framework=react --theme=awesome

# Verify: Only @awesome.me/webawesome in package.json
grep webawesome package.json
```

---

## Adding Tests

1. Create test file in appropriate directory
2. Use `describe`/`it` from Vitest
3. Use real file operations (no mocking fs)
4. Clean up temp files in `afterAll`

```typescript
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs-extra';

describe('myFeature', () => {
  const tmpDir = 'tests/.tmp-mytest';

  afterAll(() => fs.remove(tmpDir));

  it('works correctly', async () => {
    // test implementation
  });
});
```

---

## Angular Skill Evals

- `.claude/skills/kigumi-angular/evals/evals.json` -- 10 eval prompts covering variant remap, CVA, event suffixes, control flow, slot syntax

### Angular Starter Testing

Validate skill output in `~/Documents/dev/git/kigumi-angular/`:

1. Generate example component from skill output
2. Add to `src/app/` or `src/components/`
3. Run `ng build` -- must compile without errors
4. Run `ng serve` + visual verification via Chrome DevTools

---

**Parent:** [AGENTS.md](../AGENTS.md)

**Last Updated:** 2026-08-23 (added validate-wa-pins.test.ts and post-changeset-version.test.ts covering release-time version markers)

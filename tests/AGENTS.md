# Testing Guide

> Test suite for Kigumi CLI - extends [root AGENTS.md](../AGENTS.md)

## Directory Structure

```
tests/
├── unit/                    # Fast, isolated tests (80 files, 1223 tests; +5 in scripts/)
│   ├── add-command.test.ts          # Add command (built-in + remote)
│   ├── add-command-cross-framework.test.ts # Add command --cross-framework flag
│   ├── add-validator.test.ts        # Component validation
│   ├── brand-command.test.ts        # Brand color command
│   ├── check-runner.test.ts         # Pre-flight check runner
│   ├── component-installer.test.ts  # Component installer logic
│   ├── community-registry.test.ts   # Registry schema, URL parsing, deps
│   ├── component-selector.test.ts   # buildSelectorChoices + selectComponents dispatch
│   ├── config.test.ts               # Config loading/saving
│   ├── config-checks.test.ts        # Config validation checks
│   ├── config-schema.test.ts        # Zod config schema validation
│   ├── dependency-checks.test.ts    # Dependency validation
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
│   ├── framework-detection.test.ts  # Extended framework detection
│   ├── github-token.test.ts         # GitHub PAT resolution chain
│   ├── init-config-preservation.test.ts # Init with config preservation scenarios
│   ├── init-existing-config.test.ts # Init with existing project
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
│   ├── palette-command.test.ts      # Palette command
│   ├── preflight-errors.test.ts     # Pre-flight error classes
│   ├── project-config.test.ts       # Project config helpers
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
│   ├── validate-cem-sync.test.ts    # CEM sync validation
│   ├── validate-parity.test.ts      # Template parity validation
│   ├── validate-registry.test.ts    # Registry validator (fields, props, tags)
│   ├── parse-custom-elements-css.test.ts  # CEM → CSS_METADATA extraction + framework parity
│   ├── validation-errors.test.ts    # Validation error classes
│   ├── version-check.test.ts        # CLI vs project version check
│   ├── version-error.test.ts        # Version error classes
│   ├── version-map.test.ts          # Version history data
│   ├── angular-templates.test.ts    # Angular template generation validation (collision-resolution exercised against Tooltip — Dialog is no longer a collision case since WA 3.5.0 marked its show()/requestClose() private)
│   ├── vue-templates.test.ts        # Vue template generation validation
│   └── scripts/
│       ├── check-tests-baseline.test.ts        # Tests for the tsc baseline gate wrapper
│       ├── generate-angular-templates.test.ts  # Snapshot-pinned Angular wrapper generator (Button + Badge)
│       ├── generate-react-templates.test.ts    # Snapshot-pinned React wrapper generator (Button + Badge)
│       ├── generate-vue-templates.test.ts      # Snapshot-pinned Vue wrapper generator (Button + Badge + Switch)
│       └── post-changeset-version.test.ts      # Snapshot-pinned changeset → Keep-a-Changelog rewrite
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
pnpm test:coverage     # Unit tests with coverage report
pnpm test:all          # Build + unit + integration + e2e (sequential, fail-fast)
pnpm test:watch        # Watch mode
```

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

- `resolveComponents` in `src/commands/update.ts` and `src/commands/diff.ts` —
  exported so `tests/unit/update-command.test.ts` and
  `tests/unit/diff-command.test.ts` can assert the scan- and names-branch
  behaviour directly (multi-word kebab↔PascalCase canonicalization).
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

**Last Updated:** 2026-05-02

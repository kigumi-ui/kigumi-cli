# Testing Guide

> Test suite for Kigumi CLI - extends [root AGENTS.md](../AGENTS.md)

## Directory Structure

```
tests/
├── unit/                    # Fast, isolated tests (53 files, 906 tests)
│   ├── add-command.test.ts          # Add command (built-in + remote)
│   ├── add-validator.test.ts        # Component validation
│   ├── brand-command.test.ts        # Brand color command
│   ├── check-runner.test.ts         # Pre-flight check runner
│   ├── component-installer.test.ts  # Component installer logic
│   ├── community-registry.test.ts   # Registry schema, URL parsing, deps
│   ├── config.test.ts               # Config loading/saving
│   ├── config-checks.test.ts        # Config validation checks
│   ├── config-schema.test.ts        # Zod config schema validation
│   ├── dependency-checks.test.ts    # Dependency validation
│   ├── detect-framework.test.ts     # Framework/TS/PM detection
│   ├── diff-command.test.ts         # Diff command (component comparison)
│   ├── diff-roundtrip.test.ts       # Diff renderer round-trip fidelity
│   ├── display-options.test.ts      # Theme/palette/brand display data
│   ├── doctor.test.ts               # Doctor command (import fixes)
│   ├── edge-cases.test.ts           # Edge case handling
│   ├── error-classes.test.ts        # Error class hierarchy
│   ├── errors.test.ts               # Error formatting
│   ├── file-diff.test.ts            # File modification detection
│   ├── framework-detection.test.ts  # Extended framework detection
│   ├── github-token.test.ts         # GitHub PAT resolution chain
│   ├── init-existing-config.test.ts # Init with existing project
│   ├── init-installer.test.ts       # Init installer logic
│   ├── list.test.ts                 # List command
│   ├── list-json.test.ts            # List --json output
│   ├── migration.test.ts            # Free↔Pro migration
│   ├── network-errors.test.ts       # Network error classes
│   ├── options-schema.test.ts       # Command options schemas
│   ├── palette-command.test.ts      # Palette command
│   ├── preflight-errors.test.ts     # Pre-flight error classes
│   ├── project-config.test.ts       # Project config helpers
│   ├── regenerate.test.ts           # File regeneration utilities
│   ├── remote-installer.test.ts     # Remote (community) component installer
│   ├── registry.test.ts             # Component registry lookups
│   ├── registry-cache.test.ts       # Disk cache for registries
│   ├── registry-init-command.test.ts      # Registry init command
│   ├── registry-list-remove-command.test.ts # Registry list/remove
│   ├── registry-validate-command.test.ts  # Registry validate command
│   ├── status.test.ts               # Status command
│   ├── snapshot.test.ts             # Snapshot CRUD and community install snapshots
│   ├── status-json.test.ts          # Status --json output
│   ├── storybook-generator.test.ts  # Storybook story generation
│   ├── template.test.ts             # Handlebars template rendering
│   ├── test-detection.test.ts       # Test framework detection
│   ├── theme.test.ts                # Theme validation
│   ├── theme-commands.test.ts       # Theme set/list/show/install commands
│   ├── tier.test.ts                 # Tier detection
│   ├── tier-restrictions.test.ts    # Tier restriction logic
│   ├── tier-schema.test.ts          # Tier schema validation
│   ├── token.test.ts                # Token handling
│   ├── token-manager.test.ts        # Token validation, loading, saving
│   ├── type-installation.test.ts    # TypeScript type installation
│   ├── update-check.test.ts         # CLI update notification check
│   ├── update-command.test.ts       # Update command (three-way merge)
│   ├── upgrade-command.test.ts      # Upgrade command (version management)
│   ├── validation-errors.test.ts    # Validation error classes
│   ├── version-check.test.ts        # CLI vs project version check
│   ├── version-error.test.ts        # Version error classes
│   ├── version-map.test.ts          # Version history data
│   └── angular-templates.test.ts    # Angular template generation validation
├── integration/             # Integration tests (build + run CLI)
│   └── *.test.ts            # Tests that require built CLI
├── e2e/                     # Full CLI integration
│   └── smoke.test.ts        # End-to-end workflows
└── .tmp-react-*/            # Temporary test projects (gitignored)
```

## Commands

```bash
pnpm test              # Unit tests (fast)
pnpm test:integration  # Integration tests (requires build first)
pnpm test:e2e          # E2E tests (slow, creates real projects)
pnpm test:coverage     # Unit tests with coverage report
pnpm test:all          # Both unit and E2E
pnpm test:watch        # Watch mode
```

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

- Third-party libraries (Handlebars, Commander)
- File system mocking (use real temp dirs)
- Generated component output (test in browser)

### JSON with Comments

Use `readJSONWithComments()` when testing with Vite configs:

```typescript
import { readJSONWithComments } from '@/utils/json';

// tsconfig.app.json has comments that break fs.readJSON()
const tsconfig = await readJSONWithComments(tsconfigPath);
```

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

**Parent:** [AGENTS.md](../AGENTS.md)

**Last Updated:** 2026-04-03

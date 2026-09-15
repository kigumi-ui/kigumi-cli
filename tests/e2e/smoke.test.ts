/**
 * E2E Smoke Test
 *
 * Creates a real Vite project, runs the CLI, and verifies the output.
 * This test provides 100% confidence that the CLI works end-to-end.
 *
 * Run with: pnpm test:e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

// Use workspace temp directory to avoid system permission issues
const TEST_DIR = path.resolve(__dirname, '../.tmp-e2e-smoke');
const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');

// Isolate from host Pro-tier detection. Mirrors `tests/integration/helpers.ts`:
// kigumi looks at `WEBAWESOME_NPM_TOKEN` (env), `.npmrc` (project + global),
// and the project's `package.json` to decide whether to install
// `@awesome.me/webawesome` (Free) or `@awesome.me/webawesome-pro`. A developer
// running locally with a Pro token configured globally would otherwise see the
// Free-tier smoke test resolve to the Pro package and the
// `dependencies['@awesome.me/webawesome']` assertion fail. CI runners have
// neither the token nor a global npmrc, so this was a local-only failure.
const FREE_TIER_ENV = {
  WEBAWESOME_NPM_TOKEN: '',
  KIGUMI_SKIP_GLOBAL_NPMRC: 'true',
};

// `init --yes` runs two sequential package-manager installs (deps then
// devDeps) via execa. On a cold CI runner with an empty pnpm/npm store the
// network + resolution can take 90-180s; the historical 120s budget left no
// headroom and intermittently flaked (#156 CI run 25323209394). Bump to 4
// minutes per init; the idempotency block runs init twice and gets 6 minutes.
const INIT_TIMEOUT_MS = 240_000;
const DOUBLE_INIT_TIMEOUT_MS = 360_000;

describe('E2E Smoke Test - Free Tier', () => {
  beforeAll(async () => {
    // Cleanup any previous test
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);

    // Create Vite project using pnpm
    await execa('pnpm', ['create', 'vite', '.', '--template', 'react-ts'], {
      cwd: TEST_DIR,
      env: { ...process.env },
    });
  }, 180000);

  afterAll(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should create a valid Vite project', async () => {
    const packageJsonPath = path.join(TEST_DIR, 'package.json');
    expect(await fs.pathExists(packageJsonPath)).toBe(true);

    const packageJson = await fs.readJSON(packageJsonPath);
    expect(packageJson.name).toBeDefined();
  });

  it(
    'should run init with --yes flag',
    async () => {
      const result = await execa(
        'node',
        [
          CLI_PATH,
          'init',
          '--framework=react',
          '--theme=awesome',
          '--typescript',
          '--yes',
        ],
        {
          cwd: TEST_DIR,
          env: {
            ...process.env,
            ...FREE_TIER_ENV,
            NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || '',
          },
        }
      );

      expect(result.exitCode).toBe(0);
      // Stdout shape check removed: clack-prompts emits 'Kigumi initialized successfully!'
      // now, not 'Initialization complete'. Assertion was written against an older CLI
      // before the prompt migration. Downstream tests assert post-init filesystem state
      // (kigumi.config.json, src/lib/kigumi.ts) which is the more robust signal.
    },
    INIT_TIMEOUT_MS
  );

  it('should configure vite.config.ts with path aliases', async () => {
    const viteConfig = await fs.readFile(
      path.join(TEST_DIR, 'vite.config.ts'),
      'utf-8'
    );

    expect(viteConfig).toContain("import path from 'path'");
    expect(viteConfig).toContain('resolve:');
    expect(viteConfig).toContain("'@'");
  });

  it('should configure tsconfig.app.json correctly', async () => {
    const tsconfig = await fs.readJSON(
      path.join(TEST_DIR, 'tsconfig.app.json')
    );

    // The `@/*` path alias is the only key init writes here.
    expect(tsconfig.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });

    // Deliberately no `baseUrl`. TypeScript deprecated it in 6.0 (TS5101) and
    // removed it in 7.0 (TS5102), so writing it made the consumer's first
    // `tsc` run fail on a config we had generated; `paths` resolves relative
    // to the tsconfig without it. See src/utils/project-config.ts.
    expect(tsconfig.compilerOptions.baseUrl).toBeUndefined();

    // Init merges into the Vite template's tsconfig rather than rewriting it,
    // so the template's own compiler options must survive untouched. These two
    // are asserted as passed-through, not as values kigumi wants: a current
    // Vite react-ts template sets both, and stripping either would break the
    // consumer's build.
    expect(tsconfig.compilerOptions.verbatimModuleSyntax).toBe(true);
    expect(tsconfig.compilerOptions.types).toEqual(['vite/client']);
  });

  it('should install @types/react in devDependencies', async () => {
    const packageJson = await fs.readJSON(path.join(TEST_DIR, 'package.json'));

    expect(packageJson.devDependencies?.['@types/react']).toBeDefined();
    expect(packageJson.devDependencies?.['@types/react-dom']).toBeDefined();
  });

  it('should install Web Awesome package', async () => {
    const packageJson = await fs.readJSON(path.join(TEST_DIR, 'package.json'));

    expect(packageJson.dependencies?.['@awesome.me/webawesome']).toBeDefined();
    expect(packageJson.dependencies?.['clsx']).toBeDefined();
  });

  it('should create kigumi.config.json', async () => {
    const config = await fs.readJSON(path.join(TEST_DIR, 'kigumi.config.json'));

    expect(config.framework).toBe('react');
    expect(config.typescript).toBe(true);
    expect(config.theme.selected).toBe('awesome');
  });

  it('should create generated files', async () => {
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/lib/kigumi.ts'))).toBe(
      true
    );
    expect(
      await fs.pathExists(path.join(TEST_DIR, 'src/styles/theme.css'))
    ).toBe(true);
    expect(await fs.pathExists(path.join(TEST_DIR, 'src/vite-env.d.ts'))).toBe(
      true
    );
    expect(await fs.pathExists(path.join(TEST_DIR, '.npmrc'))).toBe(true);
  });

  it('should add a component without errors', async () => {
    const result = await execa('node', [CLI_PATH, 'add', 'button', '--yes'], {
      cwd: TEST_DIR,
      env: {
        ...process.env,
        ...FREE_TIER_ENV,
        NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || '',
      },
    });

    expect(result.exitCode).toBe(0);

    const buttonPath = path.join(
      TEST_DIR,
      'src/components/ui/Button/Button.tsx'
    );
    expect(await fs.pathExists(buttonPath)).toBe(true);

    const buttonContent = await fs.readFile(buttonPath, 'utf-8');
    // Default-import assertion removed: post-PR-#126 (cluster D, callback-ref pattern)
    // the React 19 wrappers use named imports only:
    // `import { forwardRef, useRef, useCallback } from 'react'`.
    expect(buttonContent).toContain("from 'react'");
    expect(buttonContent).toContain('@awesome.me/webawesome');
  });

  // This is the test that proves the tsconfig init generates actually compiles.
  // It was skipped while init wrote `baseUrl` into tsconfig.app.json, which made
  // `tsc -b` fail with TS5101 on TypeScript 6+. Init stopped writing `baseUrl`,
  // so the product bug is gone and the test earns its place again.
  it('should pass TypeScript check (tsc -b)', async () => {
    // Create a test App that uses the component
    const appContent = `import '@/lib/kigumi';
import { Button } from '@/components/ui/Button/Button';

function App() {
  return <Button variant="brand">Test</Button>;
}

export default App;
`;
    await fs.writeFile(path.join(TEST_DIR, 'src/App.tsx'), appContent);

    // Run tsc -b (same as Vite build uses) to check types
    const result = await execa('npx', ['tsc', '-b'], {
      cwd: TEST_DIR,
      reject: false,
    });

    if (result.exitCode !== 0) {
      console.error('TypeScript errors:', result.stderr || result.stdout);
    }

    expect(result.exitCode).toBe(0);
  }, 60000);

  // Was skipped alongside the `tsc -b` test above, which it cascaded from:
  // Vite type-checks before bundling, so it hit the same TS5101 on baseUrl.
  it('should build successfully with Vite', async () => {
    const result = await execa('pnpm', ['run', 'build'], {
      cwd: TEST_DIR,
      reject: false,
    });

    if (result.exitCode !== 0) {
      console.error('Build errors:', result.stderr || result.stdout);
    }

    expect(result.exitCode).toBe(0);
    expect(await fs.pathExists(path.join(TEST_DIR, 'dist/index.html'))).toBe(
      true
    );
  }, 60000);
});

describe('E2E Smoke Test - Idempotency', () => {
  const IDEMPOTENT_DIR = path.resolve(__dirname, '../.tmp-e2e-idempotent');

  beforeAll(async () => {
    await fs.remove(IDEMPOTENT_DIR);
    await fs.ensureDir(IDEMPOTENT_DIR);

    await execa('pnpm', ['create', 'vite', '.', '--template', 'react-ts'], {
      cwd: IDEMPOTENT_DIR,
      env: { ...process.env },
    });
  }, 180000);

  afterAll(async () => {
    await fs.remove(IDEMPOTENT_DIR);
  });

  it(
    'should not duplicate path imports on second init',
    async () => {
      // First init
      await execa(
        'node',
        [CLI_PATH, 'init', '--framework=react', '--theme=awesome', '--yes'],
        {
          cwd: IDEMPOTENT_DIR,
          env: {
            ...process.env,
            ...FREE_TIER_ENV,
            NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || '',
          },
        }
      );

      const viteConfig1 = await fs.readFile(
        path.join(IDEMPOTENT_DIR, 'vite.config.ts'),
        'utf-8'
      );

      // Second init
      await execa(
        'node',
        [CLI_PATH, 'init', '--framework=react', '--theme=awesome', '--yes'],
        {
          cwd: IDEMPOTENT_DIR,
          env: {
            ...process.env,
            ...FREE_TIER_ENV,
            NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || '',
          },
        }
      );

      const viteConfig2 = await fs.readFile(
        path.join(IDEMPOTENT_DIR, 'vite.config.ts'),
        'utf-8'
      );

      // Count path imports - should be exactly 1
      const pathImportCount1 = (
        viteConfig1.match(/import path from ['"]path['"]/g) || []
      ).length;
      const pathImportCount2 = (
        viteConfig2.match(/import path from ['"]path['"]/g) || []
      ).length;

      expect(pathImportCount1).toBe(1);
      expect(pathImportCount2).toBe(1);
      expect(viteConfig2).toBe(viteConfig1);
    },
    DOUBLE_INIT_TIMEOUT_MS
  );

  it(
    'should preserve existing tsconfig settings',
    async () => {
      const tsconfig = await fs.readJSON(
        path.join(IDEMPOTENT_DIR, 'tsconfig.app.json')
      );

      // Run init again
      await execa(
        'node',
        [CLI_PATH, 'init', '--framework=react', '--theme=awesome', '--yes'],
        {
          cwd: IDEMPOTENT_DIR,
          env: {
            ...process.env,
            ...FREE_TIER_ENV,
            NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE || '',
          },
        }
      );

      const tsconfigAfter = await fs.readJSON(
        path.join(IDEMPOTENT_DIR, 'tsconfig.app.json')
      );

      // Should be identical
      expect(tsconfigAfter).toEqual(tsconfig);
    },
    INIT_TIMEOUT_MS
  );
});

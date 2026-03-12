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

  it('should run init with --yes flag', async () => {
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
        env: { ...process.env },
      }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Initialization complete');
  }, 120000);

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

    // Required path aliases
    expect(tsconfig.compilerOptions.baseUrl).toBe('.');
    expect(tsconfig.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });

    // Required for React imports
    expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
    expect(tsconfig.compilerOptions.allowSyntheticDefaultImports).toBe(true);

    // Should NOT have verbatimModuleSyntax (breaks React)
    expect(tsconfig.compilerOptions.verbatimModuleSyntax).toBeUndefined();

    // Should NOT have restrictive types array
    expect(tsconfig.compilerOptions.types).toBeUndefined();
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
    });

    expect(result.exitCode).toBe(0);

    const buttonPath = path.join(
      TEST_DIR,
      'src/components/ui/Button/Button.tsx'
    );
    expect(await fs.pathExists(buttonPath)).toBe(true);

    const buttonContent = await fs.readFile(buttonPath, 'utf-8');
    // Should use React namespace import pattern
    expect(buttonContent).toContain("import React from 'react'");
    expect(buttonContent).toContain('@awesome.me/webawesome');
  });

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

  it('should not duplicate path imports on second init', async () => {
    // First init
    await execa(
      'node',
      [CLI_PATH, 'init', '--framework=react', '--theme=awesome', '--yes'],
      { cwd: IDEMPOTENT_DIR }
    );

    const viteConfig1 = await fs.readFile(
      path.join(IDEMPOTENT_DIR, 'vite.config.ts'),
      'utf-8'
    );

    // Second init
    await execa(
      'node',
      [CLI_PATH, 'init', '--framework=react', '--theme=awesome', '--yes'],
      { cwd: IDEMPOTENT_DIR }
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
  }, 240000);

  it('should preserve existing tsconfig settings', async () => {
    const tsconfig = await fs.readJSON(
      path.join(IDEMPOTENT_DIR, 'tsconfig.app.json')
    );

    // Run init again
    await execa(
      'node',
      [CLI_PATH, 'init', '--framework=react', '--theme=awesome', '--yes'],
      { cwd: IDEMPOTENT_DIR }
    );

    const tsconfigAfter = await fs.readJSON(
      path.join(IDEMPOTENT_DIR, 'tsconfig.app.json')
    );

    // Should be identical
    expect(tsconfigAfter).toEqual(tsconfig);
  }, 120000);
});

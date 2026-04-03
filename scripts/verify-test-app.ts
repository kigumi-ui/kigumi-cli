#!/usr/bin/env npx tsx
/**
 * Verify Test App Script
 *
 * This script verifies that the test-app can be set up with Kigumi
 * and builds without TypeScript errors.
 *
 * Run with: pnpm verify:app
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_APP_DIR = path.join(ROOT_DIR, 'tests/test-app');
const CLI_PATH = path.join(ROOT_DIR, 'dist/index.js');

/**
 * Read JSON file that may contain comments (like Vite's tsconfig files)
 */
async function readJSONWithComments(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, 'utf-8');
  // Strip single-line comments
  const stripped = content.replace(/\/\/.*/g, '');
  return JSON.parse(stripped);
}

async function main() {
  console.log(pc.cyan('\n=== Kigumi Test App Verification ===\n'));

  // 1. Check test-app exists
  console.log(pc.dim('1. Checking test-app exists...'));
  if (!(await fs.pathExists(TEST_APP_DIR))) {
    console.error(pc.red('Error: tests/test-app does not exist'));
    process.exit(1);
  }
  console.log(pc.green('   ✓ test-app found'));

  // 2. Check CLI is built
  console.log(pc.dim('2. Checking CLI is built...'));
  if (!(await fs.pathExists(CLI_PATH))) {
    console.log(pc.yellow('   CLI not built, building now...'));
    await execa('pnpm', ['build'], { cwd: ROOT_DIR, stdio: 'inherit' });
  }
  console.log(pc.green('   ✓ CLI built'));

  // 3. Run kigumi init
  console.log(pc.dim('3. Running kigumi init...'));
  try {
    await execa(
      'node',
      [
        CLI_PATH,
        'init',
        '--framework=react',
        '--theme=awesome',
        '--typescript',
        '--yes',
      ],
      { cwd: TEST_APP_DIR, stdio: 'pipe' }
    );
    console.log(pc.green('   ✓ kigumi init completed'));
  } catch (error) {
    console.error(pc.red('   ✗ kigumi init failed'));
    if (error instanceof Error) {
      console.error(pc.dim(error.message));
    }
    process.exit(1);
  }

  // 4. Add all components
  console.log(pc.dim('4. Adding all components...'));
  try {
    await execa(
      'node',
      [
        CLI_PATH,
        'add',
        'button',
        'card',
        'dialog',
        'input',
        '--yes',
        '--force',
      ],
      { cwd: TEST_APP_DIR, stdio: 'pipe' }
    );
    console.log(pc.green('   ✓ Components added'));
  } catch (error) {
    console.error(pc.red('   ✗ Failed to add components'));
    if (error instanceof Error) {
      console.error(pc.dim(error.message));
    }
    process.exit(1);
  }

  // 5. Check tsconfig.app.json has path aliases
  console.log(pc.dim('5. Verifying tsconfig.app.json...'));
  const tsconfigPath = path.join(TEST_APP_DIR, 'tsconfig.app.json');
  const tsconfig = (await readJSONWithComments(tsconfigPath)) as {
    compilerOptions?: { paths?: Record<string, string[]> };
  };

  if (!tsconfig.compilerOptions?.paths?.['@/*']) {
    console.error(pc.red('   ✗ Missing @/* path alias'));
    process.exit(1);
  }
  console.log(pc.green('   ✓ tsconfig.app.json has path aliases'));

  // 6. Run TypeScript check
  console.log(pc.dim('6. Running TypeScript check (tsc -b)...'));
  try {
    await execa('npx', ['tsc', '-b'], { cwd: TEST_APP_DIR, stdio: 'pipe' });
    console.log(pc.green('   ✓ TypeScript check passed'));
  } catch (error) {
    console.error(pc.red('   ✗ TypeScript check failed'));
    if (error instanceof Error && 'stdout' in error) {
      console.error(pc.dim(String((error as { stdout?: string }).stdout)));
    }
    if (error instanceof Error && 'stderr' in error) {
      console.error(pc.dim(String((error as { stderr?: string }).stderr)));
    }
    process.exit(1);
  }

  // 7. Success
  console.log(pc.green(pc.bold('\n✓ All verification checks passed!\n')));
}

main().catch((error) => {
  console.error(pc.red('Verification failed:'), error);
  process.exit(1);
});

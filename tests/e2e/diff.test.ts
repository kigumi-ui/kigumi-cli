/**
 * E2E Diff Test
 *
 * Creates a real Vite project, runs the CLI, modifies a component, and verifies
 * that the diff and snapshot features work correctly end-to-end.
 *
 * Run with: pnpm test:e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

const TEST_DIR = path.resolve(__dirname, '../.tmp-e2e-diff');
const CLI_PATH = path.resolve(__dirname, '../../dist/index.js');

describe('E2E Diff Test - Snapshots and Diffs', () => {
  beforeAll(async () => {
    // Cleanup any previous test run
    await fs.remove(TEST_DIR);
    await fs.ensureDir(TEST_DIR);

    // Create a real Vite project
    await execa('pnpm', ['create', 'vite', '.', '--template', 'react-ts'], {
      cwd: TEST_DIR,
      env: { ...process.env },
    });
  }, 180000);

  afterAll(async () => {
    await fs.remove(TEST_DIR);
  });

  it('should initialize the project', async () => {
    await execa('node', [CLI_PATH, 'init', '--yes'], {
      cwd: TEST_DIR,
      env: { ...process.env, CI: 'true' },
    });
    expect(await fs.pathExists(path.join(TEST_DIR, 'kigumi.config.json'))).toBe(
      true
    );
  }, 120000);

  it('should create snapshot when adding a component', async () => {
    await execa('node', [CLI_PATH, 'add', 'button', '--yes'], {
      cwd: TEST_DIR,
      env: { ...process.env, CI: 'true' },
    });

    const snapshotDir = path.join(TEST_DIR, '.kigumi/snapshots/Button');
    expect(await fs.pathExists(snapshotDir)).toBe(true);

    const files = await fs.readdir(snapshotDir);
    expect(files.length).toBeGreaterThanOrEqual(2); // at least .tsx and .css
  }, 60000);

  it('should show diff when overwriting a modified component', async () => {
    // Modify the component file
    const buttonPath = path.join(
      TEST_DIR,
      'src/components/ui/Button/Button.tsx'
    );
    const content = await fs.readFile(buttonPath, 'utf-8');
    await fs.writeFile(buttonPath, '// user modification\n' + content);

    // Overwrite
    const result = await execa(
      'node',
      [CLI_PATH, 'add', 'button', '--overwrite', '--yes'],
      {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
        reject: false,
      }
    );

    // stdout should contain diff markers (the - for removed line)
    expect(result.stdout).toContain('Modified');
    expect(result.stdout).toContain('user modification');
  }, 60000);

  it('should show component status with diff command', async () => {
    const result = await execa('node', [CLI_PATH, 'diff', 'button'], {
      cwd: TEST_DIR,
      env: { ...process.env, CI: 'true' },
      reject: false,
    });

    expect(result.stdout).toContain('Button');
    // After overwrite, file should match template
    expect(result.stdout).toContain('unchanged');
  }, 60000);
});

/**
 * Registry Init Command Tests
 *
 * Tests for src/commands/registry/init.ts
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) instead of module-level
 * mocks for @clack/prompts and src/output/index.js.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

describe('registryInitAction', () => {
  let testDir: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    // Default empty prompts queue: --yes-flag tests never reach a prompt.
    // Tests 8 and 9 re-register a scripted adapter with the values they need.
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-reg-init-'))
    );
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    await clearTestSeams();
    process.exit = originalExit;
    await fs.remove(testDir);
  });

  it('should scaffold registry with --yes flag', async () => {
    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true });

    // Verify registry.json was created
    const registryPath = path.join(testDir, 'registry.json');
    expect(await fs.pathExists(registryPath)).toBe(true);

    const registry = await fs.readJSON(registryPath);
    expect(registry.name).toBe(path.basename(testDir));
    expect(registry.version).toBe('0.1.0');
    expect(registry.frameworks).toEqual(['react']);
    expect(registry.components).toEqual({});
    expect(registry.themes).toEqual({});
  });

  it('should use provided name with --yes flag', async () => {
    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true, name: 'my-registry' });

    const registry = await fs.readJSON(path.join(testDir, 'registry.json'));
    expect(registry.name).toBe('my-registry');
  });

  it('should create directory structure', async () => {
    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true });

    // react dir + themes dir (--yes defaults to react)
    expect(await fs.pathExists(path.join(testDir, 'components/react'))).toBe(
      true
    );
    expect(await fs.pathExists(path.join(testDir, 'themes'))).toBe(true);

    // .gitkeep files
    expect(
      await fs.pathExists(path.join(testDir, 'components/react/.gitkeep'))
    ).toBe(true);
    expect(await fs.pathExists(path.join(testDir, 'themes/.gitkeep'))).toBe(
      true
    );
  });

  it('should generate README.md', async () => {
    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true, name: 'test-reg' });

    const readmePath = path.join(testDir, 'README.md');
    expect(await fs.pathExists(readmePath)).toBe(true);

    const readme = await fs.readFile(readmePath, 'utf-8');
    expect(readme).toContain('# test-reg');
    expect(readme).toContain('react');
  });

  it('should warn if registry.json already exists', async () => {
    // Create existing registry.json
    await fs.writeJSON(path.join(testDir, 'registry.json'), {
      name: 'existing',
    });

    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true });

    expect(
      output.calls.some(
        (c) =>
          c.method === 'warning' &&
          typeof c.args[0] === 'string' &&
          c.args[0].includes('already exists')
      )
    ).toBe(true);
  });

  it('should show spinner during creation', async () => {
    // Override the recording output's spinner so we can also capture stop()
    // calls; the default noop spinner discards them.
    const stopCalls: Array<string | undefined> = [];
    const baseSpinner = output.spinner;
    output.spinner = (m) => {
      baseSpinner(m);
      return {
        start: () => {},
        message: () => {},
        stop: (msg) => {
          stopCalls.push(msg);
        },
        error: () => {},
      };
    };
    await registerTestSeams(output, prompts);

    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true });

    expect(output.calls).toContainEqual({
      method: 'spinner',
      args: ['Creating registry structure...'],
    });
    expect(stopCalls).toContain('Registry structure created');
  });

  it('should show next steps after creation', async () => {
    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true });

    expect(
      output.calls.some(
        (c) =>
          c.method === 'note' &&
          c.args[0] === 'Next steps' &&
          typeof c.args[1] === 'string' &&
          c.args[1].includes('Add components')
      )
    ).toBe(true);
  });

  it('should use interactive prompts when --yes is not set', async () => {
    prompts = createTestPrompts({
      text: ['my-reg', 'A description', 'Author'],
      multiselect: [['react', 'vue']],
    });
    await registerTestSeams(output, prompts);

    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir });

    const registry = await fs.readJSON(path.join(testDir, 'registry.json'));
    expect(registry.name).toBe('my-reg');
    expect(registry.description).toBe('A description');
    expect(registry.author).toBe('Author');
    expect(registry.frameworks).toEqual(['react', 'vue']);

    // Should create dirs for both frameworks
    expect(await fs.pathExists(path.join(testDir, 'components/react'))).toBe(
      true
    );
    expect(await fs.pathExists(path.join(testDir, 'components/vue'))).toBe(
      true
    );
  });

  it('should handle user cancellation', async () => {
    const cancelSym = Symbol('cancel');
    prompts = createTestPrompts({
      text: [cancelSym],
      cancelSymbol: cancelSym,
    });
    await registerTestSeams(output, prompts);

    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir });

    // Should not create registry.json
    expect(await fs.pathExists(path.join(testDir, 'registry.json'))).toBe(
      false
    );
  });
});

/**
 * Diff Roundtrip Tests
 *
 * Tests the full lifecycle:
 * 1. Simulate install (files + snapshot on disk)
 * 2. User modifies file
 * 3. Template changes (via mock)
 * 4. Update -> three-way merge + diff displayed
 *
 * Uses real filesystem with mocked template/registry.
 * Files and snapshots are written directly (not through installer)
 * to isolate the update/merge logic from pre-flight checks.
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts / writeTierFixture) instead of
 * vi.mock for @clack/prompts, output, and tier. The remaining vi.mocks for
 * diff-renderer, template, and registry have no DI seam yet and are kept.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { saveSnapshot, loadSnapshot } from '../../src/utils/snapshot.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import { writeTierFixture } from './_helpers/tier.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

vi.mock('../../src/utils/diff-renderer.js', () => ({
  renderDiff: vi.fn().mockReturnValue('mocked diff output'),
}));

vi.mock('../../src/utils/template.js', () => ({
  generateComponent: vi.fn().mockResolvedValue('// generated component'),
  generateComponentCSSContent: vi.fn().mockResolvedValue('/* generated css */'),
  generateComponentTestContent: vi.fn().mockResolvedValue('// generated test'),
  getComponentExtension: vi.fn().mockReturnValue('tsx'),
  getTestExtension: vi.fn().mockReturnValue('test.tsx'),
  getFileBaseName: vi
    .fn()
    .mockImplementation((_fw: string, name: string) => name),
}));

vi.mock('../../src/utils/registry.js', async () => {
  const { toKebabCase } = await vi.importActual<
    typeof import('../../src/utils/naming.js')
  >('../../src/utils/naming.js');
  const registry: Record<string, { name: string; [k: string]: unknown }> = {
    button: {
      name: 'Button',
      tagName: 'wa-button',
      importPath: '@awesome.me/webawesome/dist/components/button/button.js',
      tier: 'free',
      category: 'Actions',
      description: 'Buttons',
      dependencies: [],
      files: {
        react: { component: 'Button.tsx', css: 'Button.css' },
      },
      props: [],
    },
  };
  return {
    getComponent: vi.fn((name: string) => registry[name.toLowerCase()] ?? null),
    normalizeComponentName: vi.fn((input: string) => {
      const match = registry[toKebabCase(input)];
      return match ? match.name : null;
    }),
  };
});

describe('diff roundtrip', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    // All tests in this file write a snapshot before running update, so the
    // no-snapshot-differ confirm path is never reached. Empty queue suffices.
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-diff-roundtrip-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    await clearTestSeams();
    process.chdir(originalCwd);
    process.exit = originalExit;
    await fs.remove(testDir);
  });

  async function createConfig(): Promise<void> {
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      utilsDir: 'src/lib',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
    });
  }

  async function installComponent(
    name: string,
    files: Record<string, string>
  ): Promise<void> {
    const componentDir = path.join(testDir, 'src/components', name);
    await fs.ensureDir(componentDir);
    for (const [fileName, content] of Object.entries(files)) {
      await fs.writeFile(path.join(componentDir, fileName), content, 'utf-8');
    }
  }

  // ── 3-way merge: user edit + template change -> clean merge + diff ──

  it('should three-way merge user edits with template changes and show diff', async () => {
    await createConfig();

    const base = 'line1\nline2\nline3\nline4\nline5';
    const userEdit = 'line1 user customized\nline2\nline3\nline4\nline5';
    const theirs = 'line1\nline2\nline3\nline4\nline5 template updated';

    await installComponent('Button', {
      'Button.tsx': userEdit,
      'Button.css': '/* generated css */',
    });
    await saveSnapshot(testDir, 'Button', {
      'Button.tsx': base,
      'Button.css': '/* generated css */',
    });

    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue(theirs);

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    // Merged content has BOTH user edit AND template change
    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toContain('user customized');
    expect(content).toContain('template updated');

    // renderDiff was called for the clean-merge
    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    expect(renderDiff).toHaveBeenCalled();

    // Snapshot updated to theirs
    const snapshot = await loadSnapshot(testDir, 'Button');
    expect(snapshot!['Button.tsx']).toBe(theirs);
  });

  // ── User edited, template unchanged -> up-to-date, no diff ──

  it('should not show diff when template has not changed', async () => {
    await createConfig();

    await installComponent('Button', {
      'Button.tsx': '// user modified',
      'Button.css': '/* generated css */',
    });
    // Snapshot = theirs (template didn't change) -> base === theirs -> up-to-date
    await saveSnapshot(testDir, 'Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });

    // Ensure template mock returns default value (may have been overridden by prior tests)
    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue('// generated component');

    const { updateCommand } = await import('../../src/commands/update.js');
    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    const callsBefore = vi.mocked(renderDiff).mock.calls.length;

    await updateCommand(['Button'], { cwd: testDir });

    // No NEW renderDiff calls (template unchanged -> up-to-date)
    expect(vi.mocked(renderDiff).mock.calls.length).toBe(callsBefore);
  });

  // ── Nothing changed -> up-to-date ──

  it('should be up-to-date and show no diff when nothing changed', async () => {
    await createConfig();

    // Ensure template mock returns default value (may have been overridden by prior tests)
    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue('// generated component');

    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });
    await saveSnapshot(testDir, 'Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });

    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    const callsBefore = vi.mocked(renderDiff).mock.calls.length;

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    // No NEW renderDiff calls during this update
    expect(vi.mocked(renderDiff).mock.calls.length).toBe(callsBefore);

    const upToDate = output.calls
      .filter((c) => c.method === 'info')
      .map((c) => c.args[0])
      .filter((m): m is string => typeof m === 'string')
      .filter((m) => m.includes('up to date'));
    expect(upToDate.length).toBeGreaterThanOrEqual(1);
  });
});

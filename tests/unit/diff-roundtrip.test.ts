/**
 * Diff Roundtrip Tests
 *
 * Tests the full lifecycle:
 * 1. Simulate install (files + snapshot on disk)
 * 2. User modifies file
 * 3. Template changes (via spy)
 * 4. Update -> three-way merge + diff displayed
 *
 * Uses real filesystem with spied template/registry/diff-renderer modules.
 * Files and snapshots are written directly (not through installer)
 * to isolate the update/merge logic from pre-flight checks.
 *
 * Cluster S: uses the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts / writeTierFixture) for
 * @clack/prompts, output, and tier. PR-S4: switched residual factory mocks
 * for diff-renderer / template / registry to per-test `vi.spyOn` on
 * dynamically-imported namespaces (re-imported post-`vi.resetModules()`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { saveSnapshot, loadSnapshot } from '../../src/utils/snapshot.js';
import { toKebabCase } from '../../src/utils/naming.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import { writeTierFixture } from './_helpers/tier.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';
import type { ComponentDefinition } from '../../src/utils/registry/types.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

const cannedRegistry: Record<string, ComponentDefinition> = {
  button: {
    name: 'Button',
    tagName: 'wa-button',
    importPath: '@awesome.me/webawesome/dist/components/button/button.js',
    tier: 'free',
    category: 'Actions',
    description: 'Buttons',
    dependencies: [],
    files: {},
    props: [],
  },
};

describe('diff roundtrip', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;
  let generateComponentSpy: ReturnType<typeof vi.spyOn>;
  let renderDiffSpy: ReturnType<typeof vi.spyOn>;

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

    // Spies for the residual seams. Modules must be dynamically imported AFTER
    // vi.resetModules() so the spy wraps the same instance the SUT will see on
    // its own dynamic import. The non-stubbed template helpers
    // (getComponentExtension / getTestExtension / getFileBaseName) keep their
    // real behavior; the React framework defaults match what the prior
    // factory stub returned ('tsx' / 'test.tsx' / identity).
    const template = await import('../../src/utils/template.js');
    generateComponentSpy = vi
      .spyOn(template, 'generateComponent')
      .mockResolvedValue('// generated component');
    vi.spyOn(template, 'generateComponentCSSContent').mockResolvedValue(
      '/* generated css */'
    );
    vi.spyOn(template, 'generateComponentTestContent').mockResolvedValue(
      '// generated test'
    );

    const registry = await import('../../src/utils/registry.js');
    vi.spyOn(registry, 'getComponent').mockImplementation(
      (name: string) => cannedRegistry[name.toLowerCase()] ?? null
    );
    vi.spyOn(registry, 'normalizeComponentName').mockImplementation(
      (input: string) => {
        const match = cannedRegistry[toKebabCase(input)];
        return match ? match.name : null;
      }
    );

    const diffRenderer = await import('../../src/utils/diff-renderer.js');
    renderDiffSpy = vi
      .spyOn(diffRenderer, 'renderDiff')
      .mockReturnValue('mocked diff output');
  });

  afterEach(async () => {
    await clearTestSeams();
    process.chdir(originalCwd);
    process.exit = originalExit;
    await fs.remove(testDir);
    vi.restoreAllMocks();
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

    generateComponentSpy.mockResolvedValue(theirs);

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
    expect(renderDiffSpy).toHaveBeenCalled();

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

    generateComponentSpy.mockResolvedValue('// generated component');

    const callsBefore = renderDiffSpy.mock.calls.length;

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    // No NEW renderDiff calls (template unchanged -> up-to-date)
    expect(renderDiffSpy.mock.calls.length).toBe(callsBefore);
  });

  // ── Nothing changed -> up-to-date ──

  it('should be up-to-date and show no diff when nothing changed', async () => {
    await createConfig();

    generateComponentSpy.mockResolvedValue('// generated component');

    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });
    await saveSnapshot(testDir, 'Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });

    const callsBefore = renderDiffSpy.mock.calls.length;

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    // No NEW renderDiff calls during this update
    expect(renderDiffSpy.mock.calls.length).toBe(callsBefore);

    const upToDate = output.calls
      .filter((c) => c.method === 'info')
      .map((c) => c.args[0])
      .filter((m): m is string => typeof m === 'string')
      .filter((m) => m.includes('up to date'));
    expect(upToDate.length).toBeGreaterThanOrEqual(1);
  });
});

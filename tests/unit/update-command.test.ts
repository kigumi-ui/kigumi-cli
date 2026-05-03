/**
 * Update Command Tests
 *
 * Tests for src/commands/update.ts
 *
 * Covers:
 * - No config → error handling
 * - No installed components → info message
 * - Up to date with snapshot → skip
 * - Safe overwrite → file written + snapshot updated
 * - Clean merge → file merged + snapshot updated
 * - Conflict → markers written + warning
 * - Legacy no-snapshot match → snapshot created
 * - Legacy no-snapshot differ → prompts user
 * - --dry-run → no writes
 * - --force → overwrite without merge
 * - --yes → auto-confirm
 * - Specific component names filter
 * - Multiple components mixed scenarios
 * - Community component → skipped (not in registry)
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
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import { writeTierFixture } from './_helpers/tier.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

// Mock diff renderer
vi.mock('../../src/utils/diff-renderer.js', () => ({
  renderDiff: vi.fn().mockReturnValue('mocked diff output'),
}));

// Mock template generation (pass through real utility functions)
vi.mock('../../src/utils/template.js', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/utils/template.js')
  >('../../src/utils/template.js');
  return {
    generateComponent: vi.fn().mockResolvedValue('// generated component'),
    generateComponentCSSContent: vi
      .fn()
      .mockResolvedValue('/* generated css */'),
    generateComponentTestContent: vi
      .fn()
      .mockResolvedValue('// generated test'),
    getComponentExtension: actual.getComponentExtension,
    getTestExtension: actual.getTestExtension,
    getFileBaseName: actual.getFileBaseName,
  };
});

// Mock registry
vi.mock('../../src/utils/registry.js', async () => {
  const { toKebabCase } = await vi.importActual<
    typeof import('../../src/utils/naming.js')
  >('../../src/utils/naming.js');
  const registry: Record<
    string,
    {
      name: string;
      tagName: string;
      importPath: string;
      tier: string;
      category: string;
      description: string;
    }
  > = {
    button: {
      name: 'Button',
      tagName: 'wa-button',
      importPath: '@awesome.me/webawesome/dist/components/button/button.js',
      tier: 'free',
      category: 'Actions',
      description: 'Buttons represent actions available to the user',
    },
    dialog: {
      name: 'Dialog',
      tagName: 'wa-dialog',
      importPath: '@awesome.me/webawesome/dist/components/dialog/dialog.js',
      tier: 'free',
      category: 'Overlays',
      description: 'Dialogs display interactive content',
    },
    'button-group': {
      name: 'ButtonGroup',
      tagName: 'wa-button-group',
      importPath:
        '@awesome.me/webawesome/dist/components/button-group/button-group.js',
      tier: 'free',
      category: 'Actions',
      description: 'Groups related buttons together',
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

describe('updateCommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    // Empty queue by default. Tests that reach the no-snapshot-differ confirm
    // prompt re-register with their own scripted queue (Test 20 uses
    // confirm: [false] for the decline scenario). An empty default keeps the
    // fail-loud contract of createTestPrompts intact: any unexpected prompt
    // call surfaces as "Unexpected prompt: confirm(...)" rather than silently
    // consuming a leftover entry and masking a regression.
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-update-cmd-'))
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

  async function createConfig(
    overrides: Record<string, unknown> = {}
  ): Promise<void> {
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      utilsDir: 'src/lib',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
      ...overrides,
    };
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
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

  async function createSnapshot(
    name: string,
    files: Record<string, string>
  ): Promise<void> {
    const snapshotDir = path.join(testDir, '.kigumi/snapshots', name);
    await fs.ensureDir(snapshotDir);
    for (const [fileName, content] of Object.entries(files)) {
      await fs.writeFile(path.join(snapshotDir, fileName), content, 'utf-8');
    }
  }

  function infoMessages(): string[] {
    return output.calls
      .filter((c) => c.method === 'info')
      .map((c) => c.args[0])
      .filter((m): m is string => typeof m === 'string');
  }

  // ── Test 1: No config → error ──

  it('should call output.error when no config is found', async () => {
    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand([], { cwd: testDir });

    expect(output.calls.some((c) => c.method === 'error')).toBe(true);
    expect(process.exit).toHaveBeenCalled();
  });

  // ── Test 2: No installed components → info message ──

  it('should report no installed components when componentsDir is empty', async () => {
    await createConfig();
    await fs.ensureDir(path.join(testDir, 'src/components'));

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand([], { cwd: testDir });

    expect(
      infoMessages().some((m) => m.includes('No installed components'))
    ).toBe(true);
  });

  // ── Test 3: Up to date with snapshot → skip ──

  it('should report up to date when snapshot matches template', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// user modified component',
      'Button.css': '/* generated css */',
    });
    // Snapshot base === theirs (generated) → template unchanged
    await createSnapshot('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    const upToDateLines = infoMessages().filter((m) =>
      m.includes('up to date')
    );
    expect(upToDateLines.length).toBeGreaterThanOrEqual(1);
  });

  // ── Test 4: Safe overwrite → file written + snapshot updated ──

  it('should overwrite when user did not edit (base === ours)', async () => {
    await createConfig();
    // ours === base, but theirs is different
    await installComponent('Button', {
      'Button.tsx': '// old generated component',
      'Button.css': '/* old generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// old generated component',
      'Button.css': '/* old generated css */',
    });

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    // File should be updated
    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toBe('// generated component');

    const overwriteLines = infoMessages().filter((m) =>
      m.includes('safe overwrite')
    );
    expect(overwriteLines.length).toBeGreaterThanOrEqual(1);
  });

  // ── Test 5: Clean merge → file merged + snapshot updated ──

  it('should merge cleanly when changes do not overlap', async () => {
    const base = 'line1\nline2\nline3\nline4\nline5';
    const ours = 'line1 user edit\nline2\nline3\nline4\nline5';
    const theirs = 'line1\nline2\nline3\nline4\nline5 template edit';

    await createConfig();
    await installComponent('Button', {
      'Button.tsx': ours,
      'Button.css': '/* generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': base,
      'Button.css': '/* generated css */',
    });

    // Mock to return specific theirs content
    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue(theirs);

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toContain('line1 user edit');
    expect(content).toContain('line5 template edit');
  });

  // ── Test 6: Conflict → markers written + warning ──

  it('should write conflict markers when changes overlap', async () => {
    const base = 'line1\nshared line\nline3';
    const ours = 'line1\nuser change\nline3';
    const theirs = 'line1\ntemplate change\nline3';

    await createConfig();
    await installComponent('Button', {
      'Button.tsx': ours,
      'Button.css': '/* generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': base,
      'Button.css': '/* generated css */',
    });

    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue(theirs);

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toContain('<<<<<<< yours');
    expect(content).toContain('=======');
    expect(content).toContain('>>>>>>> theirs');

    const conflictLines = infoMessages().filter((m) => m.includes('conflict'));
    expect(conflictLines.length).toBeGreaterThanOrEqual(1);
  });

  // ── Test 7: Legacy no-snapshot match → snapshot created ──

  it('should report no-snapshot-match when files match template without snapshot', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });
    // No snapshot

    // Reset generateComponent to its default mock value. Without this, leaked
    // .mockResolvedValue() state from Test 6 makes the wrapper return a
    // different `theirs`, which would route the merge through the
    // no-snapshot-differ branch and reach a confirm prompt — not the
    // no-snapshot-match path this test is meant to exercise.
    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue('// generated component');

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    const matchLines = infoMessages().filter((m) =>
      m.includes('matches template')
    );
    expect(matchLines.length).toBeGreaterThanOrEqual(1);
  });

  // ── Test 8: Legacy no-snapshot differ → prompts user ──

  it('should warn when no snapshot and files differ from template', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// user customized',
      'Button.css': '/* custom css */',
    });
    // No snapshot, content differs from mock generated

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir, yes: true });

    expect(output.calls).toContainEqual({
      method: 'warn',
      args: [expect.stringContaining('no snapshot found')],
    });
  });

  // ── Test 9: --dry-run → no writes ──

  it('should not write files in dry-run mode', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// old generated component',
      'Button.css': '/* old generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// old generated component',
      'Button.css': '/* old generated css */',
    });

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir, dryRun: true });

    // File should NOT be updated
    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toBe('// old generated component');
  });

  // ── Test 10: --force → overwrite without merge ──

  it('should overwrite all files in force mode', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// user customized content',
      'Button.css': '/* custom css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// original base',
      'Button.css': '/* original css */',
    });

    // Ensure mock returns default generated content (may be changed by prior tests)
    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue('// generated component');

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir, force: true });

    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toBe('// generated component');
  });

  // ── Test 11: Specific component names filter ──

  it('should only update specified components when names are provided', async () => {
    await createConfig();

    // Install both Button and Dialog
    await installComponent('Button', {
      'Button.tsx': '// old btn',
      'Button.css': '/* old btn css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// old btn',
      'Button.css': '/* old btn css */',
    });

    await installComponent('Dialog', {
      'Dialog.tsx': '// old dlg',
      'Dialog.css': '/* old dlg css */',
    });
    await createSnapshot('Dialog', {
      'Dialog.tsx': '// old dlg',
      'Dialog.css': '/* old dlg css */',
    });

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    const summaryLine = infoMessages().find((m) =>
      m.includes('component(s) processed')
    );
    expect(summaryLine).toContain('1');
  });

  // ── Test 12: Multiple components mixed scenarios ──

  it('should process multiple components with different statuses', async () => {
    await createConfig();

    // Button: up to date (snapshot base === theirs)
    await installComponent('Button', {
      'Button.tsx': '// user modified',
      'Button.css': '/* generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });

    // Dialog: safe overwrite (base === ours)
    await installComponent('Dialog', {
      'Dialog.tsx': '// old generated component',
      'Dialog.css': '/* old generated css */',
    });
    await createSnapshot('Dialog', {
      'Dialog.tsx': '// old generated component',
      'Dialog.css': '/* old generated css */',
    });

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand([], { cwd: testDir });

    const summaryLine = infoMessages().find((m) =>
      m.includes('component(s) processed')
    );
    expect(summaryLine).toContain('2');
  });

  // ── Test 13: Community component → skipped (not in registry) ──

  it('should skip non-builtin components when scanning directory', async () => {
    await createConfig();

    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });

    // Custom (non-registry) component
    await fs.ensureDir(path.join(testDir, 'src/components/CustomWidget'));
    await fs.writeFile(
      path.join(testDir, 'src/components/CustomWidget/CustomWidget.tsx'),
      '// custom widget',
      'utf-8'
    );

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand([], { cwd: testDir });

    const summaryLine = infoMessages().find((m) =>
      m.includes('component(s) processed')
    );
    expect(summaryLine).toContain('1');
  });

  // ── Test 14: intro and outro ──

  it('should call intro and outro', async () => {
    await createConfig();
    await fs.ensureDir(path.join(testDir, 'src/components'));

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand([], { cwd: testDir });

    expect(output.calls).toContainEqual({
      method: 'intro',
      args: ['kigumi update'],
    });
    expect(output.calls).toContainEqual({
      method: 'outro',
      args: ['Done'],
    });
  });

  // ── Test 15: safe-overwrite calls renderDiff with correct arguments ──

  it('should call renderDiff for safe-overwrite files', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// old generated component',
      'Button.css': '/* old generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// old generated component',
      'Button.css': '/* old generated css */',
    });

    const { updateCommand } = await import('../../src/commands/update.js');
    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    await updateCommand(['Button'], { cwd: testDir });

    expect(renderDiff).toHaveBeenCalledWith(
      '// old generated component',
      '// generated component',
      'Button.tsx'
    );
  });

  // ── Test 16: up-to-date does NOT call renderDiff ──

  it('should not call renderDiff for up-to-date files', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// user modified component',
      'Button.css': '/* generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
    });

    const { updateCommand } = await import('../../src/commands/update.js');
    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    await updateCommand(['Button'], { cwd: testDir });

    expect(renderDiff).not.toHaveBeenCalled();
  });

  // ── Test 17: conflict calls renderDiff ──

  it('should call renderDiff for conflict files', async () => {
    const base = 'line1\nshared line\nline3';
    const ours = 'line1\nuser change\nline3';
    const theirs = 'line1\ntemplate change\nline3';

    await createConfig();
    await installComponent('Button', {
      'Button.tsx': ours,
      'Button.css': '/* generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': base,
      'Button.css': '/* generated css */',
    });

    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue(theirs);

    const { updateCommand } = await import('../../src/commands/update.js');
    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    await updateCommand(['Button'], { cwd: testDir });

    expect(renderDiff).toHaveBeenCalledWith(
      ours,
      expect.any(String),
      'Button.tsx'
    );
  });

  // ── Test 18: dry-run shows diff but does not write ──

  it('should show diff in dry-run mode without writing files', async () => {
    await createConfig();
    // base === ours (user didn't edit), theirs differs -> safe-overwrite
    await installComponent('Button', {
      'Button.tsx': '// old generated component',
      'Button.css': '/* old generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// old generated component',
      'Button.css': '/* old generated css */',
    });

    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    const callsBefore = vi.mocked(renderDiff).mock.calls.length;

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir, dryRun: true });

    // renderDiff should be called (diff shown even in dry-run)
    expect(vi.mocked(renderDiff).mock.calls.length).toBeGreaterThan(
      callsBefore
    );

    // But file should NOT be modified
    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toBe('// old generated component');
  });

  // ── Test 19: force mode shows diff even for would-be conflicts ──

  it('should show diff and overwrite in force mode', async () => {
    const base = 'line1\nshared\nline3';
    const ours = 'line1\nuser change\nline3';

    await createConfig();
    await installComponent('Button', {
      'Button.tsx': ours,
      'Button.css': '/* generated css */',
    });
    await createSnapshot('Button', {
      'Button.tsx': base,
      'Button.css': '/* generated css */',
    });

    // Reset generateComponent to default (may have been overridden by prior tests)
    const { generateComponent } = await import('../../src/utils/template.js');
    vi.mocked(generateComponent).mockResolvedValue('// generated component');

    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    const callsBefore = vi.mocked(renderDiff).mock.calls.length;

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir, force: true });

    // renderDiff called (force shows diff of ours -> theirs)
    expect(vi.mocked(renderDiff).mock.calls.length).toBeGreaterThan(
      callsBefore
    );

    // File overwritten with generated content
    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toBe('// generated component');
  });

  // ── Test 20: user declines snapshot creation ──

  it('should not create snapshot when user declines', async () => {
    await createConfig();
    // No snapshot exists, ours differs from theirs -> no-snapshot-differ
    await installComponent('Button', {
      'Button.tsx': '// user custom code',
      'Button.css': '/* generated css */',
    });
    // No createSnapshot call -> no snapshot on disk

    // Re-register prompts so confirm() returns false in this test only.
    await registerTestSeams(output, createTestPrompts({ confirm: [false] }));

    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    const callsBefore = vi.mocked(renderDiff).mock.calls.length;

    const { updateCommand } = await import('../../src/commands/update.js');
    await updateCommand(['Button'], { cwd: testDir });

    // renderDiff NOT called (no-snapshot-differ doesn't show diff)
    expect(vi.mocked(renderDiff).mock.calls.length).toBe(callsBefore);

    // File unchanged
    const content = await fs.readFile(
      path.join(testDir, 'src/components/Button/Button.tsx'),
      'utf-8'
    );
    expect(content).toBe('// user custom code');

    // No snapshot created
    const snapshotDir = path.join(testDir, '.kigumi/snapshots/Button');
    expect(await fs.pathExists(snapshotDir)).toBe(false);
  });

  describe('resolveComponents (multi-word regression)', () => {
    // Regression guard: previously the scan branch used name.toLowerCase()
    // to build registry keys, so ButtonGroup → buttongroup missed the
    // button-group key and was silently dropped. The names branch used
    // charAt(0).toUpperCase() which turned button-group into Button-group.
    it('recognizes PascalCase multi-word directories in the scan branch', async () => {
      const { resolveComponents } =
        await import('../../src/commands/update.js');
      const componentsDir = path.join(testDir, 'src/components');
      await fs.ensureDir(path.join(componentsDir, 'Button'));
      await fs.ensureDir(path.join(componentsDir, 'ButtonGroup'));
      await fs.ensureDir(path.join(componentsDir, 'NotAComponent'));

      const config = {
        framework: 'react' as const,
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const result = await resolveComponents([], config, testDir);

      expect(result).toEqual(['Button', 'ButtonGroup']);
    });

    it('canonicalizes kebab-case name arguments to PascalCase', async () => {
      const { resolveComponents } =
        await import('../../src/commands/update.js');
      const config = {
        framework: 'react' as const,
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const result = await resolveComponents(
        ['button-group', 'button'],
        config,
        testDir
      );

      expect(result).toEqual(['ButtonGroup', 'Button']);
    });

    it('accepts PascalCase name arguments unchanged', async () => {
      const { resolveComponents } =
        await import('../../src/commands/update.js');
      const config = {
        framework: 'react' as const,
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const result = await resolveComponents(
        ['ButtonGroup', 'Button'],
        config,
        testDir
      );

      expect(result).toEqual(['ButtonGroup', 'Button']);
    });

    it('passes unknown name arguments through so the caller can report the miss', async () => {
      const { resolveComponents } =
        await import('../../src/commands/update.js');
      const config = {
        framework: 'react' as const,
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const result = await resolveComponents(
        ['not-a-real-component'],
        config,
        testDir
      );

      expect(result).toEqual(['not-a-real-component']);
    });
  });
});

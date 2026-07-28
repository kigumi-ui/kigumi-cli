/**
 * Diff Command Tests
 *
 * Tests for src/commands/diff.ts
 *
 * Covers:
 * - No config → error handling
 * - No installed components → info message
 * - Unchanged files detection
 * - Changed files detection (template-changed)
 * - Missing files detection
 * - Summary counts
 * - PascalCase normalization
 * - Specific component filtering
 *
 * Cluster S: uses the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) for @clack/prompts and
 * output. PR-S4: switched residual factory mocks for template / registry /
 * diff-renderer to per-test `vi.spyOn` on dynamically-imported namespaces
 * (Pattern A: modules re-imported post-`vi.resetModules()`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { toKebabCase } from '../../src/utils/naming.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
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
    description: 'Buttons represent actions available to the user',
    dependencies: [],
    files: {},
    props: [],
  },
  dialog: {
    name: 'Dialog',
    tagName: 'wa-dialog',
    importPath: '@awesome.me/webawesome/dist/components/dialog/dialog.js',
    tier: 'free',
    category: 'Overlays',
    description: 'Dialogs display interactive content',
    dependencies: [],
    files: {},
    props: [],
  },
  card: {
    name: 'Card',
    tagName: 'wa-card',
    importPath: '@awesome.me/webawesome/dist/components/card/card.js',
    tier: 'free',
    category: 'Layout',
    description: 'Cards group related content',
    dependencies: [],
    files: {},
    props: [],
  },
  'button-group': {
    name: 'ButtonGroup',
    tagName: 'wa-button-group',
    importPath:
      '@awesome.me/webawesome/dist/components/button-group/button-group.js',
    tier: 'free',
    category: 'Actions',
    description: 'Groups related buttons together',
    dependencies: [],
    files: {},
    props: [],
  },
};

describe('diffCommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;
  let getComponentSpy: ReturnType<typeof vi.spyOn>;
  let renderDiffSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    // diff.ts does not invoke any prompts; an empty queue is appropriate.
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-diff-cmd-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    // Spies for the residual seams (template / registry / diff-renderer).
    // Modules dynamically imported AFTER vi.resetModules() so the spy wraps
    // the same instance the SUT will see on its own dynamic import. The
    // non-stubbed template helpers (getComponentExtension / getTestExtension
    // / getFileBaseName) keep their real behavior.
    const template = await import('../../src/utils/template.js');
    vi.spyOn(template, 'generateComponent').mockResolvedValue(
      '// generated component'
    );
    vi.spyOn(template, 'generateComponentCSSContent').mockResolvedValue(
      '/* generated css */'
    );
    vi.spyOn(template, 'generateComponentTestContent').mockResolvedValue(
      '// generated test'
    );

    const registry = await import('../../src/utils/registry.js');
    getComponentSpy = vi
      .spyOn(registry, 'getComponent')
      .mockImplementation(
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

  async function createConfig(
    overrides: Record<string, unknown> = {}
  ): Promise<void> {
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
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

  function infoMessages(): string[] {
    return output.calls
      .filter((c) => c.method === 'info')
      .map((c) => c.args[0])
      .filter((m): m is string => typeof m === 'string');
  }

  // ── Test 1: No config → calls handleError ──

  it('should call output.error when no config is found', async () => {
    // No config file in testDir
    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    expect(output.calls.some((c) => c.method === 'error')).toBe(true);
    expect(process.exit).toHaveBeenCalled();
  });

  // ── Test 2: No installed components → info message ──

  it('should report no installed components when componentsDir is empty', async () => {
    await createConfig();
    // Create the components dir but leave it empty
    await fs.ensureDir(path.join(testDir, 'src/components'));

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    expect(
      infoMessages().some((m) => m.includes('No installed components'))
    ).toBe(true);
  });

  it('should report no installed components when componentsDir does not exist', async () => {
    await createConfig();
    // Don't create componentsDir at all

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    expect(
      infoMessages().some((m) => m.includes('No installed components'))
    ).toBe(true);
  });

  // ── Test 3: Unchanged files → reports unchanged ──

  it('should report unchanged when installed files match generated content', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
      'Button.test.tsx': '// generated test',
    });

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    // Should report unchanged status via info calls
    const unchangedLines = infoMessages().filter((m) =>
      m.includes('unchanged')
    );
    expect(unchangedLines.length).toBeGreaterThanOrEqual(3);

    // Summary should say all up to date
    expect(output.calls).toContainEqual({
      method: 'success',
      args: [expect.stringContaining('up to date')],
    });
  });

  // ── Test 4: Changed files → reports template-changed ──

  it('should report template-changed when installed files differ from generated content', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// my custom component code',
      'Button.css': '/* my custom css */',
      'Button.test.tsx': '// my custom test',
    });

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    const changedLines = infoMessages().filter((m) =>
      m.includes('template changed')
    );
    expect(changedLines.length).toBeGreaterThanOrEqual(3);
  });

  // ── Test 5: Missing files → reports missing ──

  it('should report missing when component directory exists but files are absent', async () => {
    await createConfig();
    // Create component dir with no files
    await fs.ensureDir(path.join(testDir, 'src/components/Button'));

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    const missingLines = infoMessages().filter((m) => m.includes('not found'));
    expect(missingLines.length).toBeGreaterThanOrEqual(3);
  });

  // ── Test 6: Summary counts are correct ──

  it('should display correct summary counts for mixed statuses', async () => {
    await createConfig();

    // Button: unchanged (matches generated content)
    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
      'Button.test.tsx': '// generated test',
    });

    // Dialog: changed (different content)
    await installComponent('Dialog', {
      'Dialog.tsx': '// custom dialog code',
      'Dialog.css': '/* custom dialog css */',
      'Dialog.test.tsx': '// custom dialog test',
    });

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    // Should report 2 components checked
    const componentCountLine = infoMessages().find((m) =>
      m.includes('component(s) checked')
    );
    expect(componentCountLine).toBeDefined();
    expect(componentCountLine).toContain('2');

    // Should report template updates available (3 files from Dialog)
    const templateChangedLine = infoMessages().find((m) =>
      m.includes('template updates available')
    );
    expect(templateChangedLine).toBeDefined();
    expect(templateChangedLine).toContain('3');
  });

  // ── Test 7: PascalCase normalization ──

  it('should normalize lowercase component names to PascalCase', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
      'Button.test.tsx': '// generated test',
    });

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand(['button'], { cwd: testDir });

    // getComponent is called with the lowercase version
    expect(getComponentSpy).toHaveBeenCalledWith('button');

    // The result name should be PascalCase "Button" in output
    const buttonNameLine = infoMessages().find((m) => m.includes('Button'));
    expect(buttonNameLine).toBeDefined();
  });

  // ── Test 8: Specific component filtering ──

  it('should only check specified components when names are provided', async () => {
    await createConfig();

    // Install both Button and Dialog
    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
      'Button.test.tsx': '// generated test',
    });
    await installComponent('Dialog', {
      'Dialog.tsx': '// custom dialog',
      'Dialog.css': '/* custom dialog css */',
      'Dialog.test.tsx': '// custom dialog test',
    });

    const { diffCommand } = await import('../../src/commands/diff.js');
    // Only ask for Button
    await diffCommand(['Button'], { cwd: testDir });

    // Should report 1 component checked (only Button)
    const componentCountLine = infoMessages().find((m) =>
      m.includes('component(s) checked')
    );
    expect(componentCountLine).toBeDefined();
    expect(componentCountLine).toContain('1');

    // Should not mention Dialog in the component header lines
    const dialogLine = infoMessages().find((m) => m.includes('Dialog'));
    expect(dialogLine).toBeUndefined();
  });

  it('should skip non-builtin components when scanning directory', async () => {
    await createConfig();

    // Install a recognized component
    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
      'Button.test.tsx': '// generated test',
    });

    // Also create a directory for a custom (non-registry) component
    await fs.ensureDir(path.join(testDir, 'src/components/CustomWidget'));
    await fs.writeFile(
      path.join(testDir, 'src/components/CustomWidget/CustomWidget.tsx'),
      '// custom widget',
      'utf-8'
    );

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    // Should only check 1 component (Button), not CustomWidget
    const componentCountLine = infoMessages().find((m) =>
      m.includes('component(s) checked')
    );
    expect(componentCountLine).toBeDefined();
    expect(componentCountLine).toContain('1');
  });

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

  it('should call intro and outro', async () => {
    await createConfig();
    await fs.ensureDir(path.join(testDir, 'src/components'));

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    expect(output.calls).toContainEqual({
      method: 'intro',
      args: ['kigumi diff'],
    });
    expect(output.calls).toContainEqual({
      method: 'outro',
      args: ['Done'],
    });
  });

  // ── Test: diff always shows renderDiff for template-changed files ──

  it('should call renderDiff for template-changed files', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// my installed component',
      'Button.css': '/* generated css */',
      'Button.test.tsx': '// generated test',
    });
    await createSnapshot('Button', {
      'Button.tsx': '// my installed component',
      'Button.css': '/* generated css */',
      'Button.test.tsx': '// generated test',
    });

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand(['Button'], { cwd: testDir });

    expect(renderDiffSpy).toHaveBeenCalledWith(
      '// my installed component',
      '// generated component',
      'Button.tsx'
    );
  });

  // ── Test: diff does NOT call renderDiff for unchanged files ──

  it('should not call renderDiff for unchanged files', async () => {
    await createConfig();
    await installComponent('Button', {
      'Button.tsx': '// generated component',
      'Button.css': '/* generated css */',
      'Button.test.tsx': '// generated test',
    });

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand(['Button'], { cwd: testDir });

    expect(renderDiffSpy).not.toHaveBeenCalled();
  });

  describe('resolveComponents (multi-word regression)', () => {
    // Regression guard: previously the scan branch used name.toLowerCase()
    // to build registry keys, so ButtonGroup → buttongroup missed the
    // button-group key and was silently dropped. The names branch used
    // charAt(0).toUpperCase() which turned button-group into Button-group.
    it('recognizes PascalCase multi-word directories in the scan branch', async () => {
      const { resolveComponents } =
        await import('../../src/utils/installed-components.js');
      const componentsDir = path.join(testDir, 'src/components');
      await fs.ensureDir(path.join(componentsDir, 'Button'));
      await fs.ensureDir(path.join(componentsDir, 'ButtonGroup'));
      await fs.ensureDir(path.join(componentsDir, 'NotAComponent'));

      const config = {
        framework: 'react' as const,
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
        theme: {
          selected: 'awesome',
          palette: 'sky',
          brandColor: '#0ea5e9',
        },
      };

      const result = await resolveComponents([], config, testDir);

      expect(result.components).toEqual(['Button', 'ButtonGroup']);
    });

    it('canonicalizes kebab-case name arguments to PascalCase', async () => {
      const { resolveComponents } =
        await import('../../src/utils/installed-components.js');
      const config = {
        framework: 'react' as const,
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
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

      expect(result.components).toEqual(['ButtonGroup', 'Button']);
    });

    it('accepts PascalCase name arguments unchanged', async () => {
      const { resolveComponents } =
        await import('../../src/utils/installed-components.js');
      const config = {
        framework: 'react' as const,
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
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

      expect(result.components).toEqual(['ButtonGroup', 'Button']);
    });

    it('reports unknown name arguments as unmanaged so the caller can say so', async () => {
      const { resolveComponents } =
        await import('../../src/utils/installed-components.js');
      const config = {
        framework: 'react' as const,
        typescript: true,
        componentsDir: 'src/components',
        utilsDir: 'src/lib',
        stylesDir: 'src/styles',
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

      expect(result.components).toEqual([]);
      expect(result.unmanaged).toEqual([{ name: 'not-a-real-component' }]);
    });
  });
});

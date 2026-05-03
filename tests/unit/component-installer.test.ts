/**
 * ComponentInstaller Tests
 *
 * Tests for src/commands/add/installer.ts
 *
 * Covers:
 * - renderDiff called for modified files on --force
 * - renderDiff NOT called for unchanged files on --force
 * - Snapshot saved after a fresh install
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) instead of module-level
 * mocks for @clack/prompts and src/utils/tier.js. The diff-renderer,
 * template, and registry mocks stay since those modules have no DI seam
 * yet (Phase 2 candidates). Output is passed directly to the
 * ComponentInstaller constructor so it does not go through the
 * setOutputForTesting() seam.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createTestAddOptions } from './_helpers/add-options.js';
import { createTestKigumiConfig } from './_helpers/kigumi-config.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';

async function registerPromptsSeam(prompts: PromptsAdapter): Promise<void> {
  const promptsMod = await import('../../src/prompts/index.js');
  promptsMod.setPromptsForTesting(prompts);
}

async function clearPromptsSeam(): Promise<void> {
  const promptsMod = await import('../../src/prompts/index.js');
  promptsMod.resetPromptsForTesting();
}

// Mock diff renderer - spy only, real impl not needed for these tests
vi.mock('../../src/utils/diff-renderer.js', () => ({
  renderDiff: vi.fn().mockReturnValue('mocked diff output'),
}));

// Mock template generation with stable return values
vi.mock('../../src/utils/template.js', () => ({
  generateComponent: vi.fn().mockResolvedValue('// generated component'),
  generateComponentCSSContent: vi.fn().mockResolvedValue('/* generated css */'),
  generateComponentTestContent: vi.fn().mockResolvedValue('// generated test'),
  getComponentCSSPath: vi
    .fn()
    .mockImplementation(
      (
        comp: { name: string },
        config: { componentsDir: string },
        cwd: string
      ) => path.join(cwd, config.componentsDir, comp.name, `${comp.name}.css`)
    ),
  getComponentTestPath: vi
    .fn()
    .mockImplementation(
      (
        comp: { name: string },
        config: { componentsDir: string },
        cwd: string
      ) =>
        path.join(cwd, config.componentsDir, comp.name, `${comp.name}.test.tsx`)
    ),
  getComponentExtension: vi.fn().mockReturnValue('tsx'),
  getTestExtension: vi.fn().mockReturnValue('test.tsx'),
  getFileBaseName: vi
    .fn()
    .mockImplementation((_fw: string, name: string) => name),
  updateComponentIndex: vi.fn().mockResolvedValue(undefined),
}));

// Mock registry - return stub definitions keyed by lowercase name
vi.mock('../../src/utils/registry.js', () => {
  const defs: Record<string, unknown> = {
    button: {
      name: 'Button',
      tagName: 'wa-button',
      importPath: '@awesome.me/webawesome/dist/components/button/button.js',
      tier: 'free',
      category: 'Actions',
      description: 'Buttons',
      dependencies: [],
      files: { react: { component: 'Button.tsx', css: 'Button.css' } },
      props: [],
    },
    select: {
      name: 'Select',
      tagName: 'wa-select',
      importPath: '@awesome.me/webawesome/dist/components/select/select.js',
      tier: 'free',
      category: 'Form controls',
      description: 'Select',
      dependencies: ['option'],
      files: { react: { component: 'Select.tsx', css: 'Select.css' } },
      props: [],
    },
    option: {
      name: 'Option',
      tagName: 'wa-option',
      importPath: '@awesome.me/webawesome/dist/components/option/option.js',
      tier: 'free',
      category: 'Form controls',
      description: 'Option',
      dependencies: [],
      files: { react: { component: 'Option.tsx', css: 'Option.css' } },
      props: [],
    },
  };
  return {
    getComponent: vi.fn((name: string) => defs[name.toLowerCase()] ?? null),
  };
});

const BASE_CONFIG = createTestKigumiConfig({
  componentsDir: 'src/components',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
});

/**
 * Dynamically import `ComponentInstaller` (required because `beforeEach`
 * resets the module cache) and wire it up with a fresh recording output +
 * the default 'free' tier so each test starts from a clean baseline.
 */
async function createInstaller(testDir: string) {
  const { ComponentInstaller } =
    await import('../../src/commands/add/installer.js');
  const output = createRecordingOutput();
  return {
    installer: new ComponentInstaller(testDir, BASE_CONFIG, output, 'free'),
    output,
  };
}

function warnMessages(output: RecordingOutput): string[] {
  return output.calls
    .filter((c) => c.method === 'warn')
    .map((c) => c.args[0])
    .filter((arg): arg is string => typeof arg === 'string');
}

describe('ComponentInstaller', () => {
  let testDir: string;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    // Default prompts adapter: confirm:[true] mirrors the original
    // vi.fn().mockResolvedValue(true) so any path that reaches p.confirm
    // auto-accepts (matches the pre-cluster-S behaviour).
    await registerPromptsSeam(createTestPrompts({ confirm: [true] }));

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-installer-test-'))
    );

    // Write minimal kigumi.config.json
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), BASE_CONFIG);
  });

  afterEach(async () => {
    await clearPromptsSeam();
    await fs.remove(testDir);
  });

  // ── Test 1: renderDiff called for modified file, not for unchanged ──

  it('calls renderDiff for modified files but not for unchanged files on --force', async () => {
    const componentDir = path.join(testDir, 'src/components/Button');
    await fs.ensureDir(componentDir);

    // Button.tsx has user modifications - differs from '// generated component'
    await fs.writeFile(
      path.join(componentDir, 'Button.tsx'),
      '// modified by user',
      'utf-8'
    );
    // Button.css is unchanged - matches the mocked template output
    await fs.writeFile(
      path.join(componentDir, 'Button.css'),
      '/* generated css */',
      'utf-8'
    );

    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    const { installer } = await createInstaller(testDir);

    await installer.installComponents(
      ['Button'],
      createTestAddOptions({
        force: true,
        yes: true,
      })
    );

    // renderDiff must be called for the modified Button.tsx
    expect(renderDiff).toHaveBeenCalledWith(
      '// modified by user',
      '// generated component',
      'Button.tsx'
    );

    // renderDiff must NOT be called for the unchanged Button.css
    const calls = (renderDiff as ReturnType<typeof vi.fn>).mock.calls;
    const cssCall = calls.find((args: unknown[]) => args[2] === 'Button.css');
    expect(cssCall).toBeUndefined();
  });

  // ── Test 2: renderDiff NOT called when no modifications exist ──

  it('skips when all files are identical even with --force', async () => {
    const componentDir = path.join(testDir, 'src/components/Button');
    await fs.ensureDir(componentDir);

    // Both files match the mocked template output exactly
    await fs.writeFile(
      path.join(componentDir, 'Button.tsx'),
      '// generated component',
      'utf-8'
    );
    await fs.writeFile(
      path.join(componentDir, 'Button.css'),
      '/* generated css */',
      'utf-8'
    );

    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    const { installer } = await createInstaller(testDir);

    const results = await installer.installComponents(
      ['Button'],
      createTestAddOptions({
        force: true,
        yes: true,
      })
    );

    expect(renderDiff).not.toHaveBeenCalled();
    expect(results[0].skipped).toBe(true);
  });

  // ── Test 3: Snapshot saved after fresh install ──

  it('saves a snapshot containing component file content after a fresh install', async () => {
    // No pre-existing component files - this is a fresh install
    const { loadSnapshot } = await import('../../src/utils/snapshot.js');
    const { installer } = await createInstaller(testDir);

    await installer.installComponents(
      ['Button'],
      createTestAddOptions({ yes: true })
    );

    const snapshot = await loadSnapshot(testDir, 'Button');

    expect(snapshot).not.toBeNull();
    expect(snapshot!['Button.tsx']).toBe('// generated component');
  });

  // ── Test 4: User declines prompt -> file unchanged, snapshot unchanged ──

  it('preserves original file and shows diff when user declines prompt', async () => {
    const componentDir = path.join(testDir, 'src/components/Button');
    await fs.ensureDir(componentDir);

    await fs.writeFile(
      path.join(componentDir, 'Button.tsx'),
      '// user custom code',
      'utf-8'
    );
    await fs.writeFile(
      path.join(componentDir, 'Button.css'),
      '/* generated css */',
      'utf-8'
    );

    // Re-register prompts with confirm: [false] so the user declines.
    await registerPromptsSeam(createTestPrompts({ confirm: [false] }));

    const { renderDiff } = await import('../../src/utils/diff-renderer.js');
    const { installer } = await createInstaller(testDir);

    // No --force: smart-add shows diff + prompt
    const results = await installer.installComponents(
      ['Button'],
      createTestAddOptions()
    );

    // Skipped
    expect(results[0].skipped).toBe(true);

    // File unchanged
    const content = await fs.readFile(
      path.join(componentDir, 'Button.tsx'),
      'utf-8'
    );
    expect(content).toBe('// user custom code');

    // renderDiff was called BEFORE the prompt (diff shown to help user decide)
    expect(renderDiff).toHaveBeenCalledWith(
      '// user custom code',
      '// generated component',
      'Button.tsx'
    );
  });

  // ── F-020: Dependency warnings ─────────────────────────────────────────

  it('warns when a component has deps that are neither requested nor installed', async () => {
    const { installer, output } = await createInstaller(testDir);

    await installer.installComponents(
      ['select'],
      createTestAddOptions({ yes: true })
    );

    const depWarning = warnMessages(output).find(
      (msg) => msg.includes('depends on') && msg.includes('option')
    );
    expect(depWarning).toBeDefined();
    expect(depWarning).toContain('kigumi add option');
  });

  it('does not warn when a dep is requested in the same install', async () => {
    const { installer, output } = await createInstaller(testDir);

    await installer.installComponents(
      ['select', 'option'],
      createTestAddOptions({ yes: true })
    );

    expect(
      warnMessages(output).find((msg) => msg.includes('depends on'))
    ).toBeUndefined();
  });

  it('does not warn when the dep is already installed on disk', async () => {
    // Pre-create an Option directory to simulate a prior install
    await fs.ensureDir(path.join(testDir, 'src/components/Option'));

    const { installer, output } = await createInstaller(testDir);

    await installer.installComponents(
      ['select'],
      createTestAddOptions({ yes: true })
    );

    expect(
      warnMessages(output).find((msg) => msg.includes('depends on'))
    ).toBeUndefined();
  });

  it('does not warn when the parent component is already installed', async () => {
    // Simulate a re-run: Select has been installed previously
    await fs.ensureDir(path.join(testDir, 'src/components/Select'));

    const { installer, output } = await createInstaller(testDir);

    await installer.installComponents(
      ['select'],
      createTestAddOptions({ yes: true })
    );

    expect(
      warnMessages(output).find((msg) => msg.includes('depends on'))
    ).toBeUndefined();
  });

  it('does not warn for a component with no dependencies', async () => {
    const { installer, output } = await createInstaller(testDir);

    await installer.installComponents(
      ['Button'],
      createTestAddOptions({ yes: true })
    );

    expect(
      warnMessages(output).find((msg) => msg.includes('depends on'))
    ).toBeUndefined();
  });
});

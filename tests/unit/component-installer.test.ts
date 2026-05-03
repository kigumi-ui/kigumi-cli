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
 * Cluster S: uses the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) for @clack/prompts and tier.
 * Output is passed directly to the ComponentInstaller constructor so it
 * does not go through the setOutputForTesting() seam.
 *
 * PR-S4: switched diff-renderer / template / registry factory mocks to
 * per-test `vi.spyOn` on dynamically-imported namespaces (Pattern A:
 * modules re-imported post-`vi.resetModules()`).
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
import type { ComponentDefinition } from '../../src/utils/registry/types.js';

async function registerPromptsSeam(prompts: PromptsAdapter): Promise<void> {
  const promptsMod = await import('../../src/prompts/index.js');
  promptsMod.setPromptsForTesting(prompts);
}

async function clearPromptsSeam(): Promise<void> {
  const promptsMod = await import('../../src/prompts/index.js');
  promptsMod.resetPromptsForTesting();
}

const cannedRegistry: Record<string, ComponentDefinition> = {
  button: {
    name: 'Button',
    tagName: 'wa-button',
    importPath: '@awesome.me/webawesome/dist/components/button/button.js',
    tier: 'free',
    category: 'Actions',
    description: 'Buttons',
    dependencies: [],
    files: { react: ['Button.tsx', 'Button.css'] },
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
    files: { react: ['Select.tsx', 'Select.css'] },
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
    files: { react: ['Option.tsx', 'Option.css'] },
    props: [],
  },
};

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
  let renderDiffSpy: ReturnType<typeof vi.spyOn>;

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

    // Spies for the residual seams. Modules dynamically imported AFTER
    // vi.resetModules() so the spy wraps the same instance the SUT will
    // see on its own dynamic import. The real getComponentExtension /
    // getTestExtension / getFileBaseName implementations match what the
    // prior factory stub returned for the React framework.
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
    vi.spyOn(template, 'getComponentCSSPath').mockImplementation(
      (comp, config, cwd) =>
        path.join(cwd, config.componentsDir, comp.name, `${comp.name}.css`)
    );
    vi.spyOn(template, 'getComponentTestPath').mockImplementation(
      (comp, config, cwd) =>
        path.join(cwd, config.componentsDir, comp.name, `${comp.name}.test.tsx`)
    );
    vi.spyOn(template, 'updateComponentIndex').mockResolvedValue(undefined);

    const registry = await import('../../src/utils/registry.js');
    vi.spyOn(registry, 'getComponent').mockImplementation(
      (name: string) => cannedRegistry[name.toLowerCase()] ?? null
    );

    const diffRenderer = await import('../../src/utils/diff-renderer.js');
    renderDiffSpy = vi
      .spyOn(diffRenderer, 'renderDiff')
      .mockReturnValue('mocked diff output');
  });

  afterEach(async () => {
    await clearPromptsSeam();
    await fs.remove(testDir);
    vi.restoreAllMocks();
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

    const { installer } = await createInstaller(testDir);

    await installer.installComponents(
      ['Button'],
      createTestAddOptions({
        force: true,
        yes: true,
      })
    );

    // renderDiff must be called for the modified Button.tsx
    expect(renderDiffSpy).toHaveBeenCalledWith(
      '// modified by user',
      '// generated component',
      'Button.tsx'
    );

    // renderDiff must NOT be called for the unchanged Button.css
    const cssCall = renderDiffSpy.mock.calls.find(
      (args: unknown[]) => args[2] === 'Button.css'
    );
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

    const { installer } = await createInstaller(testDir);

    const results = await installer.installComponents(
      ['Button'],
      createTestAddOptions({
        force: true,
        yes: true,
      })
    );

    expect(renderDiffSpy).not.toHaveBeenCalled();
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
    expect(renderDiffSpy).toHaveBeenCalledWith(
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

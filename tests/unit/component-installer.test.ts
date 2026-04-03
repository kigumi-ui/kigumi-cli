/**
 * ComponentInstaller Tests
 *
 * Tests for src/commands/add/installer.ts
 *
 * Covers:
 * - renderDiff called for modified files on --force
 * - renderDiff NOT called for unchanged files on --force
 * - Snapshot saved after a fresh install
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  log: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
  isCancel: vi.fn().mockReturnValue(false),
}));

// Mock diff renderer — spy only, real impl not needed for these tests
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
  updateTypeDeclarations: vi.fn().mockResolvedValue(undefined),
  updateComponentIndex: vi.fn().mockResolvedValue(undefined),
}));

// Mock registry — return Button definition for any lookup
vi.mock('../../src/utils/registry.js', () => ({
  getComponent: vi.fn((name: string) => {
    if (name.toLowerCase() === 'button') {
      return {
        name: 'Button',
        tagName: 'wa-button',
        importPath: '@awesome.me/webawesome/dist/components/button/button.js',
        tier: 'free',
        category: 'Actions',
        description: 'Buttons',
        dependencies: [],
        files: { react: { component: 'Button.tsx', css: 'Button.css' } },
        props: [],
      };
    }
    return null;
  }),
}));

// Mock tier detection
vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn().mockResolvedValue('free'),
  detectTierSync: vi.fn().mockReturnValue('free'),
  getWebAwesomePackage: vi.fn().mockReturnValue('@awesome.me/webawesome'),
  getProToken: vi.fn().mockResolvedValue(null),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function createMockOutput() {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    note: vi.fn(),
    spinner: vi.fn().mockReturnValue({
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn(),
      error: vi.fn(),
    }),
    log: vi.fn(),
  };
}

const BASE_CONFIG = {
  $schema: 'https://kigumi.dev/schema/config.json',
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ComponentInstaller', () => {
  let testDir: string;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-installer-test-'))
    );

    // Write minimal kigumi.config.json
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), BASE_CONFIG);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  // ── Test 1: renderDiff called for modified file, not for unchanged ──

  it('calls renderDiff for modified files but not for unchanged files on --force', async () => {
    const componentDir = path.join(testDir, 'src/components/Button');
    await fs.ensureDir(componentDir);

    // Button.tsx has user modifications — differs from '// generated component'
    await fs.writeFile(
      path.join(componentDir, 'Button.tsx'),
      '// modified by user',
      'utf-8'
    );
    // Button.css is unchanged — matches the mocked template output
    await fs.writeFile(
      path.join(componentDir, 'Button.css'),
      '/* generated css */',
      'utf-8'
    );

    const { ComponentInstaller } =
      await import('../../src/commands/add/installer.js');
    const { renderDiff } = await import('../../src/utils/diff-renderer.js');

    const output = createMockOutput();
    const installer = new ComponentInstaller(testDir, BASE_CONFIG, output);

    await installer.installComponents(['Button'], {
      force: true,
      yes: true,
    });

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

    const { ComponentInstaller } =
      await import('../../src/commands/add/installer.js');
    const { renderDiff } = await import('../../src/utils/diff-renderer.js');

    const output = createMockOutput();
    const installer = new ComponentInstaller(testDir, BASE_CONFIG, output);

    const results = await installer.installComponents(['Button'], {
      force: true,
      yes: true,
    });

    expect(renderDiff).not.toHaveBeenCalled();
    expect(results[0].skipped).toBe(true);
  });

  // ── Test 3: Snapshot saved after fresh install ──

  it('saves a snapshot containing component file content after a fresh install', async () => {
    // No pre-existing component files — this is a fresh install
    const { ComponentInstaller } =
      await import('../../src/commands/add/installer.js');
    const { loadSnapshot } = await import('../../src/utils/snapshot.js');

    const output = createMockOutput();
    const installer = new ComponentInstaller(testDir, BASE_CONFIG, output);

    await installer.installComponents(['Button'], { yes: true });

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

    // Mock confirm to return false (user declines)
    const prompts = await import('@clack/prompts');
    vi.mocked(prompts.confirm).mockResolvedValueOnce(false);

    const { ComponentInstaller } =
      await import('../../src/commands/add/installer.js');
    const renderDiffModule = await import('../../src/utils/diff-renderer.js');
    const renderDiff = renderDiffModule.renderDiff;

    const output = createMockOutput();
    const installer = new ComponentInstaller(testDir, BASE_CONFIG, output);

    // No --force: smart-add shows diff + prompt
    const results = await installer.installComponents(['Button'], {});

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
});

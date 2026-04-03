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
  log: {
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
  isCancel: vi.fn().mockReturnValue(false),
}));

// Mock output
const mockOutput = {
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

vi.mock('../../src/output/index.js', () => ({
  getOutput: () => mockOutput,
  ConsoleOutput: vi.fn(),
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
vi.mock('../../src/utils/registry.js', () => ({
  getComponent: vi.fn((name: string) => {
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
      card: {
        name: 'Card',
        tagName: 'wa-card',
        importPath: '@awesome.me/webawesome/dist/components/card/card.js',
        tier: 'free',
        category: 'Layout',
        description: 'Cards group related content',
      },
    };
    return registry[name.toLowerCase()] ?? null;
  }),
}));

// Mock tier detection
vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn().mockResolvedValue('free'),
  detectTierSync: vi.fn().mockReturnValue('free'),
  getWebAwesomePackage: vi.fn().mockReturnValue('@awesome.me/webawesome'),
  getProToken: vi.fn().mockResolvedValue(null),
}));

describe('diffCommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-diff-cmd-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
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

  // ── Test 1: No config → calls handleError ──

  it('should call output.error when no config is found', async () => {
    // No config file in testDir
    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    expect(mockOutput.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalled();
  });

  // ── Test 2: No installed components → info message ──

  it('should report no installed components when componentsDir is empty', async () => {
    await createConfig();
    // Create the components dir but leave it empty
    await fs.ensureDir(path.join(testDir, 'src/components'));

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('No installed components')
    );
  });

  it('should report no installed components when componentsDir does not exist', async () => {
    await createConfig();
    // Don't create componentsDir at all

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('No installed components')
    );
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
    const infoCalls = mockOutput.info.mock.calls.map(
      (call: unknown[]) => call[0]
    );
    const unchangedLines = infoCalls.filter(
      (msg: string) => typeof msg === 'string' && msg.includes('unchanged')
    );
    expect(unchangedLines.length).toBeGreaterThanOrEqual(3);

    // Summary should say all up to date
    expect(mockOutput.success).toHaveBeenCalledWith(
      expect.stringContaining('up to date')
    );
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

    const infoCalls = mockOutput.info.mock.calls.map(
      (call: unknown[]) => call[0]
    );
    const changedLines = infoCalls.filter(
      (msg: string) =>
        typeof msg === 'string' && msg.includes('template changed')
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

    const infoCalls = mockOutput.info.mock.calls.map(
      (call: unknown[]) => call[0]
    );
    const missingLines = infoCalls.filter(
      (msg: string) => typeof msg === 'string' && msg.includes('not found')
    );
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

    const infoCalls = mockOutput.info.mock.calls.map(
      (call: unknown[]) => call[0]
    );

    // Should report 2 components checked
    const componentCountLine = infoCalls.find(
      (msg: string) =>
        typeof msg === 'string' && msg.includes('component(s) checked')
    );
    expect(componentCountLine).toBeDefined();
    expect(componentCountLine).toContain('2');

    // Should report template updates available (3 files from Dialog)
    const templateChangedLine = infoCalls.find(
      (msg: string) =>
        typeof msg === 'string' && msg.includes('template updates available')
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

    const { getComponent } = await import('../../src/utils/registry.js');
    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand(['button'], { cwd: testDir });

    // getComponent is called with the lowercase version
    expect(getComponent).toHaveBeenCalledWith('button');

    // The result name should be PascalCase "Button" in output
    const infoCalls = mockOutput.info.mock.calls.map(
      (call: unknown[]) => call[0]
    );
    const buttonNameLine = infoCalls.find(
      (msg: string) => typeof msg === 'string' && msg.includes('Button')
    );
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

    const infoCalls = mockOutput.info.mock.calls.map(
      (call: unknown[]) => call[0]
    );

    // Should report 1 component checked (only Button)
    const componentCountLine = infoCalls.find(
      (msg: string) =>
        typeof msg === 'string' && msg.includes('component(s) checked')
    );
    expect(componentCountLine).toBeDefined();
    expect(componentCountLine).toContain('1');

    // Should not mention Dialog in the component header lines
    const dialogLine = infoCalls.find(
      (msg: string) => typeof msg === 'string' && msg.includes('Dialog')
    );
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

    const infoCalls = mockOutput.info.mock.calls.map(
      (call: unknown[]) => call[0]
    );

    // Should only check 1 component (Button), not CustomWidget
    const componentCountLine = infoCalls.find(
      (msg: string) =>
        typeof msg === 'string' && msg.includes('component(s) checked')
    );
    expect(componentCountLine).toBeDefined();
    expect(componentCountLine).toContain('1');
  });

  it('should call intro and outro', async () => {
    await createConfig();
    await fs.ensureDir(path.join(testDir, 'src/components'));

    const { diffCommand } = await import('../../src/commands/diff.js');
    await diffCommand([], { cwd: testDir });

    expect(mockOutput.intro).toHaveBeenCalledWith('kigumi diff');
    expect(mockOutput.outro).toHaveBeenCalledWith('Done');
  });
});

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
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { saveSnapshot, loadSnapshot } from '../../src/utils/snapshot.js';

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

vi.mock('../../src/utils/diff-renderer.js', () => ({
  renderDiff: vi.fn().mockReturnValue('mocked diff output'),
}));

vi.mock('../../src/utils/template.js', () => ({
  generateComponent: vi.fn().mockResolvedValue('// generated component'),
  generateComponentCSSContent: vi.fn().mockResolvedValue('/* generated css */'),
  generateComponentTestContent: vi.fn().mockResolvedValue('// generated test'),
}));

vi.mock('../../src/utils/registry.js', () => ({
  getComponent: vi.fn((name: string) => {
    const registry: Record<string, unknown> = {
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
    return registry[name.toLowerCase()] ?? null;
  }),
}));

vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn().mockResolvedValue('free'),
  detectTierSync: vi.fn().mockReturnValue('free'),
  getWebAwesomePackage: vi.fn().mockReturnValue('@awesome.me/webawesome'),
  getProToken: vi.fn().mockResolvedValue(null),
}));

describe('diff roundtrip', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-diff-roundtrip-'))
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

    const infoCalls = mockOutput.info.mock.calls.map(
      (call: unknown[]) => call[0]
    );
    const upToDate = infoCalls.filter(
      (msg: string) => typeof msg === 'string' && msg.includes('up to date')
    );
    expect(upToDate.length).toBeGreaterThanOrEqual(1);
  });
});

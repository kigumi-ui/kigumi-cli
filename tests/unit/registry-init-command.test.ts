/**
 * Registry Init Command Tests
 *
 * Tests for src/commands/registry/init.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  multiselect: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  spinner: vi.fn().mockReturnValue({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  }),
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
}));

const mockSpinner = {
  start: vi.fn(),
  stop: vi.fn(),
  message: vi.fn(),
  error: vi.fn(),
};

const mockOutput = {
  intro: vi.fn(),
  outro: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  note: vi.fn(),
  spinner: vi.fn().mockReturnValue(mockSpinner),
  log: vi.fn(),
};

vi.mock('../../src/output/index.js', () => ({
  getOutput: () => mockOutput,
  ConsoleOutput: vi.fn(),
}));

describe('registryInitAction', () => {
  let testDir: string;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockOutput.spinner.mockReturnValue(mockSpinner);
    const p = await import('@clack/prompts');
    vi.mocked(p.isCancel).mockReturnValue(false);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-reg-init-'))
    );
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
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

    expect(mockOutput.warning).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    );
  });

  it('should show spinner during creation', async () => {
    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true });

    expect(mockOutput.spinner).toHaveBeenCalledWith(
      'Creating registry structure...'
    );
    expect(mockSpinner.stop).toHaveBeenCalledWith('Registry structure created');
  });

  it('should show next steps after creation', async () => {
    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir, yes: true });

    expect(mockOutput.note).toHaveBeenCalledWith(
      'Next steps',
      expect.stringContaining('Add components')
    );
  });

  it('should use interactive prompts when --yes is not set', async () => {
    const p = await import('@clack/prompts');
    vi.mocked(p.text)
      .mockResolvedValueOnce('my-reg') // name
      .mockResolvedValueOnce('A description') // description
      .mockResolvedValueOnce('Author'); // author
    vi.mocked(p.multiselect).mockResolvedValueOnce(['react', 'vue']);

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
    const p = await import('@clack/prompts');
    vi.mocked(p.isCancel).mockReturnValue(true);
    vi.mocked(p.text).mockResolvedValueOnce(Symbol('cancel'));

    const { registryInitAction } =
      await import('../../src/commands/registry/init.js');

    await registryInitAction({ cwd: testDir });

    // Should not create registry.json
    expect(await fs.pathExists(path.join(testDir, 'registry.json'))).toBe(
      false
    );
  });
});

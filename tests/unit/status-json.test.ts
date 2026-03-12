/**
 * Status Command --json Output Tests
 *
 * Verifies JSON output structure for CI/CD consumption.
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

// Mock tier detection
vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn().mockResolvedValue('free'),
}));

function createConfig(overrides: Record<string, unknown> = {}) {
  return {
    framework: 'react',
    typescript: true,
    componentsDir: 'src/components/ui',
    utilsDir: 'src/lib',
    theme: {
      selected: 'default',
      palette: 'default',
      brandColor: 'blue',
    },
    ...overrides,
  };
}

describe('statusCommand --json', () => {
  let testDir: string;
  let originalExit: typeof process.exit;
  let stdoutWrite: ReturnType<typeof vi.fn>;
  let originalStdoutWrite: typeof process.stdout.write;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockOutput.spinner.mockReturnValue(mockSpinner);

    const tier = await import('../../src/utils/tier.js');
    vi.mocked(tier.detectTier).mockResolvedValue('free');

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-status-json-'))
    );
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    // Capture stdout.write
    stdoutWrite = vi.fn().mockReturnValue(true);
    originalStdoutWrite = process.stdout.write;
    process.stdout.write =
      stdoutWrite as unknown as typeof process.stdout.write;
  });

  afterEach(async () => {
    process.exit = originalExit;
    process.stdout.write = originalStdoutWrite;
    await fs.remove(testDir);
  });

  it('should output valid JSON with all required fields', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig()
    );

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand({ cwd: testDir, json: true });

    expect(stdoutWrite).toHaveBeenCalledTimes(1);
    const output = stdoutWrite.mock.calls[0][0];
    const data = JSON.parse(output);

    // Verify all required fields exist
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('tier', 'free');
    expect(data).toHaveProperty('framework', 'react');
    expect(data).toHaveProperty('typescript', true);
    expect(data).toHaveProperty('componentsDir', 'src/components/ui');
    expect(data).toHaveProperty('theme');
    expect(data.theme).toEqual({
      selected: 'default',
      palette: 'default',
      brandColor: 'blue',
    });
    expect(data).toHaveProperty('token', false);
    expect(data).toHaveProperty('package');
    expect(data).toHaveProperty('components');
    expect(data).toHaveProperty('warnings');
    expect(Array.isArray(data.components)).toBe(true);
    expect(Array.isArray(data.warnings)).toBe(true);
  });

  it('should not call any output methods in JSON mode', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig()
    );

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand({ cwd: testDir, json: true });

    // intro is called before the json check, but no other styled output
    expect(mockOutput.outro).not.toHaveBeenCalled();
    expect(mockOutput.note).not.toHaveBeenCalled();
    expect(mockOutput.warning).not.toHaveBeenCalled();
  });

  it('should include installed components in JSON', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig()
    );
    // Create fake installed components
    await fs.ensureDir(path.join(testDir, 'src/components/ui/button'));
    await fs.ensureDir(path.join(testDir, 'src/components/ui/dialog'));

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand({ cwd: testDir, json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    expect(data.components).toEqual(['button', 'dialog']);
  });

  it('should detect package info in JSON', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig()
    );
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        '@awesome.me/webawesome': '^3.0.0',
      },
    });

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand({ cwd: testDir, json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    expect(data.package).toEqual({
      package: '@awesome.me/webawesome',
      version: '^3.0.0',
    });
  });

  it('should include tier mismatch warnings in JSON', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig()
    );
    // Free tier but Pro package installed
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        '@awesome.me/webawesome-pro': '^3.0.0',
      },
    });

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand({ cwd: testDir, json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    expect(data.warnings).toHaveLength(1);
    expect(data.warnings[0]).toContain('Pro package installed');
  });

  it('should reflect pro tier in JSON', async () => {
    const tier = await import('../../src/utils/tier.js');
    vi.mocked(tier.detectTier).mockResolvedValue('pro');

    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig()
    );

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand({ cwd: testDir, json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    expect(data.tier).toBe('pro');
  });

  it('should output parseable JSON (pipe-safe)', async () => {
    await fs.writeJSON(
      path.join(testDir, 'kigumi.config.json'),
      createConfig()
    );

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand({ cwd: testDir, json: true });

    const raw = stdoutWrite.mock.calls[0][0];
    // Must end with newline for pipe compatibility
    expect(raw.endsWith('\n')).toBe(true);
    // Must be valid JSON
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});

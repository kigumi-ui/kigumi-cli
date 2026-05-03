/**
 * Status Command --json Output Tests
 *
 * Verifies JSON output structure for CI/CD consumption.
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts / writeTierFixture) instead
 * of module-level mocks for @clack/prompts, src/output/index.js, and
 * src/utils/tier.js. Tier detection now reads a real package.json fixture
 * via writeTierFixture.
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
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-status-json-'))
    );
    // Default fixture: free tier (matches the original tier mock default).
    // Tests that need pro overwrite the fixture or write their own
    // package.json (test 4 / test 5 / test 6).
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    // Capture stdout.write
    stdoutWrite = vi.fn().mockReturnValue(true);
    originalStdoutWrite = process.stdout.write;
    process.stdout.write =
      stdoutWrite as unknown as typeof process.stdout.write;
  });

  afterEach(async () => {
    await clearTestSeams();
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
    const raw = stdoutWrite.mock.calls[0][0];
    const data = JSON.parse(raw);

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
    expect(output.calls.some((c) => c.method === 'outro')).toBe(false);
    expect(output.calls.some((c) => c.method === 'note')).toBe(false);
    expect(output.calls.some((c) => c.method === 'warning')).toBe(false);
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
    // Overwrite the fixture's package.json with an explicit version.
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
    // Pro package in dependencies makes getPackageInfo return the pro pkg,
    // but the warning fires only when detectTier returns 'free' alongside
    // it - a synthetic state since both functions read the same
    // package.json key. Spy on the production tier module to pin tier
    // detection to 'free' for this test (same effect as the original
    // module-level mock pinning detectTier, but scoped to one test path).
    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        '@awesome.me/webawesome-pro': '^3.0.0',
      },
    });
    const tierMod = await import('../../src/utils/tier.js');
    const tierSpy = vi.spyOn(tierMod, 'detectTier').mockResolvedValue('free');

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand({ cwd: testDir, json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    expect(data.warnings).toHaveLength(1);
    expect(data.warnings[0]).toContain('Pro package installed');
    tierSpy.mockRestore();
  });

  it('should reflect pro tier in JSON', async () => {
    // Overwrite the fixture with a pro package.json so detectTier returns 'pro'.
    await writeTierFixture(testDir, 'pro');

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

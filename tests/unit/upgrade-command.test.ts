/**
 * Upgrade Command Tests
 *
 * Tests for src/commands/upgrade.ts (upgradeCommand)
 *
 * Scenarios:
 * - No config → error (handleError / process.exit)
 * - No kigumiVersion + --yes → pins current CLI version
 * - No kigumiVersion + --dry-run → shows what would happen, does NOT write
 * - Same version → "already up to date"
 * - Version mismatch → shows comparison
 * - --dry-run does not mutate config (version mismatch)
 * - Breaking changes are shown when present
 *
 * Cluster S: uses the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts / writeTierFixture) for
 * @clack/prompts, output, and tier. PR-S4: switched version-map / installer
 * / detect-framework to per-test `vi.spyOn` on dynamically-imported
 * namespaces; constants retains its module-level mock because `CLI_VERSION`
 * is a `const` re-export and `vi.spyOn` cannot replace a `const` value.
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
import type { VersionEntry } from '../../src/utils/version-map.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

// CLI_VERSION is a `const` re-export; `vi.spyOn` cannot replace a `const`
// value, so this module-level factory mock stays.
vi.mock('../../src/constants.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/constants.js')>();
  return { ...actual, CLI_VERSION: '0.13.0' };
});

const cannedVersions: Record<string, VersionEntry> = {
  '0.12.0': {
    kigumiVersion: '0.12.0',
    webAwesomeVersion: '^3.3.1',
    releasedAt: '2026-03-01',
    breakingChanges: [],
  },
  '0.10.0': {
    kigumiVersion: '0.10.0',
    webAwesomeVersion: '^3.2.1',
    releasedAt: '2026-02-01',
    breakingChanges: [],
  },
  '0.13.0': {
    kigumiVersion: '0.13.0',
    webAwesomeVersion: '^3.4.0',
    releasedAt: '2026-03-15',
    breakingChanges: [],
  },
};

const baseConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
};

describe('upgrade command', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;
  let getVersionEntrySpy: ReturnType<typeof vi.spyOn>;
  let getBreakingChangesSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    // All current tests use yes: true so the confirm path is never hit;
    // an empty queue with the helper's fail-loud "Unexpected prompt" error
    // is appropriate here.
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-upgrade-cmd-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    // Spies for the residual seams. Modules dynamically imported AFTER
    // vi.resetModules() so the spy wraps the same instance the SUT will
    // see on its own dynamic import.
    const versionMap = await import('../../src/utils/version-map.js');
    getVersionEntrySpy = vi
      .spyOn(versionMap, 'getVersionEntry')
      .mockImplementation((v: string) => cannedVersions[v]);
    getBreakingChangesSpy = vi
      .spyOn(versionMap, 'getBreakingChangesBetween')
      .mockReturnValue([]);
    vi.spyOn(versionMap, 'getVersionsBetween').mockReturnValue([]);

    const installer = await import('../../src/commands/init/installer.js');
    vi.spyOn(installer, 'installDependencies').mockResolvedValue(undefined);

    const detectFramework = await import('../../src/utils/detect-framework.js');
    vi.spyOn(detectFramework, 'getProjectInfo').mockResolvedValue({
      framework: 'react',
      typescript: true,
      packageManager: 'pnpm',
      isNext: false,
      hasVite: true,
      sourceLayout: 'src',
    });
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
    const config = { ...baseConfig, ...overrides };
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
  }

  it('should error when no config file exists', async () => {
    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir });

    expect(process.exit).toHaveBeenCalled();
  });

  it('should pin current version when no kigumiVersion and --yes', async () => {
    await createConfig();

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir, yes: true });

    const savedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(savedConfig.kigumiVersion).toBe('0.13.0');
    expect(output.calls).toContainEqual({
      method: 'success',
      args: [expect.stringContaining('0.13.0')],
    });
  });

  it('should show what would happen with --dry-run when no kigumiVersion', async () => {
    await createConfig();

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir, dryRun: true });

    // Should inform about the dry run
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('Dry run')],
    });
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('0.13.0')],
    });

    // Config should NOT be written with kigumiVersion
    const savedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(savedConfig.kigumiVersion).toBeUndefined();
  });

  it('should report already up to date when same version', async () => {
    await createConfig({ kigumiVersion: '0.13.0' });

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir });

    expect(output.calls).toContainEqual({
      method: 'success',
      args: [expect.stringContaining('Already up to date')],
    });
  });

  it('should show version comparison on version mismatch', async () => {
    await createConfig({ kigumiVersion: '0.10.0' });

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir, yes: true });

    // Should display both project and CLI versions
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('0.10.0')],
    });
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('0.13.0')],
    });
  });

  it('should not mutate config with --dry-run on version mismatch', async () => {
    await createConfig({ kigumiVersion: '0.10.0' });

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir, dryRun: true });

    // Config should remain unchanged
    const savedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(savedConfig.kigumiVersion).toBe('0.10.0');

    // Should indicate dry run
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('Dry run')],
    });
  });

  it('should show breaking changes when present', async () => {
    await createConfig({ kigumiVersion: '0.10.0' });

    getBreakingChangesSpy.mockReturnValue([
      {
        description: 'Button API changed',
        affectedComponents: ['Button', 'IconButton'],
        migrationGuide: 'Update Button props from foo to bar',
      },
      {
        description: 'Card slot renamed',
        affectedComponents: ['Card'],
        migrationGuide: 'Rename header slot to card-header',
      },
    ]);

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir, yes: true });

    // Should show breaking changes header
    expect(output.calls).toContainEqual({
      method: 'warning',
      args: [expect.stringContaining('Breaking changes')],
    });

    // Should show individual breaking change descriptions
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('Button API changed')],
    });
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('Card slot renamed')],
    });

    // Should show affected components
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('Button')],
    });
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('Card')],
    });

    // Should show migration guide
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('Update Button props from foo to bar')],
    });
    expect(output.calls).toContainEqual({
      method: 'info',
      args: [expect.stringContaining('Rename header slot to card-header')],
    });
  });

  it('should install dependencies when WA version changed', async () => {
    await createConfig({ kigumiVersion: '0.10.0' });

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await upgradeCommand({ cwd: testDir, yes: true });

    // WA version changes from ^3.2.1 to ^3.4.0, so install should be called
    expect(installDependencies).toHaveBeenCalledWith(
      expect.objectContaining({
        cwd: testDir,
        tier: 'free',
        packageManager: 'pnpm',
      })
    );
  });

  it('should skip install when --no-install is passed', async () => {
    await createConfig({ kigumiVersion: '0.10.0' });

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await upgradeCommand({ cwd: testDir, yes: true, install: false });

    expect(installDependencies).not.toHaveBeenCalled();

    // Config should still be updated
    const savedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(savedConfig.kigumiVersion).toBe('0.13.0');
  });

  it('should not install when WA version unchanged', async () => {
    await createConfig({ kigumiVersion: '0.12.0' });

    // Override default lookup so 0.12.0 and 0.13.0 both report the same
    // WA version (no install required).
    getVersionEntrySpy.mockImplementation((v: string) => {
      if (v === '0.12.0')
        return {
          kigumiVersion: '0.12.0',
          webAwesomeVersion: '^3.4.0',
          releasedAt: '2026-03-01',
          breakingChanges: [],
        };
      if (v === '0.13.0')
        return {
          kigumiVersion: '0.13.0',
          webAwesomeVersion: '^3.4.0',
          releasedAt: '2026-03-15',
          breakingChanges: [],
        };
      return undefined;
    });

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await upgradeCommand({ cwd: testDir, yes: true });

    // Same WA version, no install needed
    expect(installDependencies).not.toHaveBeenCalled();
  });
});

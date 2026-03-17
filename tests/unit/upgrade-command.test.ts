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
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(true),
  isCancel: vi.fn().mockReturnValue(false),
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

// Mock output
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

// Mock version-map
vi.mock('../../src/utils/version-map.js', () => ({
  getVersionEntry: vi.fn((v: string) => {
    if (v === '0.12.0')
      return {
        kigumiVersion: '0.12.0',
        webAwesomeVersion: '^3.3.1',
        releasedAt: '2026-03-01',
        breakingChanges: [],
      };
    if (v === '0.10.0')
      return {
        kigumiVersion: '0.10.0',
        webAwesomeVersion: '^3.2.1',
        releasedAt: '2026-02-01',
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
  }),
  getBreakingChangesBetween: vi.fn().mockReturnValue([]),
  getVersionsBetween: vi.fn().mockReturnValue([]),
}));

// Mock CLI_VERSION constant
vi.mock('../../src/constants.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/constants.js')>();
  return { ...actual, CLI_VERSION: '0.13.0' };
});

// Mock tier detection
vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn().mockResolvedValue('free'),
  detectTierSync: vi.fn().mockReturnValue('free'),
  getWebAwesomePackage: vi.fn().mockReturnValue('@awesome.me/webawesome'),
  getProToken: vi.fn().mockResolvedValue(null),
}));

// Mock dependency installer
vi.mock('../../src/commands/init/installer.js', () => ({
  installDependencies: vi.fn().mockResolvedValue(undefined),
}));

// Mock framework detection
vi.mock('../../src/utils/detect-framework.js', () => ({
  getProjectInfo: vi.fn().mockResolvedValue({
    framework: 'react',
    typescript: true,
    packageManager: 'pnpm',
    monorepo: false,
  }),
}));

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

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockOutput.spinner.mockReturnValue(mockSpinner);

    const p = await import('@clack/prompts');
    vi.mocked(p.isCancel).mockReturnValue(false);
    vi.mocked(p.confirm).mockResolvedValue(true);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-upgrade-cmd-'))
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
    expect(mockOutput.success).toHaveBeenCalledWith(
      expect.stringContaining('0.13.0')
    );
  });

  it('should show what would happen with --dry-run when no kigumiVersion', async () => {
    await createConfig();

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir, dryRun: true });

    // Should inform about the dry run
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Dry run')
    );
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('0.13.0')
    );

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

    expect(mockOutput.success).toHaveBeenCalledWith(
      expect.stringContaining('Already up to date')
    );
  });

  it('should show version comparison on version mismatch', async () => {
    await createConfig({ kigumiVersion: '0.10.0' });

    const { upgradeCommand } = await import('../../src/commands/upgrade.js');
    await upgradeCommand({ cwd: testDir, yes: true });

    // Should display both project and CLI versions
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('0.10.0')
    );
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('0.13.0')
    );
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
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Dry run')
    );
  });

  it('should show breaking changes when present', async () => {
    await createConfig({ kigumiVersion: '0.10.0' });

    const versionMap = await import('../../src/utils/version-map.js');
    vi.mocked(versionMap.getBreakingChangesBetween).mockReturnValue([
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
    expect(mockOutput.warning).toHaveBeenCalledWith(
      expect.stringContaining('Breaking changes')
    );

    // Should show individual breaking change descriptions
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Button API changed')
    );
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Card slot renamed')
    );

    // Should show affected components
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Button')
    );
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Card')
    );

    // Should show migration guide
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Update Button props from foo to bar')
    );
    expect(mockOutput.info).toHaveBeenCalledWith(
      expect.stringContaining('Rename header slot to card-header')
    );
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

    // 0.12.0 and 0.13.0 both use same mock return, but let's set them to same WA version
    const versionMap = await import('../../src/utils/version-map.js');
    vi.mocked(versionMap.getVersionEntry).mockImplementation((v: string) => {
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

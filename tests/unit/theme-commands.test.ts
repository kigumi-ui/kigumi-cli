/**
 * Theme Commands Tests
 *
 * Covers:
 * - src/commands/theme.ts (parent command + default set action)
 * - src/commands/theme/set.ts (set subcommand)
 * - src/commands/theme/show.ts (show subcommand)
 * - src/commands/theme/list.ts (list subcommand)
 * - src/commands/theme/install.ts (install subcommand)
 *
 * Cluster S: rewritten from a 7-factory-mock setup to
 * helpers + DI hooks + per-test vi.spyOn for residual seams. All
 * pre-cluster-S assertions are preserved or strengthened.
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

describe('theme command (parent + default set)', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;
  let regenerateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({ select: ['awesome'] });
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-theme-cmd-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    const regenerate = await import('../../src/utils/regenerate.js');
    regenerateSpy = vi
      .spyOn(regenerate, 'regenerateKigumiSetup')
      .mockResolvedValue({ layersPreserved: false });
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
    const config = {
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
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
  }

  describe('themeCommand structure', () => {
    it('should export a Command named "theme"', async () => {
      const { themeCommand } = await import('../../src/commands/theme.js');
      expect(themeCommand.name()).toBe('theme');
    });

    it('should have "set" as a subcommand', async () => {
      const { themeCommand } = await import('../../src/commands/theme.js');
      const subCommands = themeCommand.commands.map((c) => c.name());
      expect(subCommands).toContain('set');
    });

    it('should have "install" as a subcommand', async () => {
      const { themeCommand } = await import('../../src/commands/theme.js');
      const subCommands = themeCommand.commands.map((c) => c.name());
      expect(subCommands).toContain('install');
    });

    it('should have "list" as a subcommand', async () => {
      const { themeCommand } = await import('../../src/commands/theme.js');
      const subCommands = themeCommand.commands.map((c) => c.name());
      expect(subCommands).toContain('list');
    });

    it('should have "show" as a subcommand', async () => {
      const { themeCommand } = await import('../../src/commands/theme.js');
      const subCommands = themeCommand.commands.map((c) => c.name());
      expect(subCommands).toContain('show');
    });
  });

  describe('default set action (via themeCommand)', () => {
    it('should update theme when valid name is provided', async () => {
      await createConfig();

      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set', 'awesome']);

      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.selected).toBe('awesome');
    });

    it('should accept all free themes', async () => {
      const freeThemes = ['default', 'awesome', 'shoelace'];

      for (const theme of freeThemes) {
        await createConfig();
        const { themeCommand } = await import('../../src/commands/theme.js');
        await themeCommand.parseAsync(['node', 'theme', 'set', theme]);

        const savedConfig = await fs.readJSON(
          path.join(testDir, 'kigumi.config.json')
        );
        expect(savedConfig.theme.selected).toBe(theme);
      }
    });

    it('should accept "none" theme', async () => {
      await createConfig();

      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set', 'none']);

      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.selected).toBe('none');
    });

    it('should reject pro theme on free tier', async () => {
      await createConfig();

      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set', 'brutalist']);

      expect(process.exit).toHaveBeenCalled();
    });

    it('should allow pro theme on pro tier', async () => {
      await createConfig();
      await writeTierFixture(testDir, 'pro');

      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set', 'brutalist']);

      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.selected).toBe('brutalist');
    });

    it('should call regenerateKigumiSetup after updating', async () => {
      await createConfig();

      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set', 'awesome']);

      expect(regenerateSpy).toHaveBeenCalledWith(
        testDir,
        expect.objectContaining({
          theme: expect.objectContaining({ selected: 'awesome' }),
        }),
        'src/lib'
      );
    });

    it('should preserve other theme settings when updating selected theme', async () => {
      await createConfig({
        theme: {
          selected: 'default',
          palette: 'bright',
          brandColor: 'purple',
        },
      });

      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set', 'shoelace']);

      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.selected).toBe('shoelace');
      expect(savedConfig.theme.palette).toBe('bright');
      expect(savedConfig.theme.brandColor).toBe('purple');
    });
  });

  describe('interactive mode', () => {
    it('should prompt for theme selection when no argument given', async () => {
      await createConfig();
      const selectSpy = vi.spyOn(prompts, 'select');

      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set']);

      expect(selectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a theme:',
        })
      );
    });

    it('should handle user cancellation', async () => {
      await createConfig();

      const cancelSymbol = Symbol('cancel');
      // Re-register prompts that return the cancel symbol from select() and
      // detect it via isCancel().
      const cancelPrompts = createTestPrompts({
        select: [cancelSymbol],
        cancelSymbol,
      });
      await registerTestSeams(output, cancelPrompts);

      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set']);

      expect(process.exit).toHaveBeenCalled();
    });
  });

  describe('pre-flight checks', () => {
    it('should fail without config file', async () => {
      const { themeCommand } = await import('../../src/commands/theme.js');
      await themeCommand.parseAsync(['node', 'theme', 'set', 'awesome']);

      expect(process.exit).toHaveBeenCalled();
    });
  });
});

describe('theme/set subcommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;
  let regenerateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-theme-set-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    const regenerate = await import('../../src/utils/regenerate.js');
    regenerateSpy = vi
      .spyOn(regenerate, 'regenerateKigumiSetup')
      .mockResolvedValue({ layersPreserved: false });
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
    const config = {
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
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
  }

  it('should export a setCommand', async () => {
    const { setCommand } = await import('../../src/commands/theme/set.js');
    expect(setCommand.name()).toBe('set');
  });

  it('should update theme and save config', async () => {
    await createConfig();

    const { setCommand } = await import('../../src/commands/theme/set.js');
    await setCommand.parseAsync(['node', 'set', 'awesome']);

    const savedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(savedConfig.theme.selected).toBe('awesome');
  });

  it('should reject pro theme on free tier with ProThemeRequiredError', async () => {
    await createConfig();

    const { setCommand } = await import('../../src/commands/theme/set.js');
    await setCommand.parseAsync(['node', 'set', 'tailspin']);

    expect(process.exit).toHaveBeenCalled();
  });

  it('should accept pro theme when tier is pro', async () => {
    await createConfig();
    await writeTierFixture(testDir, 'pro');

    const { setCommand } = await import('../../src/commands/theme/set.js');
    await setCommand.parseAsync(['node', 'set', 'tailspin']);

    const savedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(savedConfig.theme.selected).toBe('tailspin');
  });

  it('should call regenerateKigumiSetup', async () => {
    await createConfig();

    const { setCommand } = await import('../../src/commands/theme/set.js');
    await setCommand.parseAsync(['node', 'set', 'shoelace']);

    expect(regenerateSpy).toHaveBeenCalled();
  });

  it('should use default utilsDir when not set in config', async () => {
    await createConfig();

    // Remove utilsDir from config to trigger the fallback
    const configPath = path.join(testDir, 'kigumi.config.json');
    const config = await fs.readJSON(configPath);
    delete config.utilsDir;
    await fs.writeJSON(configPath, config);

    const { setCommand } = await import('../../src/commands/theme/set.js');
    await setCommand.parseAsync(['node', 'set', 'default']);

    expect(regenerateSpy).toHaveBeenCalledWith(
      testDir,
      expect.objectContaining({
        theme: expect.objectContaining({ selected: 'default' }),
      }),
      'src/lib'
    );
  });

  it('should fail without config file', async () => {
    const { setCommand } = await import('../../src/commands/theme/set.js');
    await setCommand.parseAsync(['node', 'set', 'awesome']);

    expect(process.exit).toHaveBeenCalled();
  });
});

describe('theme/show subcommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-theme-show-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
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
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      theme: {
        selected: 'awesome',
        palette: 'bright',
        brandColor: 'purple',
      },
      ...overrides,
    };
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
  }

  it('should export a showCommand', async () => {
    const { showCommand } = await import('../../src/commands/theme/show.js');
    expect(showCommand.name()).toBe('show');
  });

  it('should display current theme configuration', async () => {
    await createConfig();

    const { showCommand } = await import('../../src/commands/theme/show.js');
    await showCommand.parseAsync(['node', 'show']);

    expect(output.calls.some((c) => c.method === 'intro')).toBe(true);

    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Settings', expect.stringContaining('awesome')],
    });

    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['HTML Classes', expect.stringContaining('wa-theme-awesome')],
    });
  });

  it('should show tier information', async () => {
    await createConfig();

    const { showCommand } = await import('../../src/commands/theme/show.js');
    await showCommand.parseAsync(['node', 'show']);

    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Settings', expect.stringContaining('free')],
    });
  });

  it('should show theme import path for non-none themes', async () => {
    await createConfig({
      theme: { selected: 'awesome', palette: 'default', brandColor: 'blue' },
    });

    const { showCommand } = await import('../../src/commands/theme/show.js');
    await showCommand.parseAsync(['node', 'show']);

    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Theme Import', expect.stringContaining('themes/awesome.css')],
    });
  });

  it('should not show theme import for "none" theme', async () => {
    await createConfig({
      theme: { selected: 'none', palette: 'default', brandColor: 'blue' },
    });

    const { showCommand } = await import('../../src/commands/theme/show.js');
    await showCommand.parseAsync(['node', 'show']);

    const themeImportCalls = output.calls.filter(
      (c) => c.method === 'note' && c.args[0] === 'Theme Import'
    );
    expect(themeImportCalls).toHaveLength(0);
  });

  it('should fail without config file', async () => {
    const { showCommand } = await import('../../src/commands/theme/show.js');
    await showCommand.parseAsync(['node', 'show']);

    expect(process.exit).toHaveBeenCalled();
  });

  it('should show outro with help text', async () => {
    await createConfig();

    const { showCommand } = await import('../../src/commands/theme/show.js');
    await showCommand.parseAsync(['node', 'show']);

    expect(output.calls).toContainEqual({
      method: 'outro',
      args: [expect.stringContaining('kigumi theme set')],
    });
  });
});

describe('theme/list subcommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-theme-list-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    await clearTestSeams();
    process.chdir(originalCwd);
    process.exit = originalExit;
    await fs.remove(testDir);
    vi.restoreAllMocks();
  });

  async function createConfig(): Promise<void> {
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
    };
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
  }

  it('should export a listCommand', async () => {
    const { listCommand } = await import('../../src/commands/theme/list.js');
    expect(listCommand.name()).toBe('list');
  });

  it('should display available themes for free tier', async () => {
    await createConfig();

    const { listCommand } = await import('../../src/commands/theme/list.js');
    await listCommand.parseAsync(['node', 'list']);

    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Themes', expect.stringContaining('default')],
    });
    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Themes', expect.stringContaining('awesome')],
    });
  });

  it('should display available palettes', async () => {
    await createConfig();

    const { listCommand } = await import('../../src/commands/theme/list.js');
    await listCommand.parseAsync(['node', 'list']);

    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Color Palettes', expect.stringContaining('default')],
    });
  });

  it('should display available brand colors', async () => {
    await createConfig();

    const { listCommand } = await import('../../src/commands/theme/list.js');
    await listCommand.parseAsync(['node', 'list']);

    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Brand Colors', expect.stringContaining('blue')],
    });
    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Brand Colors', expect.stringContaining('purple')],
    });
  });

  it('should show pro themes section when tier is pro', async () => {
    await createConfig();
    await writeTierFixture(testDir, 'pro');

    const { listCommand } = await import('../../src/commands/theme/list.js');
    await listCommand.parseAsync(['node', 'list']);

    expect(output.calls).toContainEqual({
      method: 'note',
      args: ['Themes', expect.stringContaining('Pro')],
    });
  });

  it('should show outro with help text', async () => {
    await createConfig();

    const { listCommand } = await import('../../src/commands/theme/list.js');
    await listCommand.parseAsync(['node', 'list']);

    expect(output.calls).toContainEqual({
      method: 'outro',
      args: [expect.stringContaining('kigumi theme set')],
    });
  });
});

describe('theme/install subcommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;
  let fetchRegistrySpy: ReturnType<typeof vi.spyOn>;
  let fetchFileSpy: ReturnType<typeof vi.spyOn>;
  let regenerateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-theme-install-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    await fs.ensureDir(path.join(testDir, 'src/styles'));

    // Spies for the network/registry/regenerate seams. Tests can override
    // the resolved/rejected value via the same fetchRegistrySpy / fetchFileSpy
    // bindings.
    const ghFetcher = await import('../../src/utils/github-fetcher.js');
    vi.spyOn(ghFetcher, 'parseGitHubUrl').mockReturnValue({
      kind: 'github',
      url: 'https://github.com/test/registry',
      owner: 'test',
      repo: 'registry',
      branch: 'main',
    });
    vi.spyOn(ghFetcher, 'buildRawUrl').mockReturnValue(
      'https://raw.githubusercontent.com/test/registry/main/themes/x.css'
    );
    fetchRegistrySpy = vi.spyOn(ghFetcher, 'fetchRegistryJson');
    fetchFileSpy = vi.spyOn(ghFetcher, 'fetchFile');

    const ghToken = await import('../../src/utils/github-token.js');
    vi.spyOn(ghToken, 'getGitHubToken').mockResolvedValue(undefined);

    const regResolver = await import('../../src/utils/registry-resolver.js');
    vi.spyOn(regResolver, 'resolveRegistrySource').mockReturnValue(
      'https://github.com/test/registry'
    );

    const regenerate = await import('../../src/utils/regenerate.js');
    regenerateSpy = vi
      .spyOn(regenerate, 'regenerateKigumiSetup')
      .mockResolvedValue({ layersPreserved: false });
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
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
      ...overrides,
    };
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), config);
  }

  it('should export themeInstallAction function', async () => {
    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    expect(typeof themeInstallAction).toBe('function');
  });

  it('should install theme from registry', async () => {
    await createConfig();

    fetchRegistrySpy.mockResolvedValue({
      name: 'Test Registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {},
      themes: {
        'custom-dark': {
          name: 'Custom Dark',
          files: { css: 'themes/custom-dark.css' },
        },
      },
    });
    fetchFileSpy.mockResolvedValue(':root { --test: value; }');

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('custom-dark', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    const cssPath = path.join(
      testDir,
      'src/styles/community-themes/custom-dark.css'
    );
    expect(await fs.pathExists(cssPath)).toBe(true);
    const cssContent = await fs.readFile(cssPath, 'utf-8');
    expect(cssContent).toBe(':root { --test: value; }');

    const savedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(savedConfig.theme.selected).toBe('custom-dark');
    expect(savedConfig.installedThemes).toBeDefined();
    expect(savedConfig.installedThemes['custom-dark']).toEqual(
      expect.objectContaining({ source: 'community' })
    );
  });

  it('should install theme with variables file', async () => {
    await createConfig();

    fetchRegistrySpy.mockResolvedValue({
      name: 'Test Registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {},
      themes: {
        themed: {
          name: 'Themed',
          files: {
            css: 'themes/themed.css',
            variables: 'themes/themed-variables.css',
          },
        },
      },
    });
    fetchFileSpy
      .mockResolvedValueOnce(':root { color: red; }')
      .mockResolvedValueOnce(':root { --var: val; }');

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('themed', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    const cssPath = path.join(
      testDir,
      'src/styles/community-themes/themed.css'
    );
    expect(await fs.pathExists(cssPath)).toBe(true);

    const varsPath = path.join(
      testDir,
      'src/styles/community-themes/themed-variables.css'
    );
    expect(await fs.pathExists(varsPath)).toBe(true);
    const varsContent = await fs.readFile(varsPath, 'utf-8');
    expect(varsContent).toBe(':root { --var: val; }');
  });

  it('should fail when theme not found in registry', async () => {
    await createConfig();

    fetchRegistrySpy.mockResolvedValue({
      name: 'Test Registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {},
      themes: {},
    });

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('nonexistent', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    expect(process.exit).toHaveBeenCalled();
  });

  it('should fail when registry fetch fails', async () => {
    await createConfig();

    fetchRegistrySpy.mockRejectedValue(new Error('Network error'));

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('some-theme', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    expect(process.exit).toHaveBeenCalled();
  });

  it('should fail without config file', async () => {
    const configPath = path.join(testDir, 'kigumi.config.json');
    if (await fs.pathExists(configPath)) {
      await fs.remove(configPath);
    }

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('some-theme', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    expect(process.exit).toHaveBeenCalled();
  });

  it('should call regenerateKigumiSetup after install', async () => {
    await createConfig();

    fetchRegistrySpy.mockResolvedValue({
      name: 'Test Registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {},
      themes: {
        'my-theme': {
          name: 'My Theme',
          files: { css: 'themes/my-theme.css' },
        },
      },
    });
    fetchFileSpy.mockResolvedValue('body {}');

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('my-theme', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    expect(regenerateSpy).toHaveBeenCalled();
  });

  it('should store registry provenance in config', async () => {
    await createConfig();

    fetchRegistrySpy.mockResolvedValue({
      name: 'My Cool Registry',
      version: '2.0.0',
      frameworks: ['react'],
      components: {},
      themes: {
        neon: {
          name: 'Neon',
          files: { css: 'themes/neon.css' },
        },
      },
    });
    fetchFileSpy.mockResolvedValue('.neon {}');

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('neon', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    const savedConfig = await fs.readJSON(
      path.join(testDir, 'kigumi.config.json')
    );
    expect(savedConfig.installedThemes.neon).toEqual({
      source: 'community',
      registryUrl: 'https://github.com/test/registry',
      registryVersion: '2.0.0',
    });
  });

  it('should use custom stylesDir from config', async () => {
    await createConfig({ stylesDir: 'assets/css' });
    await fs.ensureDir(path.join(testDir, 'assets/css'));

    fetchRegistrySpy.mockResolvedValue({
      name: 'Test Registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {},
      themes: {
        custom: {
          name: 'Custom',
          files: { css: 'themes/custom.css' },
        },
      },
    });
    fetchFileSpy.mockResolvedValue('body {}');

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('custom', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    const cssPath = path.join(
      testDir,
      'assets/css/community-themes/custom.css'
    );
    expect(await fs.pathExists(cssPath)).toBe(true);
  });

  it('should show spinner messages during install', async () => {
    await createConfig();

    fetchRegistrySpy.mockResolvedValue({
      name: 'Test Registry',
      version: '1.0.0',
      frameworks: ['react'],
      components: {},
      themes: {
        demo: {
          name: 'Demo',
          files: { css: 'themes/demo.css' },
        },
      },
    });
    fetchFileSpy.mockResolvedValue('body {}');

    const { themeInstallAction } =
      await import('../../src/commands/theme/install.js');
    await themeInstallAction('demo', {
      from: 'https://github.com/test/registry',
      cwd: testDir,
    });

    expect(output.calls).toContainEqual({
      method: 'spinner',
      args: ['Fetching registry...'],
    });
    expect(output.calls).toContainEqual({
      method: 'spinner',
      args: ['Installing theme...'],
    });
  });
});

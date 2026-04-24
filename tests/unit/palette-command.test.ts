/**
 * Palette Command Tests
 *
 * Tests for src/commands/palette.ts - Color palette management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  select: vi.fn(),
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

// Mock regenerate
vi.mock('../../src/utils/regenerate.js', () => ({
  regenerateKigumiSetup: vi.fn().mockResolvedValue({ layersPreserved: false }),
}));

// Mock tier detection — palette command dynamically imports tier.js
vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn().mockResolvedValue('free'),
  detectTierSync: vi.fn().mockReturnValue('free'),
  getWebAwesomePackage: vi.fn().mockReturnValue('@awesome.me/webawesome'),
  getProToken: vi.fn().mockResolvedValue(null),
}));

describe('paletteCommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    mockOutput.spinner.mockReturnValue(mockSpinner);
    const p = await import('@clack/prompts');
    vi.mocked(p.isCancel).mockReturnValue(false);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-palette-test-'))
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

  describe('with palette argument', () => {
    it('should update palette when valid name is provided', async () => {
      await createConfig();

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'bright']);

      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.palette).toBe('bright');
    });

    it('should accept all free palettes on free tier', async () => {
      const freePalettes = ['default', 'bright', 'shoelace'];

      for (const palette of freePalettes) {
        await createConfig();
        vi.resetModules();
        vi.clearAllMocks();

        const { paletteCommand } =
          await import('../../src/commands/palette.js');
        await paletteCommand.parseAsync(['node', 'palette', palette]);

        const savedConfig = await fs.readJSON(
          path.join(testDir, 'kigumi.config.json')
        );
        expect(savedConfig.theme.palette).toBe(palette);
      }
    });

    it('should reject pro palettes on free tier', async () => {
      const proPalettes = [
        'rudimentary',
        'elegant',
        'mild',
        'natural',
        'anodized',
        'vogue',
      ];

      for (const palette of proPalettes) {
        await createConfig();
        vi.resetModules();
        vi.clearAllMocks();

        const { paletteCommand } =
          await import('../../src/commands/palette.js');
        await paletteCommand.parseAsync(['node', 'palette', palette]);

        expect(process.exit).toHaveBeenCalled();
        // The bug was that the CLI wrote the Pro palette to config anyway;
        // assert the config stayed on the createConfig() default.
        const savedConfig = await fs.readJSON(
          path.join(testDir, 'kigumi.config.json')
        );
        expect(savedConfig.theme.palette).toBe('default');
      }
    });

    it('should reject invalid palette name and call process.exit', async () => {
      await createConfig();

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync([
        'node',
        'palette',
        'nonexistent-palette',
      ]);

      expect(process.exit).toHaveBeenCalled();
    });

    it('should reject "custom" palette', async () => {
      await createConfig();

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'custom']);

      // 'custom' is filtered out of available palettes, so it should fail validation
      expect(process.exit).toHaveBeenCalled();
    });

    it('should call regenerateKigumiSetup after updating', async () => {
      await createConfig();

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');
      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'bright']);

      expect(regenerateKigumiSetup).toHaveBeenCalledWith(
        testDir,
        expect.objectContaining({
          theme: expect.objectContaining({ palette: 'bright' }),
        }),
        'src/lib'
      );
    });

    it('should use custom utilsDir from config', async () => {
      await createConfig({ utilsDir: 'lib/utils' });

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');
      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'shoelace']);

      expect(regenerateKigumiSetup).toHaveBeenCalledWith(
        testDir,
        expect.objectContaining({
          theme: expect.objectContaining({ palette: 'shoelace' }),
        }),
        'lib/utils'
      );
    });

    it('should preserve other theme settings when updating palette', async () => {
      await createConfig({
        theme: {
          selected: 'awesome',
          palette: 'default',
          brandColor: 'purple',
        },
      });

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'bright']);

      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.selected).toBe('awesome');
      expect(savedConfig.theme.palette).toBe('bright');
      expect(savedConfig.theme.brandColor).toBe('purple');
    });

    it('should accept pro palettes on pro tier', async () => {
      // detectTier is dynamically imported inside paletteAction, so import it
      // first to target the same module instance for the one-shot override.
      const { detectTier } = await import('../../src/utils/tier.js');
      vi.mocked(detectTier).mockResolvedValueOnce('pro');

      await createConfig();

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'elegant']);

      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.palette).toBe('elegant');
    });
  });

  describe('interactive mode', () => {
    it('should prompt for palette selection when no argument given', async () => {
      await createConfig();

      const p = await import('@clack/prompts');
      vi.mocked(p.select).mockResolvedValue('bright');

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette']);

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a color palette:',
        })
      );
    });

    it('should handle user cancellation', async () => {
      await createConfig();

      const p = await import('@clack/prompts');
      const cancelSymbol = Symbol('cancel');
      vi.mocked(p.select).mockResolvedValue(cancelSymbol);
      vi.mocked(p.isCancel).mockReturnValue(true);

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette']);

      expect(process.exit).toHaveBeenCalled();
    });
  });

  describe('pre-flight checks', () => {
    it('should fail without config file', async () => {
      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'bright']);

      expect(process.exit).toHaveBeenCalled();
    });

    // paletteCommand must call getConfig only; calling loadConfig directly is
    // redundant because getConfig() calls loadConfig() internally.
    //
    // Note on spy scope: vi.spyOn on a module namespace only intercepts
    // calls made through the namespace (from other modules via their named
    // imports). It does NOT see getConfig()'s same-file lexical call to
    // loadConfig(). That's exactly what we want: the spy is scoped to
    // external callers.
    it('should not call loadConfig directly from paletteCommand', async () => {
      await createConfig();

      const configModule = await import('../../src/utils/config.js');
      const loadSpy = vi.spyOn(configModule, 'loadConfig');
      const getSpy = vi.spyOn(configModule, 'getConfig');

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'bright']);

      expect(loadSpy).not.toHaveBeenCalled();
      expect(getSpy).toHaveBeenCalledTimes(1);

      loadSpy.mockRestore();
      getSpy.mockRestore();
    });
  });

  describe('spinner output', () => {
    it('should show spinner during update', async () => {
      await createConfig();

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'bright']);

      expect(mockOutput.spinner).toHaveBeenCalledWith('Updating palette...');
      expect(mockSpinner.stop).toHaveBeenCalledWith('Palette updated');
    });

    it('should show outro message after successful update', async () => {
      await createConfig();

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'shoelace']);

      expect(mockOutput.outro).toHaveBeenCalledWith(
        expect.stringContaining('shoelace')
      );
    });
  });

  describe('tier detection', () => {
    it('should detect tier and filter available palettes', async () => {
      await createConfig();

      const { detectTier } = await import('../../src/utils/tier.js');
      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'default']);

      expect(detectTier).toHaveBeenCalledWith(testDir);
    });
  });
});

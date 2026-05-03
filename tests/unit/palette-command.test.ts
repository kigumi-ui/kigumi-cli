/**
 * Palette Command Tests
 *
 * Tests for src/commands/palette.ts - Color palette management.
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts / writeTierFixture) instead
 * of module-level mocks for @clack/prompts, src/output/index.js, and
 * src/utils/tier.js. The regenerate mock stays since regenerate has no
 * DI seam yet.
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

// Keep regenerate mock: regenerate has no DI seam yet (Phase 2 candidate).
vi.mock('../../src/utils/regenerate.js', () => ({
  regenerateKigumiSetup: vi.fn().mockResolvedValue({ layersPreserved: false }),
}));

describe('paletteCommand', () => {
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
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-palette-test-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);
    // Default fixture: free tier (matches the original tier mock default).
    await writeTierFixture(testDir, 'free');

    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    await clearTestSeams();
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
        // Re-register seams + fixture after resetModules to bind to the
        // fresh module instance the SUT will pull in below.
        output = createRecordingOutput();
        prompts = createTestPrompts({});
        await registerTestSeams(output, prompts);
        await writeTierFixture(testDir, 'free');

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
        output = createRecordingOutput();
        prompts = createTestPrompts({});
        await registerTestSeams(output, prompts);
        await writeTierFixture(testDir, 'free');

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
      // Overwrite the default free fixture with a pro package.json so the
      // production detectTier returns 'pro' for this test only.
      await writeTierFixture(testDir, 'pro');
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

      const promptsMod = await import('../../src/prompts/index.js');
      const selectSpy = vi
        .spyOn(promptsMod, 'select')
        .mockResolvedValue('bright');

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette']);

      expect(selectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a color palette:',
        })
      );
      selectSpy.mockRestore();
    });

    it('should handle user cancellation', async () => {
      await createConfig();

      const cancelSymbol = Symbol('cancel');
      const cancelPrompts = createTestPrompts({
        select: [cancelSymbol],
        cancelSymbol,
      });
      await registerTestSeams(output, cancelPrompts);

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

      // Override the recording output's spinner so we can also capture stop()
      // calls; the default noop spinner discards them.
      const stopCalls: Array<string | undefined> = [];
      const baseSpinner = output.spinner;
      output.spinner = (m) => {
        baseSpinner(m);
        return {
          start: () => {},
          message: () => {},
          stop: (msg) => {
            stopCalls.push(msg);
          },
          error: () => {},
        };
      };
      await registerTestSeams(output, prompts);

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'bright']);

      expect(output.calls).toContainEqual({
        method: 'spinner',
        args: ['Updating palette...'],
      });
      expect(stopCalls).toContain('Palette updated');
    });

    it('should show outro message after successful update', async () => {
      await createConfig();

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'shoelace']);

      expect(output.calls).toContainEqual(
        expect.objectContaining({
          method: 'outro',
          args: expect.arrayContaining([expect.stringContaining('shoelace')]),
        })
      );
    });
  });

  describe('tier detection', () => {
    it('should detect tier and filter available palettes', async () => {
      await createConfig();

      // Spy on detectTier to assert call-shape, since the seam fixture
      // exercises the production fn but doesn't expose call history.
      const tierMod = await import('../../src/utils/tier.js');
      const tierSpy = vi.spyOn(tierMod, 'detectTier');

      const { paletteCommand } = await import('../../src/commands/palette.js');
      await paletteCommand.parseAsync(['node', 'palette', 'default']);

      expect(tierSpy).toHaveBeenCalledWith(testDir);
      tierSpy.mockRestore();
    });
  });
});

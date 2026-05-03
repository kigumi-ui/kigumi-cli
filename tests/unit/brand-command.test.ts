/**
 * Brand Command Tests
 *
 * Tests for src/commands/brand.ts - Brand color management.
 *
 * Cluster S: uses the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) for @clack/prompts and
 * output. PR-S4: switched the regenerate factory mock to per-test
 * `vi.spyOn` on a dynamically-imported namespace (Pattern A: regenerate
 * is re-imported post-`vi.resetModules()`).
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
import type { PromptsAdapter } from '../../src/prompts/types.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

describe('brandCommand', () => {
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
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-brand-test-'))
    );
    originalCwd = process.cwd();
    process.chdir(testDir);

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

  describe('with color argument', () => {
    it('should update brand color when valid color is provided', async () => {
      await createConfig();

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'purple']);

      // Verify config was saved with new brand color
      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.brandColor).toBe('purple');
    });

    it('should accept all valid brand colors', async () => {
      const validColors = [
        'blue',
        'purple',
        'green',
        'red',
        'orange',
        'yellow',
        'cyan',
        'indigo',
        'pink',
        'gray',
      ];

      for (const color of validColors) {
        await createConfig();
        vi.resetModules();
        vi.clearAllMocks();
        // Re-register seams + spy after resetModules to bind to the fresh
        // module instance the SUT will pull in below.
        output = createRecordingOutput();
        prompts = createTestPrompts({});
        await registerTestSeams(output, prompts);
        const regenerate = await import('../../src/utils/regenerate.js');
        regenerateSpy = vi
          .spyOn(regenerate, 'regenerateKigumiSetup')
          .mockResolvedValue({ layersPreserved: false });

        const { brandCommand } = await import('../../src/commands/brand.js');
        await brandCommand.parseAsync(['node', 'brand', color]);

        const savedConfig = await fs.readJSON(
          path.join(testDir, 'kigumi.config.json')
        );
        expect(savedConfig.theme.brandColor).toBe(color);
      }
    });

    it('should reject invalid brand color and call process.exit', async () => {
      await createConfig();

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'invalid-color']);

      expect(process.exit).toHaveBeenCalled();
    });

    it('should call regenerateKigumiSetup after updating', async () => {
      await createConfig();

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'green']);

      expect(regenerateSpy).toHaveBeenCalledWith(
        testDir,
        expect.objectContaining({
          theme: expect.objectContaining({ brandColor: 'green' }),
        }),
        'src/lib'
      );
    });

    it('should use custom utilsDir from config', async () => {
      await createConfig({ utilsDir: 'lib/utils' });

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'red']);

      expect(regenerateSpy).toHaveBeenCalledWith(
        testDir,
        expect.objectContaining({
          theme: expect.objectContaining({ brandColor: 'red' }),
        }),
        'lib/utils'
      );
    });

    it('should preserve other theme settings when updating brand color', async () => {
      await createConfig({
        theme: {
          selected: 'awesome',
          palette: 'bright',
          brandColor: 'blue',
        },
      });

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'pink']);

      const savedConfig = await fs.readJSON(
        path.join(testDir, 'kigumi.config.json')
      );
      expect(savedConfig.theme.selected).toBe('awesome');
      expect(savedConfig.theme.palette).toBe('bright');
      expect(savedConfig.theme.brandColor).toBe('pink');
    });
  });

  describe('interactive mode', () => {
    it('should prompt for color selection when no argument given', async () => {
      await createConfig();

      const promptsMod = await import('../../src/prompts/index.js');
      const selectSpy = vi
        .spyOn(promptsMod, 'select')
        .mockResolvedValue('cyan');

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand']);

      expect(selectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a brand color:',
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

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand']);

      // Should call process.exit (via handleError with UserCancelledError)
      expect(process.exit).toHaveBeenCalled();
    });
  });

  describe('pre-flight checks', () => {
    it('should fail without config file', async () => {
      // No config created
      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'blue']);

      expect(process.exit).toHaveBeenCalled();
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

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'orange']);

      expect(output.calls).toContainEqual({
        method: 'spinner',
        args: ['Updating brand color...'],
      });
      expect(stopCalls).toContain('Brand color updated');
    });

    it('should show outro message after successful update', async () => {
      await createConfig();

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'indigo']);

      expect(output.calls).toContainEqual(
        expect.objectContaining({
          method: 'outro',
          args: expect.arrayContaining([expect.stringContaining('indigo')]),
        })
      );
    });
  });
});

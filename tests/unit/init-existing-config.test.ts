/**
 * Init Existing Config Tests
 *
 * Tests for src/commands/init/existing-config.ts:
 * - handleExistingConfig() - Prompt user about an already-loaded kigumi config
 *
 * The caller is responsible for loading the config and only invoking
 * handleExistingConfig when a valid config was found. These tests therefore
 * pass a KigumiConfig object directly and focus on the prompt/output behavior.
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput) plus vi.spyOn on the prompts wrapper. The tier
 * mock is dropped entirely - the production handleExistingConfig receives
 * tier as a parameter, so detectTier never runs in this test path.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import * as p from '../../src/prompts/index.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { mergeWithDefaults } from '../../src/schemas/config.js';
import type { KigumiConfig } from '../../src/schemas/config.js';

function makeConfig(overrides: Partial<KigumiConfig> = {}): KigumiConfig {
  return mergeWithDefaults(overrides);
}

describe('handleExistingConfig', () => {
  let tempDir: string;
  let output: RecordingOutput;
  let selectSpy: ReturnType<typeof vi.spyOn>;
  let isCancelSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-existing-config-test-'))
    );
    output = createRecordingOutput();
    selectSpy = vi.spyOn(p, 'select');
    isCancelSpy = vi.spyOn(p, 'isCancel').mockReturnValue(false);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  describe('config display', () => {
    it('should show existing config details via output.note', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      selectSpy.mockResolvedValue('update');

      await handleExistingConfig(
        makeConfig({ framework: 'vue', typescript: false }),
        'free',
        output
      );

      expect(output.calls).toContainEqual(
        expect.objectContaining({
          method: 'note',
          args: [
            'Current Configuration',
            expect.stringContaining('vue') as unknown as string,
          ],
        })
      );
    });

    it('should display tier info in config note', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      selectSpy.mockResolvedValue('update');

      await handleExistingConfig(makeConfig(), 'free', output);

      expect(output.calls).toContainEqual(
        expect.objectContaining({
          method: 'note',
          args: [
            'Current Configuration',
            expect.stringContaining('free') as unknown as string,
          ],
        })
      );
    });

    it('should display theme info in config note', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      selectSpy.mockResolvedValue('update');

      await handleExistingConfig(
        makeConfig({
          theme: {
            selected: 'awesome',
            palette: 'bright',
            brandColor: 'purple',
          },
        }),
        'free',
        output
      );

      expect(output.calls).toContainEqual(
        expect.objectContaining({
          method: 'note',
          args: [
            'Current Configuration',
            expect.stringContaining('awesome') as unknown as string,
          ],
        })
      );
    });
  });

  describe('force mode (non-interactive)', () => {
    it('should return "update" without prompting when force is true', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      const result = await handleExistingConfig(
        makeConfig(),
        'free',
        output,
        true
      );

      expect(result).toBe('update');
      expect(selectSpy).not.toHaveBeenCalled();
    });

    it('should show info message about overwriting in force mode', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      await handleExistingConfig(makeConfig(), 'free', output, true);

      expect(output.calls).toContainEqual(
        expect.objectContaining({
          method: 'info',
          args: expect.arrayContaining([
            expect.stringContaining('non-interactive mode'),
          ]),
        })
      );
    });
  });

  describe('interactive mode', () => {
    it('should return "update" when user selects update', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      selectSpy.mockResolvedValue('update');

      const result = await handleExistingConfig(makeConfig(), 'free', output);
      expect(result).toBe('update');
    });

    it('should return "reinstall" when user selects reinstall', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      selectSpy.mockResolvedValue('reinstall');

      const result = await handleExistingConfig(makeConfig(), 'free', output);
      expect(result).toBe('reinstall');
    });

    it('should return "cancel" when user selects cancel', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      selectSpy.mockResolvedValue('cancel');

      const result = await handleExistingConfig(makeConfig(), 'free', output);
      expect(result).toBe('cancel');
    });

    it('should return "cancel" when user presses Ctrl+C (isCancel)', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      const cancelSymbol = Symbol('cancel');
      selectSpy.mockResolvedValue(cancelSymbol);
      isCancelSpy.mockReturnValue(true);

      const result = await handleExistingConfig(makeConfig(), 'free', output);
      expect(result).toBe('cancel');
    });

    it('should prompt with correct options', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      selectSpy.mockResolvedValue('update');

      await handleExistingConfig(makeConfig(), 'free', output);

      expect(selectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already exists'),
          options: expect.arrayContaining([
            expect.objectContaining({ value: 'update' }),
            expect.objectContaining({ value: 'reinstall' }),
            expect.objectContaining({ value: 'cancel' }),
          ]),
        })
      );
    });
  });

  describe('ExistingConfigAction type', () => {
    it('should only allow valid action values', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      for (const action of ['update', 'reinstall', 'cancel'] as const) {
        selectSpy.mockResolvedValue(action);
        const result = await handleExistingConfig(makeConfig(), 'free', output);
        expect(['update', 'reinstall', 'cancel']).toContain(result);
      }
    });
  });

  describe('pro tier display', () => {
    it('should show pro tier in config details when the caller resolved pro', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      selectSpy.mockResolvedValue('update');

      await handleExistingConfig(makeConfig(), 'pro', output);

      expect(output.calls).toContainEqual(
        expect.objectContaining({
          method: 'note',
          args: [
            'Current Configuration',
            expect.stringContaining('pro') as unknown as string,
          ],
        })
      );
    });
  });
});

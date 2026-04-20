/**
 * Init Existing Config Tests
 *
 * Tests for src/commands/init/existing-config.ts:
 * - handleExistingConfig() - Prompt user about an already-loaded kigumi config
 *
 * The caller is responsible for loading the config and only invoking
 * handleExistingConfig when a valid config was found. These tests therefore
 * pass a KigumiConfig object directly and focus on the prompt/output behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';
import { mergeWithDefaults } from '../../src/schemas/config.js';
import type { KigumiConfig } from '../../src/schemas/config.js';

// Mock @clack/prompts before importing module under test
vi.mock('@clack/prompts', () => ({
  select: vi.fn(),
  isCancel: vi.fn(() => false),
}));

// Mock the dynamic import of tier detection
vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn(() => Promise.resolve('free')),
}));

function createMockOutput(): OutputInterface {
  const spinnerMock: OutputSpinner = {
    start: vi.fn(),
    message: vi.fn(),
    stop: vi.fn(),
    error: vi.fn(),
  };

  return {
    intro: vi.fn(),
    outro: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    note: vi.fn(),
    spinner: vi.fn(() => spinnerMock),
    log: vi.fn(),
  };
}

function makeConfig(overrides: Partial<KigumiConfig> = {}): KigumiConfig {
  return mergeWithDefaults(overrides);
}

describe('handleExistingConfig', () => {
  let tempDir: string;
  let mockOutput: OutputInterface;

  beforeEach(async () => {
    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-existing-config-test-'))
    );
    mockOutput = createMockOutput();

    const clackModule = await import('@clack/prompts');
    (clackModule.select as ReturnType<typeof vi.fn>).mockReset();
    (clackModule.isCancel as ReturnType<typeof vi.fn>).mockReset();
    (clackModule.isCancel as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  describe('config display', () => {
    it('should show existing config details via output.note', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(
        makeConfig({ framework: 'vue', typescript: false }),
        tempDir,
        mockOutput
      );

      expect(mockOutput.note).toHaveBeenCalledWith(
        'Current Configuration',
        expect.stringContaining('vue')
      );
    });

    it('should display tier info in config note', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(makeConfig(), tempDir, mockOutput);

      expect(mockOutput.note).toHaveBeenCalledWith(
        'Current Configuration',
        expect.stringContaining('free')
      );
    });

    it('should display theme info in config note', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(
        makeConfig({
          theme: {
            selected: 'awesome',
            palette: 'bright',
            brandColor: 'purple',
          },
        }),
        tempDir,
        mockOutput
      );

      expect(mockOutput.note).toHaveBeenCalledWith(
        'Current Configuration',
        expect.stringContaining('awesome')
      );
    });
  });

  describe('force mode (non-interactive)', () => {
    it('should return "update" without prompting when force is true', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');

      const result = await handleExistingConfig(
        makeConfig(),
        tempDir,
        mockOutput,
        true
      );

      expect(result).toBe('update');
      expect(clackModule.select).not.toHaveBeenCalled();
    });

    it('should show info message about overwriting in force mode', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      await handleExistingConfig(makeConfig(), tempDir, mockOutput, true);

      expect(mockOutput.info).toHaveBeenCalledWith(
        expect.stringContaining('non-interactive mode')
      );
    });
  });

  describe('interactive mode', () => {
    it('should return "update" when user selects update', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      const result = await handleExistingConfig(
        makeConfig(),
        tempDir,
        mockOutput
      );
      expect(result).toBe('update');
    });

    it('should return "reinstall" when user selects reinstall', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'reinstall'
      );

      const result = await handleExistingConfig(
        makeConfig(),
        tempDir,
        mockOutput
      );
      expect(result).toBe('reinstall');
    });

    it('should return "cancel" when user selects cancel', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'cancel'
      );

      const result = await handleExistingConfig(
        makeConfig(),
        tempDir,
        mockOutput
      );
      expect(result).toBe('cancel');
    });

    it('should return "cancel" when user presses Ctrl+C (isCancel)', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');

      const cancelSymbol = Symbol('cancel');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        cancelSymbol
      );
      (clackModule.isCancel as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await handleExistingConfig(
        makeConfig(),
        tempDir,
        mockOutput
      );
      expect(result).toBe('cancel');
    });

    it('should prompt with correct options', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(makeConfig(), tempDir, mockOutput);

      expect(clackModule.select).toHaveBeenCalledWith(
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
      const clackModule = await import('@clack/prompts');

      for (const action of ['update', 'reinstall', 'cancel'] as const) {
        (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
          action
        );
        const result = await handleExistingConfig(
          makeConfig(),
          tempDir,
          mockOutput
        );
        expect(['update', 'reinstall', 'cancel']).toContain(result);
      }
    });
  });

  describe('pro tier detection', () => {
    it('should show pro tier in config details when detected', async () => {
      const tierModule = await import('../../src/utils/tier.js');
      (tierModule.detectTier as ReturnType<typeof vi.fn>).mockResolvedValue(
        'pro'
      );

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(makeConfig(), tempDir, mockOutput);

      expect(mockOutput.note).toHaveBeenCalledWith(
        'Current Configuration',
        expect.stringContaining('pro')
      );

      (tierModule.detectTier as ReturnType<typeof vi.fn>).mockResolvedValue(
        'free'
      );
    });
  });

  describe('does not read the filesystem', () => {
    it('should never emit the legacy "could not be loaded" warning', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(makeConfig(), tempDir, mockOutput);

      expect(mockOutput.warning).not.toHaveBeenCalled();
    });
  });
});

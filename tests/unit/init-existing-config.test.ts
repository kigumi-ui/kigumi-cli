/**
 * Init Existing Config Tests
 *
 * Tests for src/commands/init/existing-config.ts:
 * - handleExistingConfig() - Detect and handle existing kigumi configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';

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

describe('handleExistingConfig', () => {
  let tempDir: string;
  let mockOutput: OutputInterface;

  beforeEach(async () => {
    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-existing-config-test-'))
    );
    mockOutput = createMockOutput();

    // Reset mocks
    const clackModule = await import('@clack/prompts');
    (clackModule.select as ReturnType<typeof vi.fn>).mockReset();
    (clackModule.isCancel as ReturnType<typeof vi.fn>).mockReset();
    (clackModule.isCancel as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  /**
   * Write a valid kigumi config file.
   * Uses kigumi.config.json (the canonical name used by saveConfig).
   */
  async function writeKigumiConfig(
    overrides: Record<string, unknown> = {},
    filename = 'kigumi.config.json'
  ): Promise<void> {
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components/ui',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
      ...overrides,
    };
    await fs.writeJSON(path.join(tempDir, filename), config);
  }

  describe('when no config exists', () => {
    it('should return null when config file does not exist', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      const result = await handleExistingConfig(tempDir, mockOutput);
      expect(result).toBeNull();
    });

    it('should not prompt user when no config exists', async () => {
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');

      await handleExistingConfig(tempDir, mockOutput);

      expect(clackModule.select).not.toHaveBeenCalled();
    });
  });

  describe('when config exists', () => {
    it('should show existing config details via output.note', async () => {
      await writeKigumiConfig({ framework: 'vue', typescript: false });

      // Also need kigumi.config.json or the supported search path for loadConfig
      // handleExistingConfig checks kigumi-components.json for pathExists,
      // but loadConfig uses cosmiconfig which searches multiple names
      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(tempDir, mockOutput);

      expect(mockOutput.note).toHaveBeenCalledWith(
        'Current Configuration',
        expect.stringContaining('vue')
      );
    });

    it('should display tier info in config note', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(tempDir, mockOutput);

      expect(mockOutput.note).toHaveBeenCalledWith(
        'Current Configuration',
        expect.stringContaining('free')
      );
    });

    it('should display theme info in config note', async () => {
      await writeKigumiConfig({
        theme: { selected: 'awesome', palette: 'bright', brandColor: 'purple' },
      });

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(tempDir, mockOutput);

      expect(mockOutput.note).toHaveBeenCalledWith(
        'Current Configuration',
        expect.stringContaining('awesome')
      );
    });
  });

  describe('force mode (non-interactive)', () => {
    it('should return "update" without prompting when force is true', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');

      const result = await handleExistingConfig(tempDir, mockOutput, true);

      expect(result).toBe('update');
      expect(clackModule.select).not.toHaveBeenCalled();
    });

    it('should show info message about overwriting in force mode', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      await handleExistingConfig(tempDir, mockOutput, true);

      expect(mockOutput.info).toHaveBeenCalledWith(
        expect.stringContaining('non-interactive mode')
      );
    });
  });

  describe('interactive mode', () => {
    it('should return "update" when user selects update', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      const result = await handleExistingConfig(tempDir, mockOutput);
      expect(result).toBe('update');
    });

    it('should return "reinstall" when user selects reinstall', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'reinstall'
      );

      const result = await handleExistingConfig(tempDir, mockOutput);
      expect(result).toBe('reinstall');
    });

    it('should return "cancel" when user selects cancel', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'cancel'
      );

      const result = await handleExistingConfig(tempDir, mockOutput);
      expect(result).toBe('cancel');
    });

    it('should return "cancel" when user presses Ctrl+C (isCancel)', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');

      // Simulate cancel via Ctrl+C
      const cancelSymbol = Symbol('cancel');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        cancelSymbol
      );
      (clackModule.isCancel as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await handleExistingConfig(tempDir, mockOutput);
      expect(result).toBe('cancel');
    });

    it('should prompt with correct options', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      await handleExistingConfig(tempDir, mockOutput);

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

  describe('invalid config handling', () => {
    it('should return null when config file exists but cannot be loaded', async () => {
      // Write invalid JSON to the config path
      // Use content that cosmiconfig can parse as JSON but produces an empty/falsy result
      await fs.writeFile(path.join(tempDir, 'kigumi.config.json'), 'null');

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      const result = await handleExistingConfig(tempDir, mockOutput);

      // loadConfig returns null for null/empty configs, so the function returns null
      expect(result).toBeNull();
    });

    it('should return null when config file is empty', async () => {
      await fs.writeFile(path.join(tempDir, 'kigumi.config.json'), '');

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');

      const result = await handleExistingConfig(tempDir, mockOutput);
      expect(result).toBeNull();
    });
  });

  describe('config file name detection', () => {
    it('should detect kigumi.config.json', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      const result = await handleExistingConfig(tempDir, mockOutput);
      expect(result).toBe('update');
    });

    it('should detect legacy kigumi-components.json for backward compat', async () => {
      await writeKigumiConfig({}, 'kigumi-components.json');

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      const result = await handleExistingConfig(tempDir, mockOutput);
      expect(result).toBe('update');
    });
  });

  describe('ExistingConfigAction type', () => {
    it('should only allow valid action values', async () => {
      await writeKigumiConfig();

      const { handleExistingConfig } =
        await import('../../src/commands/init/existing-config.js');
      const clackModule = await import('@clack/prompts');

      // Test each valid action
      for (const action of ['update', 'reinstall', 'cancel'] as const) {
        (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
          action
        );
        const result = await handleExistingConfig(tempDir, mockOutput);
        expect(['update', 'reinstall', 'cancel']).toContain(result);
      }
    });
  });

  describe('pro tier detection', () => {
    it('should show pro tier in config details when detected', async () => {
      await writeKigumiConfig();

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

      await handleExistingConfig(tempDir, mockOutput);

      expect(mockOutput.note).toHaveBeenCalledWith(
        'Current Configuration',
        expect.stringContaining('pro')
      );

      // Restore
      (tierModule.detectTier as ReturnType<typeof vi.fn>).mockResolvedValue(
        'free'
      );
    });
  });
});

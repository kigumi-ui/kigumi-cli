/**
 * Brand Command Tests
 *
 * Tests for src/commands/brand.ts - Brand color management
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

describe('brandCommand', () => {
  let testDir: string;
  let originalCwd: string;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Re-apply mock implementations (clearAllMocks only clears history, not implementations
    // set by mockReturnValue in previous tests like the cancellation test)
    mockOutput.spinner.mockReturnValue(mockSpinner);
    const p = await import('@clack/prompts');
    vi.mocked(p.isCancel).mockReturnValue(false);

    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-brand-test-'))
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

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');
      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'green']);

      expect(regenerateKigumiSetup).toHaveBeenCalledWith(
        testDir,
        expect.objectContaining({
          theme: expect.objectContaining({ brandColor: 'green' }),
        }),
        'src/lib'
      );
    });

    it('should use custom utilsDir from config', async () => {
      await createConfig({ utilsDir: 'lib/utils' });

      const { regenerateKigumiSetup } =
        await import('../../src/utils/regenerate.js');
      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'red']);

      expect(regenerateKigumiSetup).toHaveBeenCalledWith(
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

      const p = await import('@clack/prompts');
      vi.mocked(p.select).mockResolvedValue('cyan');

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand']);

      expect(p.select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Select a brand color:',
        })
      );
    });

    it('should handle user cancellation', async () => {
      await createConfig();

      const p = await import('@clack/prompts');
      const cancelSymbol = Symbol('cancel');
      vi.mocked(p.select).mockResolvedValue(cancelSymbol);
      vi.mocked(p.isCancel).mockReturnValue(true);

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

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'orange']);

      expect(mockOutput.spinner).toHaveBeenCalledWith(
        'Updating brand color...'
      );
      expect(mockSpinner.stop).toHaveBeenCalledWith('Brand color updated');
    });

    it('should show outro message after successful update', async () => {
      await createConfig();

      const { brandCommand } = await import('../../src/commands/brand.js');
      await brandCommand.parseAsync(['node', 'brand', 'indigo']);

      expect(mockOutput.outro).toHaveBeenCalledWith(
        expect.stringContaining('indigo')
      );
    });
  });
});

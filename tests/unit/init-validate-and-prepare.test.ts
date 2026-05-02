/**
 * validateAndPrepare Tests
 *
 * Regression coverage for the init command's preparation phase.
 * Focus: no spurious warnings are emitted when a project has no existing
 * kigumi config (first-time `kigumi init`).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { z } from 'zod';
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';

vi.mock('@clack/prompts', () => ({
  select: vi.fn(),
  isCancel: vi.fn(() => false),
}));

// `tierSchema` is consumed by schemas/options.ts which this test transitively
// imports. The mock must expose it so option-schema construction doesn't fail.
// `detectTier` is a stable `vi.fn` so individual tests can override the
// resolved value per-call (e.g. simulate Pro detection).
vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn(() => Promise.resolve('free')),
  tierSchema: z.enum(['free', 'pro']),
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

describe('validateAndPrepare', () => {
  let tempDir: string;
  let mockOutput: OutputInterface;

  beforeEach(async () => {
    // Module-level vi.fn() instances accumulate calls across tests; clear
    // them so per-test "not.toHaveBeenCalled" assertions remain isolated.
    vi.clearAllMocks();

    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-validate-prepare-test-'))
    );
    mockOutput = createMockOutput();

    // Minimal package.json so PackageJsonExistsCheck passes
    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      name: 'test-project',
      version: '0.0.0',
    });
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  describe('when no existing config is present', () => {
    it('does not emit the "could not be loaded" warning', async () => {
      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      await validateAndPrepare({}, tempDir, mockOutput);

      expect(mockOutput.warning).not.toHaveBeenCalled();
    });

    it('does not prompt the user about existing configuration', async () => {
      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');
      const clackModule = await import('@clack/prompts');

      await validateAndPrepare({}, tempDir, mockOutput);

      expect(clackModule.select).not.toHaveBeenCalled();
    });

    it('returns a context with existingConfig=null and existingAction=null', async () => {
      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, mockOutput);

      expect(ctx.existingConfig).toBeNull();
      expect(ctx.existingAction).toBeNull();
    });
  });

  describe('when an existing config is present', () => {
    it('invokes the existing-config prompt', async () => {
      await fs.writeJSON(path.join(tempDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      });

      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, mockOutput);

      expect(clackModule.select).toHaveBeenCalledTimes(1);
      expect(ctx.existingConfig).not.toBeNull();
      expect(ctx.existingAction).toBe('update');
      expect(mockOutput.warning).not.toHaveBeenCalled();
    });

    it('throws UserCancelledError when the user picks "cancel"', async () => {
      // Catches a regression on the existingAction === 'cancel' branch.
      await fs.writeJSON(path.join(tempDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      });

      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'cancel'
      );

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');
      const { UserCancelledError } = await import('../../src/errors/index.js');

      await expect(
        validateAndPrepare({}, tempDir, mockOutput)
      ).rejects.toBeInstanceOf(UserCancelledError);
    });
  });

  describe('when the existing config is invalid', () => {
    it('warns, skips the existing-config prompt, and returns existingConfig=null', async () => {
      await fs.writeJSON(path.join(tempDir, 'kigumi.config.json'), {
        framework: 'bogus',
        theme: { selected: 'nope' },
      });

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, mockOutput);

      expect(mockOutput.warning).toHaveBeenCalledTimes(1);
      expect(mockOutput.warning).toHaveBeenCalledWith(
        expect.stringContaining('invalid')
      );
      expect(ctx.existingConfig).toBeNull();
      expect(ctx.existingAction).toBeNull();
      expect(mockOutput.note).not.toHaveBeenCalledWith(
        'Current Configuration',
        expect.anything()
      );
    });
  });

  describe('pre-flight checks', () => {
    it('rejects with PreFlightCheckError when package.json is missing', async () => {
      // beforeEach writes package.json; remove it so the check fails.
      await fs.remove(path.join(tempDir, 'package.json'));

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');
      const { PreFlightCheckError } = await import('../../src/errors/index.js');

      await expect(
        validateAndPrepare({}, tempDir, mockOutput)
      ).rejects.toBeInstanceOf(PreFlightCheckError);
    });
  });

  describe('non-interactive mode detection', () => {
    it('flags the context non-interactive when --yes is set', async () => {
      // --yes alone is enough; existing config also present so we can verify
      // handleExistingConfig resolves without invoking the select prompt.
      await fs.writeJSON(path.join(tempDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      });

      const clackModule = await import('@clack/prompts');

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({ yes: true }, tempDir, mockOutput);

      expect(ctx.isNonInteractive).toBe(true);
      expect(clackModule.select).not.toHaveBeenCalled();
    });

    it('flags the context non-interactive when both --framework and --theme are set', async () => {
      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare(
        { framework: 'react', theme: 'default' },
        tempDir,
        mockOutput
      );

      expect(ctx.isNonInteractive).toBe(true);
    });
  });

  describe('initial tier detection', () => {
    it('reflects the detected tier in the returned context', async () => {
      const tierModule = await import('../../src/utils/tier.js');
      vi.mocked(tierModule.detectTier).mockResolvedValueOnce('pro');

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, mockOutput);

      expect(ctx.initialTier).toBe('pro');
    });
  });

  describe('previousTier detection', () => {
    beforeEach(async () => {
      // Existing config required for previousTier to be computed
      await fs.writeJSON(path.join(tempDir, 'kigumi.config.json'), {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
      });

      const clackModule = await import('@clack/prompts');
      (clackModule.select as ReturnType<typeof vi.fn>).mockResolvedValue(
        'update'
      );
    });

    it('returns "pro" when webawesome-pro is only in devDependencies', async () => {
      // detectPreviousTier previously only checked dependencies. Projects that
      // install webawesome-pro in devDependencies (e.g. component libraries)
      // must still be detected as previously Pro so tier-migration triggers.
      await fs.writeJSON(path.join(tempDir, 'package.json'), {
        name: 'test-project',
        version: '0.0.0',
        devDependencies: {
          '@awesome.me/webawesome-pro': '^3.0.0',
        },
      });

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, mockOutput);

      expect(ctx.previousTier).toBe('pro');
    });

    it('returns "pro" when webawesome-pro is in dependencies', async () => {
      await fs.writeJSON(path.join(tempDir, 'package.json'), {
        name: 'test-project',
        version: '0.0.0',
        dependencies: {
          '@awesome.me/webawesome-pro': '^3.0.0',
        },
      });

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, mockOutput);

      expect(ctx.previousTier).toBe('pro');
    });

    it('returns "free" when neither webawesome-pro nor Pro token is present', async () => {
      await fs.writeJSON(path.join(tempDir, 'package.json'), {
        name: 'test-project',
        version: '0.0.0',
        dependencies: {
          '@awesome.me/webawesome': '^3.0.0',
        },
      });

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, mockOutput);

      expect(ctx.previousTier).toBe('free');
    });
  });
});

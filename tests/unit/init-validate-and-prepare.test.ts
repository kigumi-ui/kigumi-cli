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
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';

vi.mock('@clack/prompts', () => ({
  select: vi.fn(),
  isCancel: vi.fn(() => false),
}));

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

describe('validateAndPrepare', () => {
  let tempDir: string;
  let mockOutput: OutputInterface;

  beforeEach(async () => {
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

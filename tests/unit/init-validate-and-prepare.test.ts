/**
 * validateAndPrepare Tests
 *
 * Regression coverage for the init command's preparation phase.
 * Focus: no spurious warnings are emitted when a project has no existing
 * kigumi config (first-time `kigumi init`).
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput) plus vi.spyOn on the prompts wrapper. The tier
 * mock is replaced with writeTierFixture; beforeEach pins 'free' so
 * detectTier doesn't fall back to ~/.npmrc / WEBAWESOME_NPM_TOKEN, and
 * the one test that needs 'pro' overwrites the fixture explicitly.
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
import { writeTierFixture } from './_helpers/tier.js';

describe('validateAndPrepare', () => {
  let tempDir: string;
  let output: RecordingOutput;
  let selectSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-validate-prepare-test-'))
    );
    output = createRecordingOutput();

    // selectSpy lets tests script return values for the existing-config
    // prompt; real isCancel() from the prompts wrapper handles non-symbol
    // string returns naturally (returns false), so no isCancel spy needed.
    selectSpy = vi.spyOn(p, 'select');

    // Pin tier to 'free' deterministically: writeTierFixture writes a
    // package.json with the WA Free dep so detectTier doesn't fall back
    // to the developer's ~/.npmrc / WEBAWESOME_NPM_TOKEN. Doubles as the
    // PackageJsonExistsCheck satisfier; tests that need 'pro' overwrite
    // this fixture explicitly.
    await writeTierFixture(tempDir, 'free');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  describe('when no existing config is present', () => {
    it('does not emit the "could not be loaded" warning', async () => {
      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      await validateAndPrepare({}, tempDir, output);

      expect(output.calls.some((c) => c.method === 'warning')).toBe(false);
    });

    it('does not prompt the user about existing configuration', async () => {
      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      await validateAndPrepare({}, tempDir, output);

      expect(selectSpy).not.toHaveBeenCalled();
    });

    it('returns a context with existingConfig=null and existingAction=null', async () => {
      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, output);

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

      selectSpy.mockResolvedValue('update');

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, output);

      expect(selectSpy).toHaveBeenCalledTimes(1);
      expect(ctx.existingConfig).not.toBeNull();
      expect(ctx.existingAction).toBe('update');
      expect(output.calls.some((c) => c.method === 'warning')).toBe(false);
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

      selectSpy.mockResolvedValue('cancel');

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');
      const { UserCancelledError } = await import('../../src/errors/index.js');

      await expect(
        validateAndPrepare({}, tempDir, output)
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

      const ctx = await validateAndPrepare({}, tempDir, output);

      const warnings = output.calls.filter((c) => c.method === 'warning');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].args[0]).toEqual(expect.stringContaining('invalid'));
      expect(ctx.existingConfig).toBeNull();
      expect(ctx.existingAction).toBeNull();
      const currentConfigNote = output.calls.find(
        (c) => c.method === 'note' && c.args[0] === 'Current Configuration'
      );
      expect(currentConfigNote).toBeUndefined();
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
        validateAndPrepare({}, tempDir, output)
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

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({ yes: true }, tempDir, output);

      expect(ctx.isNonInteractive).toBe(true);
      expect(selectSpy).not.toHaveBeenCalled();
    });

    it('flags the context non-interactive when both --framework and --theme are set', async () => {
      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare(
        { framework: 'react', theme: 'default' },
        tempDir,
        output
      );

      expect(ctx.isNonInteractive).toBe(true);
    });
  });

  describe('initial tier detection', () => {
    it('reflects the detected tier in the returned context', async () => {
      // Overwrite the default package.json with a pro fixture so
      // detectTier returns 'pro' on its next read.
      await writeTierFixture(tempDir, 'pro');

      const { validateAndPrepare } =
        await import('../../src/commands/init/index.js');

      const ctx = await validateAndPrepare({}, tempDir, output);

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

      selectSpy.mockResolvedValue('update');
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

      const ctx = await validateAndPrepare({}, tempDir, output);

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

      const ctx = await validateAndPrepare({}, tempDir, output);

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

      const ctx = await validateAndPrepare({}, tempDir, output);

      expect(ctx.previousTier).toBe('free');
    });
  });
});

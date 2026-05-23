/**
 * Protects: 657d7d8d ("test(config): strengthen coverage + fix init preservation
 *           bug") — surfaced via PR #95 init preservation work.
 * Bug: preservePersistentFields() in src/commands/init/config-builder.ts
 *      used `existingConfig.installedComponents?.length` to guard the copy
 *      step. `installedComponents` is a `Record<string, T>` per the schema,
 *      not an array — `.length` was always `undefined`, so the field was
 *      silently dropped on every re-init. A user who had `kigumi add button`
 *      installed and then re-ran `kigumi init` lost the provenance entry.
 * Fix: 657d7d8d — replace the guard with
 *      `Object.keys(installedComponents).length > 0`, matching the existing
 *      `installedThemes` pattern. The Record + non-empty guard is the
 *      invariant this regression test pins.
 *
 * Per the V plan we keep this directly behavioural (drives buildConfigNon-
 * Interactive end-to-end) instead of poking the private helper, so the
 * regression survives any future refactor that renames the helper.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  createRecordingOutput,
  type RecordingOutput,
} from '../_helpers/output.js';
import { writeTierFixture } from '../_helpers/tier.js';

const projectInfo = {
  framework: 'react' as const,
  typescript: true,
  packageManager: 'pnpm' as const,
  hasVite: false,
  isNext: false,
  sourceLayout: 'src' as const,
};

describe('PR #95 / 657d7d8d: re-init preserves Record-typed installedComponents', () => {
  let tempDir: string;
  let output: RecordingOutput;

  beforeEach(async () => {
    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-regression-pr95-'))
    );
    output = createRecordingOutput();
    await writeTierFixture(tempDir, 'free');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it('non-interactive re-init copies a non-empty installedComponents Record over', async () => {
    const existingConfig = {
      framework: 'react' as const,
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
      installedComponents: {
        button: {
          source: 'community' as const,
          registryVersion: '1.0.0',
          registryUrl: 'https://registry.kigumi.style',
        },
      },
      installedThemes: {
        awesome: { source: 'community' as const, registryVersion: '1.0.0' },
      },
    };

    const { buildConfigNonInteractive } =
      await import('../../../src/commands/init/config-builder.js');
    const { config } = await buildConfigNonInteractive(
      { yes: true, framework: 'react', theme: 'default' },
      projectInfo,
      tempDir,
      output,
      'free',
      existingConfig
    );

    // Pre-fix: .length on a Record was undefined, falsy, dropped the copy.
    expect(config.installedComponents).toEqual(
      existingConfig.installedComponents
    );
    expect(config.installedThemes).toEqual(existingConfig.installedThemes);
  });

  it('non-interactive re-init drops an empty installedComponents Record (no false positive)', async () => {
    const existingConfig = {
      framework: 'react' as const,
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
      installedComponents: {},
      installedThemes: {},
    };

    const { buildConfigNonInteractive } =
      await import('../../../src/commands/init/config-builder.js');
    const { config } = await buildConfigNonInteractive(
      { yes: true, framework: 'react', theme: 'default' },
      projectInfo,
      tempDir,
      output,
      'free',
      existingConfig
    );

    expect(config.installedComponents).toBeUndefined();
    expect(config.installedThemes).toBeUndefined();
  });
});

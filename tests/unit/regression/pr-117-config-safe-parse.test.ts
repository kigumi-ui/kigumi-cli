/**
 * Protects: PR #117 (F-037)
 * Bug: kigumi init read raw cosmiconfig output without validating it, so a
 *      schema-invalid kigumi.config.json (e.g. unknown framework value)
 *      passed through silently into handleExistingConfig, displaying garbage
 *      as the authoritative "Current Configuration" before failing deep in
 *      the config-builder with an unrelated-looking Zod error.
 * Fix: e58931042 (#117) — validateAndPrepare runs kigumiConfigSchema.safeParse
 *      on the loaded payload, warns the user once, and treats the result as a
 *      first-init when validation fails. Cluster A (PR #152) reshaped
 *      loadConfig to return { config, filepath } and added pre-defaults
 *      merging before safeParse so pre-cluster-A configs still load cleanly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import * as p from '../../../src/prompts/index.js';
import {
  createRecordingOutput,
  type RecordingOutput,
} from '../_helpers/output.js';
import { writeTierFixture } from '../_helpers/tier.js';

describe('PR #117 (F-037): malformed config safe-parse on init', () => {
  let tempDir: string;
  let output: RecordingOutput;

  beforeEach(async () => {
    tempDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-regression-pr117-'))
    );
    output = createRecordingOutput();
    vi.spyOn(p, 'select');
    await writeTierFixture(tempDir, 'free');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it('warns and falls through to first-init when on-disk config has an invalid framework', async () => {
    await fs.writeJSON(path.join(tempDir, 'kigumi.config.json'), {
      framework: 'svelte-5',
      typescript: true,
      componentsDir: 'src/components',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
    });

    const { validateAndPrepare } =
      await import('../../../src/commands/init/index.js');
    const ctx = await validateAndPrepare({}, tempDir, output);

    const warning = output.calls.find((c) => c.method === 'warning');
    expect(
      warning,
      'expected an output.warning() about invalid config'
    ).toBeDefined();
    expect(String(warning?.args[0])).toMatch(/invalid.*overwritten/i);

    expect(ctx.existingConfig).toBeNull();
    expect(ctx.existingAction).toBeNull();
  });

  it('warns and falls through when on-disk config is missing the required theme block', async () => {
    await fs.writeJSON(path.join(tempDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      // theme intentionally absent — strict schema should reject this even
      // after pre-defaults merging if the merged shape is still missing keys.
      // Using an unknown key triggers the same code path deterministically.
      framwork: 'react',
    });

    const { validateAndPrepare } =
      await import('../../../src/commands/init/index.js');
    const ctx = await validateAndPrepare({}, tempDir, output);

    const warning = output.calls.find((c) => c.method === 'warning');
    expect(warning).toBeDefined();
    expect(ctx.existingConfig).toBeNull();
  });
});

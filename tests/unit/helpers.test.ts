/**
 * Tests for the cluster-S test helpers.
 *
 * Covers:
 * - tests/unit/_helpers/output.ts createRecordingOutput()
 * - tests/unit/_helpers/prompts.ts createTestPrompts()
 * - tests/unit/_helpers/tier.ts writeTierFixture()
 *
 * The pre-cluster-S createTestOutput() is exercised indirectly through its
 * 4 existing consumers (init-tier-migration, init-file-generator,
 * init-post-install-instructions, project-config); we only verify the new
 * sibling here.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { createRecordingOutput } from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import { writeTierFixture } from './_helpers/tier.js';
import { detectTier } from '../../src/utils/tier.js';

describe('createRecordingOutput', () => {
  it('records every method call with method name and args', () => {
    const output = createRecordingOutput();

    output.intro('Welcome');
    output.success('Done');
    output.error('Boom', new Error('detail'));
    output.note('Title', 'Body');

    expect(output.calls).toEqual([
      { method: 'intro', args: ['Welcome'] },
      { method: 'success', args: ['Done'] },
      { method: 'error', args: ['Boom', expect.any(Error)] },
      { method: 'note', args: ['Title', 'Body'] },
    ]);
  });

  it('returns a no-op spinner that does not throw on any method', () => {
    const output = createRecordingOutput();
    const spinner = output.spinner('working');
    spinner.start('starting');
    spinner.message('mid');
    spinner.stop('done');
    spinner.error('failed');

    // The spinner() call itself is recorded.
    expect(output.calls.find((c) => c.method === 'spinner')).toEqual({
      method: 'spinner',
      args: ['working'],
    });
  });

  it('exposes a reset() that clears the recorded calls', () => {
    const output = createRecordingOutput();
    output.info('a');
    output.info('b');
    expect(output.calls).toHaveLength(2);
    output.reset();
    expect(output.calls).toHaveLength(0);
    output.info('c');
    expect(output.calls).toEqual([{ method: 'info', args: ['c'] }]);
  });
});

describe('createTestPrompts', () => {
  it('returns scripted answers in order for confirm/select/text/multiselect', async () => {
    const prompts = createTestPrompts({
      confirm: [true, false],
      select: ['react', 'vue'],
      text: ['hello'],
      multiselect: [['a', 'b']],
    });

    expect(await prompts.confirm({ message: '?' })).toBe(true);
    expect(await prompts.confirm({ message: '?' })).toBe(false);
    expect(await prompts.select({ message: '?', options: [] })).toBe('react');
    expect(await prompts.select({ message: '?', options: [] })).toBe('vue');
    expect(await prompts.text({ message: '?' })).toBe('hello');
    expect(await prompts.multiselect({ message: '?', options: [] })).toEqual([
      'a',
      'b',
    ]);
  });

  it('throws "Unexpected prompt" when a script is exhausted', async () => {
    const prompts = createTestPrompts({ confirm: [true] });
    await prompts.confirm({ message: 'first' });
    await expect(prompts.confirm({ message: 'second' })).rejects.toThrow(
      /Unexpected prompt: confirm.*second/
    );
  });

  it('throws when an unconfigured prompt method is called', async () => {
    const prompts = createTestPrompts({});
    await expect(prompts.text({ message: 'name?' })).rejects.toThrow(
      /Unexpected prompt: text.*name\?/
    );
  });

  it('isCancel returns false for non-cancel values, supports script override', () => {
    const prompts = createTestPrompts({});
    expect(prompts.isCancel('value')).toBe(false);
    expect(prompts.isCancel(undefined)).toBe(false);

    const cancelSym = Symbol('cancel');
    const prompts2 = createTestPrompts({ cancelSymbol: cancelSym });
    expect(prompts2.isCancel(cancelSym)).toBe(true);
    expect(prompts2.isCancel('value')).toBe(false);
  });

  it('intro/outro/note/log/spinner are no-ops that do not throw', () => {
    const prompts = createTestPrompts({});
    expect(() => {
      prompts.intro('hi');
      prompts.outro('bye');
      prompts.note('m', 't');
      prompts.log.info('i');
      prompts.log.success('s');
      prompts.log.warning('w');
      prompts.log.error('e');
      prompts.log.message('m');
      const spinner = prompts.spinner();
      spinner.start();
      spinner.message('m');
      spinner.stop();
    }).not.toThrow();
  });
});

describe('writeTierFixture', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-tier-fixture-'))
    );
    originalCwd = process.cwd();
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  it('writes a free-tier package.json that detectTier() reads as "free"', async () => {
    await writeTierFixture(testDir, 'free');

    const pkg = await fs.readJson(path.join(testDir, 'package.json'));
    expect(pkg.dependencies).toHaveProperty('@awesome.me/webawesome');
    expect(pkg.dependencies).not.toHaveProperty('@awesome.me/webawesome-pro');

    expect(await detectTier(testDir)).toBe('free');
  });

  it('writes a pro-tier package.json that detectTier() reads as "pro"', async () => {
    await writeTierFixture(testDir, 'pro');

    const pkg = await fs.readJson(path.join(testDir, 'package.json'));
    expect(pkg.dependencies).toHaveProperty('@awesome.me/webawesome-pro');

    expect(await detectTier(testDir)).toBe('pro');
  });
});

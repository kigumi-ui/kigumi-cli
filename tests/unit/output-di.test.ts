/**
 * Output DI Hook Tests
 *
 * Verifies the test-only hooks on src/output/index.ts:
 * - setOutputForTesting(output) registers a custom OutputInterface
 * - resetOutputForTesting() restores the default ConsoleOutput
 * - getOutput() returns the registered instance when set, else a fresh
 *   ConsoleOutput.
 *
 * The hooks are part of cluster S and replace the prior
 * factory-mock pattern for src/output/index.js that previously dominated
 * tests/unit/.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  getOutput,
  setOutputForTesting,
  resetOutputForTesting,
  ConsoleOutput,
} from '../../src/output/index.js';
import type { OutputInterface } from '../../src/output/types.js';
import { createTestOutput } from './_helpers/output.js';

describe('output DI hook', () => {
  afterEach(() => {
    resetOutputForTesting();
  });

  it('returns a ConsoleOutput by default', () => {
    expect(getOutput()).toBeInstanceOf(ConsoleOutput);
  });

  it('returns the registered instance after setOutputForTesting', () => {
    const fake: OutputInterface = createTestOutput();
    setOutputForTesting(fake);
    expect(getOutput()).toBe(fake);
  });

  it('returns to default after resetOutputForTesting', () => {
    const fake: OutputInterface = createTestOutput();
    setOutputForTesting(fake);
    resetOutputForTesting();
    expect(getOutput()).toBeInstanceOf(ConsoleOutput);
    expect(getOutput()).not.toBe(fake);
  });

  it('replaces a previously registered instance on a second call', () => {
    const first: OutputInterface = createTestOutput();
    const second: OutputInterface = createTestOutput();
    setOutputForTesting(first);
    setOutputForTesting(second);
    expect(getOutput()).toBe(second);
  });
});

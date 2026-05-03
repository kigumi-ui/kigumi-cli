/**
 * List Command --json Output Tests
 *
 * Verifies JSON output structure for CI/CD consumption.
 *
 * Cluster S, F-126: rewritten to use the PR-S1 seam helpers
 * (createRecordingOutput / createTestPrompts) instead of module-level
 * mocks for @clack/prompts and src/output/index.js.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createRecordingOutput,
  type RecordingOutput,
} from './_helpers/output.js';
import { createTestPrompts } from './_helpers/prompts.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';

import { registerTestSeams, clearTestSeams } from './_helpers/seams.js';

describe('listCommand --json', () => {
  let stdoutWrite: ReturnType<typeof vi.fn>;
  let originalStdoutWrite: typeof process.stdout.write;
  let output: RecordingOutput;
  let prompts: PromptsAdapter;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    output = createRecordingOutput();
    prompts = createTestPrompts({});
    await registerTestSeams(output, prompts);

    stdoutWrite = vi.fn().mockReturnValue(true);
    originalStdoutWrite = process.stdout.write;
    process.stdout.write =
      stdoutWrite as unknown as typeof process.stdout.write;
  });

  afterEach(async () => {
    await clearTestSeams();
    process.stdout.write = originalStdoutWrite;
  });

  it('should output valid JSON array', async () => {
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ json: true });

    expect(stdoutWrite).toHaveBeenCalledTimes(1);
    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should include name, category, and description for each component', async () => {
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    for (const item of data) {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('description');
      expect(typeof item.name).toBe('string');
      expect(typeof item.category).toBe('string');
      expect(typeof item.description).toBe('string');
    }
  });

  it('should include known components like button and dialog', async () => {
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    const names = data.map((c: { name: string }) => c.name);
    expect(names).toContain('button');
    expect(names).toContain('dialog');
  });

  it('should not call any output methods in JSON mode', async () => {
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ json: true });

    expect(output.calls.some((c) => c.method === 'intro')).toBe(false);
    expect(output.calls.some((c) => c.method === 'outro')).toBe(false);
    expect(output.calls.some((c) => c.method === 'note')).toBe(false);
  });

  it('should output pipe-safe JSON ending with newline', async () => {
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ json: true });

    const raw = stdoutWrite.mock.calls[0][0];
    expect(raw.endsWith('\n')).toBe(true);
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('should produce same component count as text mode', async () => {
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    const { getAllComponents } = await import('../../src/utils/registry.js');
    const allComponents = getAllComponents();

    expect(data.length).toBe(Object.keys(allComponents).length);
  });

  it('should include tier field with value free or pro for every entry', async () => {
    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ json: true });

    const data = JSON.parse(stdoutWrite.mock.calls[0][0]);
    for (const item of data) {
      expect(item).toHaveProperty('tier');
      expect(['free', 'pro']).toContain(item.tier);
    }
  });

  it('should not call detectTier in JSON mode', async () => {
    const tierModule = await import('../../src/utils/tier.js');
    const spy = vi.spyOn(tierModule, 'detectTier');

    const { listCommand } = await import('../../src/commands/list.js');
    await listCommand({ json: true });

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

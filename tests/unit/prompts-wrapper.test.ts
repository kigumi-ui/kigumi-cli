/**
 * Prompts Wrapper Tests
 *
 * Verifies src/prompts/index.ts (the @clack/prompts wrapper added by
 * cluster S, F-126):
 * - All wrapped methods route through the registered adapter when one is
 *   set via setPromptsForTesting().
 * - resetPromptsForTesting() restores the default adapter (which delegates
 *   to @clack/prompts).
 * - The default isCancel returns false for non-cancel symbols (proves the
 *   default adapter delegates to clack without invoking interactive I/O).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as p from '../../src/prompts/index.js';
import {
  setPromptsForTesting,
  resetPromptsForTesting,
} from '../../src/prompts/index.js';
import type { PromptsAdapter } from '../../src/prompts/types.js';

function buildAdapter(overrides: Partial<PromptsAdapter> = {}): PromptsAdapter {
  return {
    confirm: vi.fn(async () => true),
    intro: vi.fn(),
    outro: vi.fn(),
    note: vi.fn(),
    log: {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      message: vi.fn(),
      step: vi.fn(),
    },
    select: vi.fn(async () => 'value') as unknown as PromptsAdapter['select'],
    text: vi.fn(async () => 'typed'),
    multiselect: vi.fn(async () => [
      'a',
    ]) as unknown as PromptsAdapter['multiselect'],
    spinner: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn(),
    })) as unknown as PromptsAdapter['spinner'],
    isCancel: vi.fn(() => true) as unknown as PromptsAdapter['isCancel'],
    ...overrides,
  };
}

describe('prompts wrapper', () => {
  afterEach(() => {
    resetPromptsForTesting();
  });

  it('routes confirm/select/text/multiselect through the registered adapter', async () => {
    const adapter = buildAdapter();
    setPromptsForTesting(adapter);

    await p.confirm({ message: 'ok?' });
    await p.select({ message: 'pick', options: [{ value: 'a', label: 'A' }] });
    await p.text({ message: 'type' });
    await p.multiselect({
      message: 'pick',
      options: [{ value: 'a', label: 'A' }],
    });

    expect(adapter.confirm).toHaveBeenCalledWith({ message: 'ok?' });
    expect(adapter.select).toHaveBeenCalled();
    expect(adapter.text).toHaveBeenCalled();
    expect(adapter.multiselect).toHaveBeenCalled();
  });

  it('routes intro/outro/note/spinner/isCancel through the registered adapter', () => {
    const adapter = buildAdapter();
    setPromptsForTesting(adapter);

    p.intro('hello');
    p.outro('bye');
    p.note('msg', 'title');
    p.spinner();
    p.isCancel(undefined);

    expect(adapter.intro).toHaveBeenCalledWith('hello');
    expect(adapter.outro).toHaveBeenCalledWith('bye');
    expect(adapter.note).toHaveBeenCalledWith('msg', 'title');
    expect(adapter.spinner).toHaveBeenCalled();
    expect(adapter.isCancel).toHaveBeenCalledWith(undefined);
  });

  it('routes log.info/success/warning/error/message through the adapter', () => {
    const adapter = buildAdapter();
    setPromptsForTesting(adapter);

    p.log.info('i');
    p.log.success('s');
    p.log.warning('w');
    p.log.error('e');
    p.log.message('m');

    expect(adapter.log.info).toHaveBeenCalledWith('i');
    expect(adapter.log.success).toHaveBeenCalledWith('s');
    expect(adapter.log.warning).toHaveBeenCalledWith('w');
    expect(adapter.log.error).toHaveBeenCalledWith('e');
    expect(adapter.log.message).toHaveBeenCalledWith('m');
  });

  it('returns to the default @clack/prompts adapter after reset', () => {
    const adapter = buildAdapter({
      isCancel: vi.fn(() => true) as unknown as PromptsAdapter['isCancel'],
    });
    setPromptsForTesting(adapter);
    expect(p.isCancel(undefined)).toBe(true);

    resetPromptsForTesting();
    // clack.isCancel returns true only for the cancel Symbol; undefined is not.
    expect(p.isCancel(undefined)).toBe(false);
    // Adapter not consulted after reset.
    expect(adapter.isCancel).toHaveBeenCalledTimes(1);
  });

  it('replaces a previously registered adapter on a second call', () => {
    const first = buildAdapter();
    const second = buildAdapter();
    setPromptsForTesting(first);
    setPromptsForTesting(second);

    p.intro('hi');

    expect(first.intro).not.toHaveBeenCalled();
    expect(second.intro).toHaveBeenCalledWith('hi');
  });
});

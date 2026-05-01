/**
 * Tests for the component selector helpers.
 *
 * Targets:
 * - `buildSelectorChoices` (extracted exported pure function): table-driven.
 * - `selectComponents` (existing dispatch): three branches.
 *
 * Light mock for @clack/prompts. `buildSelectorChoices` consults the live
 * tier-restrictions module which reads `getAllComponents()` for component
 * metadata; tests use the real registry for the filter, since the source
 * of truth for tier is centralized there. Hint construction reads the input
 * fixture directly, so we still get true unit-test coverage of the body.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as p from '@clack/prompts';
import {
  buildSelectorChoices,
  selectComponents,
} from '../../src/commands/add/component-selector.js';
import { getAllComponents } from '../../src/utils/registry.js';
import type { ComponentRegistry } from '../../src/utils/registry.js';
import type { OutputInterface } from '../../src/output/types.js';
import type { AddOptions } from '../../src/schemas/index.js';

vi.mock('@clack/prompts', async () => {
  const actual =
    await vi.importActual<typeof import('@clack/prompts')>('@clack/prompts');
  return {
    ...actual,
    multiselect: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
  };
});

const stubOutput: OutputInterface = {
  intro: vi.fn(),
  outro: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  step: vi.fn(),
  spinner: vi.fn(),
  cancel: vi.fn(),
  log: vi.fn(),
  note: vi.fn(),
  message: vi.fn(),
  raw: vi.fn(),
} as unknown as OutputInterface;

function findComponent(predicate: (tier: 'free' | 'pro') => boolean): string {
  const all = getAllComponents();
  for (const [key, def] of Object.entries(all)) {
    if (predicate(def.tier)) return key;
  }
  throw new Error('No component matched predicate in registry');
}

describe('buildSelectorChoices', () => {
  it('free tier filters out Pro components', () => {
    const all = getAllComponents();
    const choicesFree = buildSelectorChoices(all, 'free');
    const choicesPro = buildSelectorChoices(all, 'pro');

    expect(choicesPro.length).toBeGreaterThan(choicesFree.length);

    // Every choice surfaced to a Free user must be a Free-tier component.
    for (const c of choicesFree) {
      expect(all[c.value].tier).toBe('free');
    }
  });

  it('pro tier includes both free and pro components', () => {
    const all = getAllComponents();
    const choices = buildSelectorChoices(all, 'pro');

    const tiers = new Set(choices.map((c) => all[c.value].tier));
    expect(tiers.has('free')).toBe(true);
    expect(tiers.has('pro')).toBe(true);
  });

  it('result is sorted alphabetically by label', () => {
    const choices = buildSelectorChoices(getAllComponents(), 'pro');
    const labels = choices.map((c) => c.label);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b));
    expect(labels).toEqual(sorted);
  });

  it('hint includes Pro suffix only for Pro components', () => {
    const all = getAllComponents();
    const choices = buildSelectorChoices(all, 'pro');

    for (const c of choices) {
      const def = all[c.value];
      if (def.tier === 'pro') {
        expect(c.hint.endsWith(' • Pro')).toBe(true);
      } else {
        expect(c.hint.endsWith(' • Pro')).toBe(false);
      }
      expect(c.hint).toContain(def.category);
    }
  });

  it('returns an empty array for an empty input registry', () => {
    const choices = buildSelectorChoices({} as ComponentRegistry, 'pro');
    expect(choices).toEqual([]);
  });
});

describe('selectComponents dispatch', () => {
  beforeEach(() => {
    vi.mocked(p.multiselect).mockReset();
    vi.mocked(p.isCancel).mockReset().mockReturnValue(false);
  });

  it('options.all returns all available components for tier, sorted', async () => {
    const result = await selectComponents(
      [],
      { all: true } as AddOptions,
      'free',
      stubOutput
    );

    const all = getAllComponents();
    const expected = Object.keys(all)
      .filter((k) => all[k].tier === 'free')
      .sort((a, b) => a.localeCompare(b));

    expect(result).toEqual(expected);
    expect(p.multiselect).not.toHaveBeenCalled();
  });

  it('passes through CLI-provided component names without prompting', async () => {
    const freeKey = findComponent((t) => t === 'free');

    const result = await selectComponents(
      [freeKey, 'badge'],
      {} as AddOptions,
      'free',
      stubOutput
    );

    expect(result).toEqual([freeKey, 'badge']);
    expect(p.multiselect).not.toHaveBeenCalled();
  });

  it('triggers the interactive prompt when no components and not --all', async () => {
    vi.mocked(p.multiselect).mockResolvedValueOnce(['button']);

    const result = await selectComponents(
      [],
      {} as AddOptions,
      'pro',
      stubOutput
    );

    expect(p.multiselect).toHaveBeenCalledTimes(1);
    expect(result).toEqual(['button']);
  });
});

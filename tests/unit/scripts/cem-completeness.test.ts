/**
 * Tests for Check A's all-or-nothing CEM gate.
 *
 * Check A regenerates templates and diffs them against what is committed. It
 * can only do that honestly against a CEM describing every component: a run
 * against the free package would verify the free subset and say nothing about
 * the rest. Issue #43 is what happens when "said nothing" is printed as a pass.
 */
import { describe, it, expect } from 'vitest';
import type { CemResolution } from '../../../scripts/find-cem.js';
import { assessCemCompleteness } from '../../../scripts/check-generated-fresh.js';

const REGISTRY_SIZE = 84;

function resolution(over: Partial<CemResolution> = {}): CemResolution {
  return {
    found: true,
    path: '/repo/docs/node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json',
    tier: 'pro',
    componentCount: REGISTRY_SIZE,
    ...over,
  };
}

describe('assessCemCompleteness', () => {
  it('admits a CEM describing every registry component', () => {
    const verdict = assessCemCompleteness(resolution(), REGISTRY_SIZE);

    expect(verdict.usable).toBe(true);
    expect(verdict.outcome).toBe('complete');
  });

  it('refuses the free CEM, which describes only part of the registry', () => {
    // 66 of 84. Verifying that subset and printing an unqualified pass is the
    // defect in #43 rebuilt at smaller scale, so a partial CEM is not usable.
    const verdict = assessCemCompleteness(
      resolution({ tier: 'free', componentCount: 66 }),
      REGISTRY_SIZE
    );

    expect(verdict.usable).toBe(false);
    expect(verdict.outcome).toBe('partial');
    expect(verdict.reason).toContain('66');
    expect(verdict.reason).toContain('84');
  });

  it('reports an absent CEM as absent, never as a pass', () => {
    const verdict = assessCemCompleteness(
      { found: false, path: null, tier: null, componentCount: 0 },
      REGISTRY_SIZE
    );

    expect(verdict.usable).toBe(false);
    expect(verdict.outcome).toBe('absent');
  });

  it('admits a CEM describing more components than the registry tracks', () => {
    // Web Awesome may ship a component Kigumi has not wrapped yet. That is a
    // superset, not a gap, so it must not block the guard.
    const verdict = assessCemCompleteness(
      resolution({ componentCount: REGISTRY_SIZE + 3 }),
      REGISTRY_SIZE
    );

    expect(verdict.usable).toBe(true);
    expect(verdict.outcome).toBe('complete');
  });
});

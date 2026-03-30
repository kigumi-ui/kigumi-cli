import { describe, it, expect } from 'vitest';
import {
  generateSemanticVariables,
  PALETTE_STEPS,
  type SemanticColorGroup,
} from '../lib/color-utils';

describe('generateSemanticVariables', () => {
  const groups: SemanticColorGroup[] = [
    'success',
    'warning',
    'danger',
    'neutral',
  ];

  it('generates palette step variables for each semantic group', () => {
    for (const group of groups) {
      const vars = generateSemanticVariables('#22c55e', group, 'light');
      for (const step of PALETTE_STEPS) {
        expect(vars[`--wa-color-${group}-${step}`]).toBeDefined();
        expect(vars[`--wa-color-${group}-${step}`]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('generates semantic fill/border/on variables', () => {
    const vars = generateSemanticVariables('#ef4444', 'danger', 'light');
    expect(vars['--wa-color-danger-fill-loud']).toBeDefined();
    expect(vars['--wa-color-danger-fill-normal']).toBeDefined();
    expect(vars['--wa-color-danger-fill-quiet']).toBeDefined();
    expect(vars['--wa-color-danger-border-loud']).toBeDefined();
    expect(vars['--wa-color-danger-border-normal']).toBeDefined();
    expect(vars['--wa-color-danger-border-quiet']).toBeDefined();
    expect(vars['--wa-color-danger-on-loud']).toBe('white');
    expect(vars['--wa-color-danger-on-normal']).toBeDefined();
    expect(vars['--wa-color-danger-on-quiet']).toBeDefined();
  });

  it('dark mode generates different semantic values than light mode', () => {
    const lightVars = generateSemanticVariables('#22c55e', 'success', 'light');
    const darkVars = generateSemanticVariables('#22c55e', 'success', 'dark');
    // fill-quiet: light uses step-95, dark uses step-10
    expect(lightVars['--wa-color-success-fill-quiet']).toBe(
      lightVars['--wa-color-success-95']
    );
    expect(darkVars['--wa-color-success-fill-quiet']).toBe(
      darkVars['--wa-color-success-10']
    );
  });

  it('includes the base color variable', () => {
    const vars = generateSemanticVariables('#f59e0b', 'warning', 'light');
    expect(vars['--wa-color-warning']).toBe('#f59e0b');
  });

  it('quiet fills use direct step references (WA default)', () => {
    const vars = generateSemanticVariables('#6b7280', 'neutral', 'light');
    // WA default uses direct step references, not color-mix
    expect(vars['--wa-color-neutral-fill-quiet']).toBe(
      vars['--wa-color-neutral-95']
    );
  });

  it('neutral has special overrides for fill-loud and on-loud', () => {
    const lightVars = generateSemanticVariables('#6b7280', 'neutral', 'light');
    const darkVars = generateSemanticVariables('#6b7280', 'neutral', 'dark');
    // Light neutral fill-loud = step-20 (not step-50 like brand)
    expect(lightVars['--wa-color-neutral-fill-loud']).toBe(
      lightVars['--wa-color-neutral-20']
    );
    // Dark neutral fill-loud = step-90 (not step-50 like brand)
    expect(darkVars['--wa-color-neutral-fill-loud']).toBe(
      darkVars['--wa-color-neutral-90']
    );
    // Dark neutral on-loud = step-05 (not white like brand)
    expect(darkVars['--wa-color-neutral-on-loud']).toBe(
      darkVars['--wa-color-neutral-05']
    );
  });

  it('generates all expected semantic keys', () => {
    const vars = generateSemanticVariables('#3b82f6', 'success', 'light');
    const semanticKeys = [
      'fill-quiet',
      'fill-normal',
      'fill-loud',
      'border-quiet',
      'border-normal',
      'border-loud',
      'on-quiet',
      'on-normal',
      'on-loud',
    ];
    for (const key of semanticKeys) {
      expect(
        vars[`--wa-color-success-${key}`],
        `missing: --wa-color-success-${key}`
      ).toBeDefined();
    }
  });
});

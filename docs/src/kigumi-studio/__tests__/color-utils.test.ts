import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  hexToOklch,
  generateBrandPalette,
  generateBrandVariables,
  PALETTE_STEPS,
} from '../lib/color-utils';

describe('hexToRgb', () => {
  it('converts 6-digit hex to RGB [0-1]', () => {
    const [r, g, b] = hexToRgb('#ff0000');
    expect(r).toBeCloseTo(1, 2);
    expect(g).toBeCloseTo(0, 2);
    expect(b).toBeCloseTo(0, 2);
  });

  it('converts 3-digit hex to RGB', () => {
    const [r, g, b] = hexToRgb('#fff');
    expect(r).toBeCloseTo(1, 2);
    expect(g).toBeCloseTo(1, 2);
    expect(b).toBeCloseTo(1, 2);
  });

  it('handles hex without hash', () => {
    const [r, g, b] = hexToRgb('0071ec');
    expect(r).toBeCloseTo(0, 1);
    expect(g).toBeCloseTo(0.443, 1);
    expect(b).toBeCloseTo(0.925, 1);
  });
});

describe('hexToOklch', () => {
  it('converts white to high lightness, zero chroma', () => {
    const [L, C] = hexToOklch('#ffffff');
    expect(L).toBeCloseTo(1, 1);
    expect(C).toBeCloseTo(0, 1);
  });

  it('converts black to zero lightness, zero chroma', () => {
    const [L, C] = hexToOklch('#000000');
    expect(L).toBeCloseTo(0, 1);
    expect(C).toBeCloseTo(0, 1);
  });

  it('converts a saturated blue to expected OKLCH range', () => {
    const [L, C, H] = hexToOklch('#0071ec');
    expect(L).toBeGreaterThan(0.4);
    expect(L).toBeLessThan(0.7);
    expect(C).toBeGreaterThan(0.1);
    expect(H).toBeGreaterThan(200);
    expect(H).toBeLessThan(280);
  });

  it('converts red to hue around 25-30', () => {
    const [, , H] = hexToOklch('#ff0000');
    expect(H).toBeGreaterThan(15);
    expect(H).toBeLessThan(35);
  });
});

describe('generateBrandPalette', () => {
  it('generates all 11 palette steps', () => {
    const palette = generateBrandPalette('#0071ec');
    expect(Object.keys(palette)).toHaveLength(11);
    for (const step of PALETTE_STEPS) {
      expect(palette[step]).toBeDefined();
      expect(palette[step]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('produces darker colors for lower steps and lighter for higher', () => {
    const palette = generateBrandPalette('#3b82f6');
    // Step 05 should be very dark, step 95 very light
    const dark = hexToOklch(palette['05']);
    const light = hexToOklch(palette['95']);
    expect(dark[0]).toBeLessThan(0.3);
    expect(light[0]).toBeGreaterThan(0.9);
  });

  it('preserves approximate hue across steps', () => {
    const palette = generateBrandPalette('#e32720'); // red
    const hues = PALETTE_STEPS.filter((s) => s !== '05' && s !== '95') // extremes may shift hue
      .map((step) => hexToOklch(palette[step])[2]);

    // All hues should be within 30 degrees of each other
    const minH = Math.min(...hues);
    const maxH = Math.max(...hues);
    expect(maxH - minH).toBeLessThan(30);
  });

  it('handles pure black gracefully', () => {
    const palette = generateBrandPalette('#000000');
    for (const step of PALETTE_STEPS) {
      expect(palette[step]).toMatch(/^#[0-9a-f]{6}$/);
    }
    // Step 05 should still be very dark
    const dark = hexToOklch(palette['05']);
    expect(dark[0]).toBeLessThan(0.3);
  });

  it('handles pure white gracefully', () => {
    const palette = generateBrandPalette('#ffffff');
    for (const step of PALETTE_STEPS) {
      expect(palette[step]).toMatch(/^#[0-9a-f]{6}$/);
    }
    // Step 95 should still be very light
    const light = hexToOklch(palette['95']);
    expect(light[0]).toBeGreaterThan(0.9);
  });

  it('handles highly saturated colors without NaN', () => {
    const colors = [
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#ff00ff',
      '#ffff00',
      '#00ffff',
    ];
    for (const color of colors) {
      const palette = generateBrandPalette(color);
      for (const step of PALETTE_STEPS) {
        expect(palette[step]).toMatch(/^#[0-9a-f]{6}$/);
        // Ensure no NaN leaked into hex
        expect(palette[step]).not.toContain('NaN');
      }
    }
  });
});

describe('generateBrandVariables', () => {
  it('generates palette step variables for light mode', () => {
    const vars = generateBrandVariables('#3b82f6', 'light');
    for (const step of PALETTE_STEPS) {
      expect(vars[`--wa-color-brand-${step}`]).toBeDefined();
      expect(vars[`--wa-color-brand-${step}`]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('generates semantic fill/border/on variables', () => {
    const vars = generateBrandVariables('#3b82f6', 'light');
    expect(vars['--wa-color-brand-fill-loud']).toBeDefined();
    expect(vars['--wa-color-brand-fill-normal']).toBeDefined();
    expect(vars['--wa-color-brand-fill-quiet']).toBeDefined();
    expect(vars['--wa-color-brand-border-loud']).toBeDefined();
    expect(vars['--wa-color-brand-border-normal']).toBeDefined();
    expect(vars['--wa-color-brand-border-quiet']).toBeDefined();
    expect(vars['--wa-color-brand-on-loud']).toBe('white');
    expect(vars['--wa-color-brand-on-normal']).toBeDefined();
    expect(vars['--wa-color-brand-on-quiet']).toBeDefined();
  });

  it('generates --wa-color-focus as step-60 for both modes', () => {
    const lightVars = generateBrandVariables('#3b82f6', 'light');
    const darkVars = generateBrandVariables('#3b82f6', 'dark');
    // Both modes use step-60 per WA default.css
    expect(lightVars['--wa-color-focus']).toBe(
      lightVars['--wa-color-brand-60']
    );
    expect(darkVars['--wa-color-focus']).toBe(darkVars['--wa-color-brand-60']);
  });

  it('includes --wa-color-brand as the original color', () => {
    const vars = generateBrandVariables('#ff5722', 'light');
    expect(vars['--wa-color-brand']).toBe('#ff5722');
  });

  it('uses direct step references for fills and borders (WA default)', () => {
    const lightVars = generateBrandVariables('#3b82f6', 'light');
    // WA default uses direct hex values, not color-mix
    expect(lightVars['--wa-color-brand-fill-quiet']).toBe(
      lightVars['--wa-color-brand-95']
    );
    expect(lightVars['--wa-color-brand-border-quiet']).toBe(
      lightVars['--wa-color-brand-90']
    );
  });

  it('dark mode uses different step mappings than light', () => {
    const lightVars = generateBrandVariables('#3b82f6', 'light');
    const darkVars = generateBrandVariables('#3b82f6', 'dark');
    // fill-loud: both light and dark use step-50 per WA default
    expect(lightVars['--wa-color-brand-fill-loud']).toBe(
      lightVars['--wa-color-brand-50']
    );
    expect(darkVars['--wa-color-brand-fill-loud']).toBe(
      darkVars['--wa-color-brand-50']
    );
    // fill-quiet: light uses step-95, dark uses step-10
    expect(lightVars['--wa-color-brand-fill-quiet']).toBe(
      lightVars['--wa-color-brand-95']
    );
    expect(darkVars['--wa-color-brand-fill-quiet']).toBe(
      darkVars['--wa-color-brand-10']
    );
  });
});

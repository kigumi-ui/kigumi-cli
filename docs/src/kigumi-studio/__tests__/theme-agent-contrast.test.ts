import { describe, it, expect } from 'vitest';
import { checkContrast } from '../theme-agent/contrast';
import type { CustomTheme } from '../theme-agent/custom-theme';

// Every checked colour set explicitly, and none equal to its Studio default,
// so the preview does not derive surfaces or text from neutral instead.
function readableTheme(): CustomTheme {
  return {
    light: {
      '--wa-color-brand': '#7c3aed',
      '--wa-color-surface-raised': '#fdfdfd',
      '--wa-color-surface-default': '#fafafa',
      '--wa-color-surface-lowered': '#f2f2f2',
      '--wa-color-text-normal': '#1a1a1a',
      '--wa-color-text-quiet': '#595959',
      '--wa-color-text-link': '#0050b3',
      '--wa-form-control-background-color': '#fdfdfd',
      '--wa-form-control-border-color': '#767676',
    },
    dark: {
      '--wa-color-brand': '#7c3aed',
      '--wa-color-surface-raised': '#1e1e1e',
      '--wa-color-surface-default': '#181818',
      '--wa-color-surface-lowered': '#101010',
      '--wa-color-text-normal': '#f0f0f0',
      '--wa-color-text-quiet': '#b0b0b0',
      '--wa-color-text-link': '#8cb4ff',
      '--wa-form-control-background-color': '#181818',
      '--wa-form-control-border-color': '#8a8a8a',
    },
    shadowComponents: [],
  };
}

describe('Theme Agent contrast check', () => {
  it('passes a theme whose every pair is readable in both modes', () => {
    expect(checkContrast(readableTheme())).toEqual([]);
  });

  it('reports quiet text below 4.5:1 with its pair, mode and ratio', () => {
    const theme = readableTheme();
    theme.light['--wa-color-surface-raised'] = '#ffffff';
    // #949494 on white is 3.03:1.
    theme.light['--wa-color-text-quiet'] = '#949494';

    const violations = checkContrast(theme);

    const raised = violations.find(
      (v) => v.background === '--wa-color-surface-raised'
    );
    expect(raised).toMatchObject({
      mode: 'light',
      foreground: '--wa-color-text-quiet',
      minimum: 4.5,
    });
    expect(raised?.ratio).toBeCloseTo(3.03, 2);
    expect(violations.every((v) => v.mode === 'light')).toBe(true);
  });

  it('checks dark mode on its own', () => {
    const theme = readableTheme();
    theme.dark['--wa-color-text-normal'] = '#333333';

    const violations = checkContrast(theme);

    expect(violations.map((v) => [v.mode, v.foreground, v.background])).toEqual(
      [
        ['dark', '--wa-color-text-normal', '--wa-color-surface-raised'],
        ['dark', '--wa-color-text-normal', '--wa-color-surface-default'],
        ['dark', '--wa-color-text-normal', '--wa-color-surface-lowered'],
      ]
    );
  });

  it('resolves oklch colours', () => {
    const theme = readableTheme();
    theme.light['--wa-color-surface-raised'] = '#ffffff';
    // An OKLCH grey at lightness 0.7 has luminance 0.7³ = 0.343: 2.67:1 on white.
    theme.light['--wa-color-text-normal'] = 'oklch(70% 0 0)';

    const raised = checkContrast(theme).find(
      (v) =>
        v.foreground === '--wa-color-text-normal' &&
        v.background === '--wa-color-surface-raised'
    );
    expect(raised?.ratio).toBeCloseTo(2.67, 2);

    theme.light['--wa-color-text-normal'] = 'oklch(0.2 0.02 250)';
    expect(checkContrast(theme)).toEqual([]);
  });

  it('reads every CSS hue unit in oklch colours', () => {
    const ratioFor = (link: string) => {
      const theme = readableTheme();
      theme.light['--wa-color-surface-raised'] = '#ffffff';
      theme.light['--wa-color-text-link'] = link;
      return checkContrast(theme).find(
        (v) =>
          v.foreground === '--wa-color-text-link' &&
          v.background === '--wa-color-surface-raised'
      )?.ratio;
    };
    // A light green, hue 140deg: it fails on white, at the same ratio in
    // every unit that names that hue.
    const expected = ratioFor('oklch(0.8 0.15 140deg)');
    expect(expected).toBeLessThan(4.5);
    expect(ratioFor('oklch(0.8 0.15 140)')).toBeCloseTo(expected!, 6);
    expect(ratioFor('oklch(0.8 0.15 0.388889turn)')).toBeCloseTo(expected!, 3);
    expect(ratioFor('oklch(0.8 0.15 2.443461rad)')).toBeCloseTo(expected!, 3);
    expect(ratioFor('oklch(0.8 0.15 155.5556grad)')).toBeCloseTo(expected!, 3);
    // An unknown unit is not guessed at.
    expect(ratioFor('oklch(0.8 0.15 140foo)')).toBeNull();
  });

  it('holds the form control border to 3:1 against its background', () => {
    const theme = readableTheme();
    // #8f8f8f on #fdfdfd is 3.2:1, enough for a border, not for text.
    theme.light['--wa-form-control-border-color'] = '#8f8f8f';
    expect(checkContrast(theme)).toEqual([]);

    theme.light['--wa-form-control-border-color'] = '#c4c4c4';
    expect(checkContrast(theme)).toEqual([
      expect.objectContaining({
        mode: 'light',
        foreground: '--wa-form-control-border-color',
        background: '--wa-form-control-background-color',
        minimum: 3,
      }),
    ]);
  });

  it('checks the brand fill the preview paints against its on-colour', () => {
    const theme = readableTheme();
    // A teal brand: Studio's fill for it carries white text at under 4.5:1.
    theme.light['--wa-color-brand'] = '#0891b2';
    theme.dark['--wa-color-brand'] = '#0891b2';

    const violations = checkContrast(theme);

    expect(violations.map((v) => [v.mode, v.foreground, v.background])).toEqual(
      [
        ['light', '--wa-color-brand-on-loud', '--wa-color-brand-fill-loud'],
        ['dark', '--wa-color-brand-on-loud', '--wa-color-brand-fill-loud'],
      ]
    );
    expect(violations[0].ratio).toBeLessThan(4.5);
  });

  it('reports a colour it cannot resolve instead of passing it', () => {
    const theme = readableTheme();
    theme.dark['--wa-color-surface-lowered'] = 'color(display-p3 0 0 0)';

    expect(checkContrast(theme)).toEqual([
      expect.objectContaining({
        mode: 'dark',
        background: '--wa-color-surface-lowered',
        ratio: null,
      }),
      expect.objectContaining({ ratio: null }),
      expect.objectContaining({ ratio: null }),
    ]);
  });
});

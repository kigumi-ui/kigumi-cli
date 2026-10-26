import { describe, it, expect } from 'vitest';
import {
  CONTRAST_PAIRS,
  checkContrast,
  correctableViolations,
  lockedSources,
  type ContrastViolation,
} from '../theme-agent/contrast';
import { NO_LOCKS, valueLock, withLocks } from '../lib/locks';
import type { CustomTheme } from '../theme-agent/custom-theme';
import { BRANDS_UNDER_AA_AT_STEP_50 } from './brand-fill-fixtures';

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
    expect(CONTRAST_PAIRS).toContainEqual(
      expect.objectContaining({
        foreground: '--wa-color-brand-on-loud',
        background: '--wa-color-brand-fill-loud',
        minimum: 4.5,
        setBy: '--wa-color-brand',
      })
    );
  });

  it.each(BRANDS_UNDER_AA_AT_STEP_50)(
    'passes the brand fill for %s in both modes',
    (brand) => {
      const theme = readableTheme();
      theme.light['--wa-color-brand'] = brand;
      theme.dark['--wa-color-brand'] = brand;
      expect(checkContrast(theme)).toEqual([]);
    }
  );

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

describe('Theme Agent contrast: which violations go back to the model', () => {
  function violation(overrides: Partial<ContrastViolation>): ContrastViolation {
    return {
      mode: 'light',
      foreground: '--wa-color-text-quiet',
      background: '--wa-color-surface-raised',
      label: 'quiet text on the raised surface',
      foregroundColor: '#aaaaaa',
      backgroundColor: '#fdfdfd',
      ratio: 2.3,
      minimum: 4.5,
      ...overrides,
    };
  }

  it('sends back a pair the theme sets itself', () => {
    const quiet = violation({});
    expect(correctableViolations([quiet], [quiet])).toEqual([quiet]);
  });

  it('never sends back a pair another value sets, such as the brand fill', () => {
    const pair = CONTRAST_PAIRS.find((p) => p.setBy);
    if (!pair) throw new Error('no checked pair is set by another value');
    const brandFill = violation({ ...pair, ratio: 4.2 });
    expect(correctableViolations([brandFill], [brandFill])).toEqual([]);
  });

  it('leaves out a pair the held values fix', () => {
    const quiet = violation({});
    const dark = violation({ mode: 'dark' });
    expect(correctableViolations([quiet, dark], [dark])).toEqual([dark]);
  });
});

describe('Theme Agent contrast: locked values behind a violation', () => {
  function paleQuiet() {
    const theme = readableTheme();
    theme.light['--wa-color-text-quiet'] = '#aaaaaa';
    const violation = checkContrast(theme).find(
      (v) => v.background === '--wa-color-surface-raised'
    );
    if (!violation) throw new Error('quiet text on raised does not fail');
    return violation;
  }
  const quietText = valueLock('--wa-color-text-quiet', ['light']);
  const raised = valueLock('--wa-color-surface-raised', ['light']);

  it('names both colours when the user locked both, so the agent may not fix it', () => {
    expect(
      lockedSources(paleQuiet(), withLocks(quietText, raised, true))
    ).toEqual(['--wa-color-text-quiet', '--wa-color-surface-raised']);
  });

  it('names none while one colour of the pair is free to change', () => {
    expect(lockedSources(paleQuiet(), quietText)).toEqual([]);
    expect(lockedSources(paleQuiet(), NO_LOCKS)).toEqual([]);
  });

  it('reads the lock in the mode that fails', () => {
    const darkOnly = withLocks(
      valueLock('--wa-color-text-quiet', ['dark']),
      valueLock('--wa-color-surface-raised', ['dark']),
      true
    );
    expect(lockedSources(paleQuiet(), darkOnly)).toEqual([]);
  });

  it('names the colours locked in dark mode for a dark mode pair', () => {
    const theme = readableTheme();
    theme.dark['--wa-color-text-quiet'] = '#3a3a3a';
    const violation = checkContrast(theme).find(
      (v) => v.mode === 'dark' && v.background === '--wa-color-surface-raised'
    );
    if (!violation) throw new Error('dark quiet text on raised does not fail');
    const darkLocks = withLocks(
      valueLock('--wa-color-text-quiet', ['dark']),
      valueLock('--wa-color-surface-raised', ['dark']),
      true
    );
    expect(lockedSources(violation, darkLocks)).toEqual([
      '--wa-color-text-quiet',
      '--wa-color-surface-raised',
    ]);
  });

  it('names the brand behind the brand fill', () => {
    // No brand fails the brand fill today; the pair is still checked, so a
    // failing one names the value that sets it.
    const pair = CONTRAST_PAIRS.find((p) => p.setBy);
    if (!pair) throw new Error('no checked pair is set by another value');
    const brandFill: ContrastViolation = {
      ...pair,
      mode: 'light',
      foregroundColor: 'white',
      backgroundColor: '#1478f2',
      ratio: 4.2,
    };
    expect(
      lockedSources(brandFill, valueLock('--wa-color-brand', ['light', 'dark']))
    ).toEqual(['--wa-color-brand']);
  });
});

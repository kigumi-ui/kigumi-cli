import { describe, it, expect } from 'vitest';
import {
  CONTRAST_PAIRS,
  checkContrast,
  contrastResults,
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

describe('Contrast results: every checked pair, passing or not', () => {
  it("passes every pair on Studio's defaults, both modes", () => {
    const untouched = {
      light: {},
      dark: {},
      shadowComponents: [],
      customCSS: '',
    };
    expect(
      contrastResults(untouched)
        .filter((result) => !result.passes)
        .map((result) => `${result.mode} ${result.label}`)
    ).toEqual([]);
  });

  it('returns every pair in both modes, light first, in CONTRAST_PAIRS order', () => {
    const results = contrastResults(readableTheme());

    // Three texts on three surfaces, the form control border, the brand fill.
    expect(CONTRAST_PAIRS).toHaveLength(11);
    expect(results).toHaveLength(CONTRAST_PAIRS.length * 2);
    expect(results.map((result) => `${result.mode} ${result.label}`)).toEqual(
      (['light', 'dark'] as const).flatMap((mode) =>
        CONTRAST_PAIRS.map((pair) => `${mode} ${pair.label}`)
      )
    );
    expect(results.every((result) => result.passes)).toBe(true);
  });

  it('marks a failing pair, and checkContrast() is exactly the failing ones', () => {
    const theme = readableTheme();
    theme.light['--wa-color-surface-raised'] = '#ffffff';
    theme.light['--wa-color-text-quiet'] = '#949494';

    const results = contrastResults(theme);
    const failing = results.filter((result) => !result.passes);

    // #949494 is under 4.5:1 on every light surface.
    expect(failing.map((result) => result.label)).toEqual([
      'quiet text on the raised surface',
      'quiet text on the default surface',
      'quiet text on the lowered surface',
    ]);
    // The same violations, with no field of the view's own added.
    const violations = checkContrast(theme);
    expect(violations).toHaveLength(failing.length);
    violations.forEach((violation, index) => {
      expect(Object.keys(violation)).not.toContain('passes');
      expect(Object.keys(violation)).not.toContain('foregroundSwatch');
      expect(failing[index]).toMatchObject(violation);
    });
  });

  it('gives each colour as the swatch paints it', () => {
    const theme = readableTheme();
    theme.light['--wa-color-surface-raised'] = '#ffffff';
    theme.light['--wa-color-text-quiet'] = '#949494';

    const quiet = contrastResults(theme).find(
      (result) =>
        result.mode === 'light' &&
        result.label === 'quiet text on the raised surface'
    );
    expect(quiet).toMatchObject({
      foregroundSwatch: '#949494',
      backgroundSwatch: '#ffffff',
    });

    // The on-colour is the keyword white, the fill a palette step.
    const fill = contrastResults(theme).find(
      (result) => result.background === '--wa-color-brand-fill-loud'
    );
    expect(fill?.foregroundSwatch).toBe('#ffffff');
    expect(fill?.backgroundSwatch).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('counts a colour it cannot resolve as failing, with no swatch', () => {
    const theme = readableTheme();
    theme.dark['--wa-color-surface-lowered'] = 'color(display-p3 0 0 0)';

    const lowered = contrastResults(theme).filter(
      (result) =>
        result.mode === 'dark' &&
        result.background === '--wa-color-surface-lowered'
    );
    expect(lowered).toHaveLength(3);
    for (const result of lowered) {
      expect(result).toMatchObject({
        passes: false,
        ratio: null,
        backgroundSwatch: null,
      });
      expect(result.foregroundSwatch).not.toBeNull();
    }
  });

  it('keeps a translucent colour translucent in its swatch', () => {
    const theme = readableTheme();
    theme.light['--wa-color-text-quiet'] = 'rgb(0 0 0 / 50%)';

    const quiet = contrastResults(theme).find(
      (result) =>
        result.mode === 'light' && result.foreground === '--wa-color-text-quiet'
    );
    expect(quiet?.foregroundSwatch).toBe('rgb(0 0 0 / 0.5)');
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

  it('sends back the brand fill pair, set or unset: the fill fixes it, not the brand', () => {
    const pair = CONTRAST_PAIRS.find(
      (p) => p.background === '--wa-color-brand-fill-loud'
    );
    if (!pair) throw new Error('the brand fill pair is not checked');
    const brandFill = violation({ ...pair, ratio: 4.2 });
    expect(correctableViolations([brandFill], [brandFill])).toEqual([
      brandFill,
    ]);
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

  it('names the locked fill behind an unset brand fill, never the brand', () => {
    // No brand fails the fill Studio derives today; the pair is still
    // checked, so a failing one names the value that fixes it: the fill.
    const pair = CONTRAST_PAIRS.find(
      (p) => p.background === '--wa-color-brand-fill-loud'
    );
    if (!pair) throw new Error('the brand fill pair is not checked');
    const brandFill: ContrastViolation = {
      ...pair,
      mode: 'light',
      foregroundColor: 'white',
      backgroundColor: '#1478f2',
      ratio: 4.2,
    };
    expect(
      lockedSources(
        brandFill,
        valueLock('--wa-color-brand-fill-loud', ['light'])
      )
    ).toEqual(['--wa-color-brand-fill-loud']);
    expect(
      lockedSources(brandFill, valueLock('--wa-color-brand', ['light', 'dark']))
    ).toEqual([]);
  });
});

describe('Theme Agent contrast: a brand fill the user set', () => {
  const FILL = '--wa-color-brand-fill-loud';

  function withLightFill(fill: string): CustomTheme {
    const theme = readableTheme();
    theme.light[FILL] = fill;
    return theme;
  }

  it('reports a set fill that fails under white text as its own pair', () => {
    // #22c55e carries white text at about 2.3:1.
    const violations = checkContrast(withLightFill('#22c55e'));

    expect(violations).toEqual([
      expect.objectContaining({
        mode: 'light',
        foreground: '--wa-color-brand-on-loud',
        background: FILL,
        foregroundColor: 'white',
        backgroundColor: '#22c55e',
      }),
    ]);
    expect(violations[0].ratio).toBeLessThan(4.5);
  });

  it('passes a set fill that carries white text', () => {
    expect(checkContrast(withLightFill('#003d82'))).toEqual([]);
  });

  it('sends a failing set fill back to the model to correct', () => {
    const violations = checkContrast(withLightFill('#22c55e'));
    expect(correctableViolations(violations, violations)).toEqual(violations);
  });

  it('names the fill when the user locked it, not the brand', () => {
    const [violation] = checkContrast(withLightFill('#22c55e'));
    const fillLocked = withLocks(NO_LOCKS, valueLock(FILL, ['light']), true);
    const brandLocked = withLocks(
      NO_LOCKS,
      valueLock('--wa-color-brand', ['light']),
      true
    );

    expect(lockedSources(violation, fillLocked)).toEqual([FILL]);
    expect(lockedSources(violation, brandLocked)).toEqual([]);
    expect(lockedSources(violation, NO_LOCKS)).toEqual([]);
  });
});

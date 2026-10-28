import { describe, it, expect } from 'vitest';
import { generateBrandVariables } from '../lib/color-utils';
import {
  buildDefaultValues,
  DEFAULT_VALUES,
  type ThemeValue,
} from '../lib/defaults';
import { buildPreviewStyle } from '../lib/preview-style';
import { modifiedProperties } from '../lib/css-generator';
import { themeEdits, themeFiles, themeText } from '../lib/theme-css';
import { validateProposal } from '../theme-agent/proposal';

const FILL = '--wa-color-brand-fill-loud';
const BRAND = '--wa-color-brand';

function theme(
  edits: Record<string, Partial<ThemeValue>> = {}
): Record<string, ThemeValue> {
  const values = buildDefaultValues();
  // Web Awesome's dark form control border, Studio's default when #202's
  // export was recorded, so the export holds only what the brand writes.
  values['--wa-form-control-border-color'].dark = '#545868';
  for (const [cssVar, modes] of Object.entries(edits)) {
    values[cssVar] = { ...values[cssVar], ...modes };
  }
  return values;
}

describe('brand fill: preview', () => {
  it('follows the brand while unset', () => {
    const red = theme({ [BRAND]: { light: '#dc2626', dark: '#dc2626' } });
    for (const mode of ['light', 'dark'] as const) {
      expect(buildPreviewStyle(red, mode)[FILL]).toBe(
        generateBrandVariables('#dc2626', mode)[FILL]
      );
    }
  });

  it('paints a set fill in its own mode only', () => {
    const values = theme({
      [BRAND]: { light: '#dc2626', dark: '#dc2626' },
      [FILL]: { light: '#7a1010' },
    });
    expect(buildPreviewStyle(values, 'light')[FILL]).toBe('#7a1010');
    expect(buildPreviewStyle(values, 'dark')[FILL]).toBe(
      generateBrandVariables('#dc2626', 'dark')[FILL]
    );
  });
});

/**
 * theme.css for a #dc2626 brand as #202 (PR #224) wrote it, recorded from
 * origin/main before the brand fill became a Studio value.
 */
const RED_BRAND_THEME_CSS =
  ':root {\n  --wa-color-brand: #dc2626;\n  --wa-color-brand-05: #2e0001;\n  --wa-color-brand-10: #450002;\n  --wa-color-brand-20: #6c0005;\n  --wa-color-brand-30: #90000a;\n  --wa-color-brand-40: #b70010;\n  --wa-color-brand-50: #e02e2c;\n  --wa-color-brand-60: #fa6257;\n  --wa-color-brand-70: #ff9084;\n  --wa-color-brand-80: #ffb7ae;\n  --wa-color-brand-90: #ffddd8;\n  --wa-color-brand-95: #ffefed;\n  --wa-color-brand-border-loud: #fa6257;\n  --wa-color-brand-border-normal: #ffb7ae;\n  --wa-color-brand-border-quiet: #ffddd8;\n  --wa-color-brand-fill-loud: #b70010;\n  --wa-color-brand-fill-normal: #ffddd8;\n  --wa-color-brand-fill-quiet: #ffefed;\n  --wa-color-brand-on-loud: white;\n  --wa-color-brand-on-normal: #90000a;\n  --wa-color-brand-on-quiet: #b70010;\n  --wa-color-focus: #fa6257;\n  --wa-color-text-link: #b70010;\n}\n\n.wa-dark {\n  --wa-color-brand: #dc2626;\n  --wa-color-brand-border-loud: #b70010;\n  --wa-color-brand-border-normal: #90000a;\n  --wa-color-brand-border-quiet: #6c0005;\n  --wa-color-brand-fill-loud: #b70010;\n  --wa-color-brand-fill-normal: #6c0005;\n  --wa-color-brand-fill-quiet: #450002;\n  --wa-color-brand-on-loud: white;\n  --wa-color-brand-on-normal: #ff9084;\n  --wa-color-brand-on-quiet: #fa6257;\n  --wa-color-focus: #fa6257;\n  --wa-color-text-link: #ff9084;\n}\n';

function themeCSS(values: Record<string, ThemeValue>): string {
  return themeFiles({ values, shadowComponents: [], customCSS: null }).theme;
}

describe('brand fill: export', () => {
  it('writes nothing for the default theme', () => {
    expect(themeCSS(theme())).toBe('');
  });

  it('writes what #202 wrote while unset', () => {
    const red = theme({ [BRAND]: { light: '#dc2626', dark: '#dc2626' } });
    expect(themeCSS(red)).toBe(RED_BRAND_THEME_CSS);
  });

  it.each(['light', 'dark'] as const)(
    'writes a fill set in %s mode there and the derived one in the other',
    (mode) => {
      const exported = modifiedProperties(
        theme({
          [BRAND]: { light: '#dc2626', dark: '#dc2626' },
          [FILL]: { [mode]: '#7a1010' },
        })
      );
      const other = mode === 'light' ? 'dark' : 'light';
      expect(exported[mode][FILL]).toBe('#7a1010');
      // #b70010 is the red brand's step 40, as #202 wrote it.
      expect(exported[other][FILL]).toBe('#b70010');
    }
  );

  it('writes both modes for a set fill with the default brand', () => {
    // Without the dark one, a project's :root fill would paint dark mode too.
    const { light, dark } = modifiedProperties(
      theme({ [FILL]: { light: '#003d82' } })
    );
    expect(light[FILL]).toBe('#003d82');
    expect(dark[FILL]).toBe(
      generateBrandVariables(DEFAULT_VALUES[BRAND].dark, 'dark')[FILL]
    );
    expect(light[BRAND]).toBeUndefined();
  });
});

describe('brand fill: import through the Theme CSS text', () => {
  const red = theme({ [BRAND]: { light: '#dc2626', dark: '#dc2626' } });
  const text = (values: Record<string, ThemeValue>) =>
    themeText({ values, shadowComponents: [], customCSS: null });

  it('sets a fill the text names', () => {
    const before = text(red);
    const [root, darkBlock] = before.split('.wa-dark {');
    const after = `${root}.wa-dark {${darkBlock.replace(
      '--wa-color-brand-fill-loud: #b70010;',
      '--wa-color-brand-fill-loud: #7a1010;'
    )}`;
    expect(themeEdits(before, after).values).toEqual({
      [FILL]: { dark: '#7a1010' },
    });
  });

  it('keeps a pasted fill declaration as a set value, the derived colour too', () => {
    // Pasting another theme's export over the text: the fill it names is set.
    const green = theme({ [BRAND]: { light: '#16a34a', dark: '#16a34a' } });
    const edits = themeEdits(text(red), text(green)).values;
    expect(edits[FILL]).toEqual({ light: '#007530', dark: '#007530' });
    expect(edits[BRAND]).toEqual({ light: '#16a34a', dark: '#16a34a' });
  });

  it('restores a fill set per mode from its own export, with no warning', () => {
    const set = theme({
      [BRAND]: { light: '#dc2626', dark: '#dc2626' },
      [FILL]: { light: '#7a1010', dark: '#e05050' },
    });
    const edits = themeEdits(text(theme()), text(set));
    expect(edits.values[FILL]).toEqual({ light: '#7a1010', dark: '#e05050' });
    expect(edits.warnings).toEqual([]);
  });

  it('leaves the fill unset when only the brand changes', () => {
    const before = text(red);
    const after = before.replaceAll(
      '--wa-color-brand: #dc2626;',
      '--wa-color-brand: #16a34a;'
    );
    expect(themeEdits(before, after).values).toEqual({
      [BRAND]: { light: '#16a34a', dark: '#16a34a' },
    });
  });

  it('unsets a fill whose line is removed', () => {
    const set = theme({ [FILL]: { light: '#003d82' } });
    const before = text(set);
    const after = before.replace(
      '  --wa-color-brand-fill-loud: #003d82;\n',
      ''
    );
    expect(themeEdits(before, after).values[FILL]).toEqual({ light: '' });
  });
});

describe('brand fill: a Theme Agent proposal', () => {
  it('may unset the fill, so it follows the brand again', () => {
    expect(validateProposal({ light: { [FILL]: '' }, dark: {} })).toEqual({
      valid: true,
      proposal: { light: { [FILL]: '' }, dark: {} },
    });
  });

  it('may not leave any other colour empty', () => {
    expect(
      validateProposal({ light: { '--wa-color-text-link': '' }, dark: {} })
    ).toMatchObject({ valid: false });
  });
});

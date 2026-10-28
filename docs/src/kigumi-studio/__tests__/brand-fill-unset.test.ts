import { describe, it, expect } from 'vitest';
import { buildDefaultValues, DEFAULT_VALUES } from '../lib/defaults';
import { buildPreviewStyle } from '../lib/preview-style';
import { themeFiles } from '../lib/theme-css';
import { checkContrast } from '../theme-agent/contrast';
import type { CustomTheme } from '../theme-agent/custom-theme';
import { BRANDS_UNDER_AA_AT_STEP_50 } from './brand-fill-fixtures';
// Recorded on origin/main (ce389ba8), before the brand fill became a Studio
// value: per brand, the preview style in both modes, theme.css, and the
// contrast check of Studio's defaults with that brand.
import baseline from './brand-fill-unset-baseline.json';

const BRANDS = [
  ...new Set([...BRANDS_UNDER_AA_AT_STEP_50, '#dc2626', '#7c3aed']),
];

describe('brand fill: unset, every value is what #202 produced', () => {
  it('covers every brand fixture', () => {
    expect(Object.keys(baseline)).toEqual(BRANDS);
  });

  it.each(BRANDS)('for %s: preview, export and contrast check', (brand) => {
    const values = buildDefaultValues();
    values['--wa-color-brand'] = { light: brand, dark: brand };
    const theme: CustomTheme = {
      light: {},
      dark: {},
      shadowComponents: [],
      customCSS: '',
    };
    for (const cssVar of Object.keys(DEFAULT_VALUES)) {
      theme.light[cssVar] = values[cssVar].light;
      theme.dark[cssVar] = values[cssVar].dark;
    }
    const recorded = baseline[brand as keyof typeof baseline];

    // The new value itself is '' in the style object until the brand's
    // derivation replaces it, so every key and value match the recording.
    expect(buildPreviewStyle(values, 'light')).toEqual(recorded.preview.light);
    expect(buildPreviewStyle(values, 'dark')).toEqual(recorded.preview.dark);
    expect(
      themeFiles({ values, shadowComponents: [], customCSS: null }).theme
    ).toBe(recorded.export);
    expect(checkContrast(theme)).toEqual(recorded.contrast);
  });
});

import { describe, it, expect } from 'vitest';
import {
  generateBrandVariables,
  contrastRatio,
  generateSemanticVariables,
  type SemanticColorGroup,
} from '../lib/color-utils';
import { generateThemeCSS, modifiedProperties } from '../lib/css-generator';
import { buildDefaultValues } from '../lib/defaults';
import {
  BRANDS_UNDER_AA_AT_STEP_50,
  DEFAULT_BRAND,
} from './brand-fill-fixtures';

describe('generateThemeCSS', () => {
  it('generates :root block with one property', () => {
    const result = generateThemeCSS({ '--wa-color-brand': '#ff0000' }, {}, {});
    expect(result).toContain(':root {');
    expect(result).toContain('--wa-color-brand: #ff0000;');
    expect(result).not.toContain('.wa-dark');
  });

  it('generates :root and .wa-dark blocks with separate properties', () => {
    const result = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      { '--wa-color-surface-default': '#101219' },
      {}
    );
    expect(result).toContain(':root {');
    expect(result).toContain('--wa-color-brand: #ff0000;');
    expect(result).toContain('.wa-dark {');
    expect(result).toContain('--wa-color-surface-default: #101219;');
  });

  it('returns empty string when no properties provided', () => {
    const result = generateThemeCSS({}, {});
    expect(result).toBe('');
  });

  it('handles only dark mode properties', () => {
    const result = generateThemeCSS(
      {},
      { '--wa-color-surface-raised': '#1a1a2e' },
      {}
    );
    expect(result).not.toContain(':root');
    expect(result).toContain('.wa-dark {');
    expect(result).toContain('--wa-color-surface-raised: #1a1a2e;');
  });

  it('handles complex values with parentheses', () => {
    const result = generateThemeCSS(
      {
        '--wa-link-decoration-default':
          'underline color-mix(in oklab, currentColor 70%, transparent) dotted',
      },
      {},
      {}
    );
    expect(result).toContain(
      'underline color-mix(in oklab, currentColor 70%, transparent) dotted'
    );
  });

  it('formats multiple properties with proper indentation', () => {
    const result = generateThemeCSS(
      {
        '--wa-color-brand': '#ff0000',
        '--wa-border-style': 'dashed',
        '--wa-space-scale': '1.5',
      },
      {},
      {}
    );
    const lines = result.split('\n');
    // Should have :root {, 3 properties, }
    expect(lines.filter((l) => l.startsWith('  --wa-'))).toHaveLength(3);
  });

  it('ends output with a newline', () => {
    const result = generateThemeCSS({ '--wa-color-brand': '#ff0000' }, {}, {});
    expect(result.endsWith('\n')).toBe(true);
  });

  it('generates shadow component rules', () => {
    const result = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      { shadowComponents: ['Card', 'Badge'] }
    );
    expect(result).toContain('/* Component Shadows */');
    expect(result).toContain('.Card {\n  box-shadow: var(--wa-shadow-m);\n}');
    expect(result).toContain('.Badge {\n  box-shadow: var(--wa-shadow-m);\n}');
  });

  it('puts a shadow on the part that draws the component, where the host does not', () => {
    const result = generateThemeCSS(
      {},
      {},
      { shadowComponents: ['Button', 'Switch', 'Dialog'] }
    );
    expect(result).toBe(
      `/* Component Shadows */
.Button::part(base) {
  box-shadow: var(--wa-shadow-m);
}

.Switch::part(control) {
  box-shadow: var(--wa-shadow-m);
}

.Dialog::part(dialog) {
  box-shadow: var(--wa-shadow-m);
}
`
    );
  });

  it('writes no shadow rule for a component that is not in the list', () => {
    const result = generateThemeCSS(
      {},
      {},
      { shadowComponents: ['Menu', 'Popup', 'Card'] }
    );
    expect(result).toBe(
      '/* Component Shadows */\n.Card {\n  box-shadow: var(--wa-shadow-m);\n}\n'
    );
  });

  it('combines shadow color and opacity into rgb()', () => {
    const result = generateThemeCSS(
      {
        '--wa-color-shadow': '#000000',
        '--wa-shadow-opacity': '0.2',
      },
      {},
      {}
    );
    expect(result).toContain('--wa-color-shadow: rgb(0 0 0 / 0.2)');
    expect(result).not.toContain('--wa-shadow-opacity');
  });
});

describe('modifiedProperties', () => {
  const PALETTE_STEP = /-\d{2}$/;

  /** Default values with one colour edited in one mode. */
  function edit(cssVar: string, mode: 'light' | 'dark', hex: string) {
    const values = buildDefaultValues();
    values[cssVar] = { ...values[cssVar], [mode]: hex };
    return values;
  }

  it("writes, for the defaults, only what Studio sets apart from Web Awesome's", () => {
    // Web Awesome's dark border (#545868) fails 3:1 on its background;
    // Studio's passes, and a project only gets it from the export.
    expect(modifiedProperties(buildDefaultValues())).toEqual({
      light: {},
      dark: { '--wa-form-control-border-color': '#717584' },
    });
  });

  it("leaves out a value set back to Web Awesome's own default", () => {
    const values = edit('--wa-form-control-border-color', 'dark', '#545868');
    expect(modifiedProperties(values)).toEqual({ light: {}, dark: {} });
  });

  it('writes a value the user set over a default Studio differs on', () => {
    const values = edit('--wa-form-control-border-color', 'dark', '#8a8a8a');
    expect(modifiedProperties(values).dark).toEqual({
      '--wa-form-control-border-color': '#8a8a8a',
    });
  });

  it('derives the brand palette into :root and only its semantic variables into .wa-dark', () => {
    const hex = '#7b2cbf';
    const { light, dark } = modifiedProperties(
      edit('--wa-color-brand', 'dark', hex)
    );

    // Edited in dark only, the base colour still lands in :root
    expect(light['--wa-color-brand']).toBe(hex);
    expect(light).toMatchObject(generateBrandVariables(hex, 'light'));

    const darkVars = generateBrandVariables(hex, 'dark');
    for (const [key, value] of Object.entries(darkVars)) {
      if (key === '--wa-color-brand') {
        // The edit itself was made in dark mode
        expect(dark[key]).toBe(hex);
      } else if (PALETTE_STEP.test(key)) {
        expect(dark).not.toHaveProperty(key);
      } else {
        expect(dark[key]).toBe(value);
      }
    }
  });

  // The default brand exports nothing: Web Awesome's default theme paints
  // its fill as #0071ec, which carries white text at 4.59:1.
  it.each(BRANDS_UNDER_AA_AT_STEP_50.filter((hex) => hex !== DEFAULT_BRAND))(
    'exports a brand fill that carries white text at 4.5:1 for %s',
    (hex) => {
      const { light, dark } = modifiedProperties(
        edit('--wa-color-brand', 'light', hex)
      );
      for (const vars of [light, dark]) {
        expect(vars['--wa-color-brand-on-loud']).toBe('white');
        expect(
          contrastRatio('#ffffff', vars['--wa-color-brand-fill-loud'])
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  );

  it.each<SemanticColorGroup>(['success', 'warning', 'danger', 'neutral'])(
    'derives the %s palette the same way',
    (group) => {
      const cssVar = `--wa-color-${group}`;
      const hex = '#2a9d8f';
      const { light, dark } = modifiedProperties(edit(cssVar, 'dark', hex));

      expect(light[cssVar]).toBe(hex);
      expect(light).toMatchObject(
        generateSemanticVariables(hex, group, 'light')
      );

      const darkVars = generateSemanticVariables(hex, group, 'dark');
      for (const [key, value] of Object.entries(darkVars)) {
        if (key === cssVar) {
          expect(dark[key]).toBe(hex);
        } else if (PALETTE_STEP.test(key)) {
          expect(dark).not.toHaveProperty(key);
        } else {
          expect(dark[key]).toBe(value);
        }
      }
    }
  );
});

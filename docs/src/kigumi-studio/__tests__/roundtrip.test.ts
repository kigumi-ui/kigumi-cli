import { describe, it, expect } from 'vitest';
import { generateThemeCSS } from '../lib/css-generator';
import { parseThemeCSS, parseComponentOverrides } from '../lib/css-parser';
import { SHADOW_COMPONENTS } from '../lib/shadow-components';

describe('round-trip: generate → parse → verify', () => {
  it('round-trips a simple light property', () => {
    const light = { '--wa-color-brand': '#ff0000' };
    const css = generateThemeCSS(light, {}, {});
    const parsed = parseThemeCSS(css);
    expect(parsed.light['--wa-color-brand']).toBe('#ff0000');
  });

  it('round-trips light and dark properties', () => {
    const light = {
      '--wa-color-brand': '#ff0000',
      '--wa-border-style': 'dashed',
    };
    const dark = { '--wa-color-surface-default': '#1a1a2e' };
    const css = generateThemeCSS(light, dark, {});
    const parsed = parseThemeCSS(css);
    expect(parsed.light['--wa-color-brand']).toBe('#ff0000');
    expect(parsed.light['--wa-border-style']).toBe('dashed');
    expect(parsed.dark['--wa-color-surface-default']).toBe('#1a1a2e');
  });

  it('round-trips shadow components', () => {
    const css = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      { shadowComponents: ['Card', 'Button', 'Badge'] }
    );
    const overrides = parseComponentOverrides(css);
    expect(overrides.shadowComponents.sort()).toEqual(
      ['Badge', 'Button', 'Card'].sort()
    );
  });

  it('exports, imports and exports every shadow component to the same CSS', () => {
    for (const { className } of SHADOW_COMPONENTS) {
      const css = generateThemeCSS({}, {}, { shadowComponents: [className] });
      const overrides = parseComponentOverrides(css);
      expect(overrides, className).toEqual({
        shadowComponents: [className],
        customCSS: '',
      });
      expect(
        generateThemeCSS(
          {},
          {},
          { shadowComponents: overrides.shadowComponents }
        ),
        className
      ).toBe(css);
    }
  });

  it('reads an older export’s host rule for a component that now targets a part as that component', () => {
    const overrides = parseComponentOverrides(
      '.Button {\n  box-shadow: var(--wa-shadow-m);\n}\n\n.Input {\n  box-shadow: var(--wa-shadow-m);\n}'
    );
    expect(overrides).toEqual({
      shadowComponents: ['Button', 'Input'],
      customCSS: '',
    });
    expect(
      generateThemeCSS({}, {}, { shadowComponents: overrides.shadowComponents })
    ).toBe(
      '/* Component Shadows */\n.Button::part(base) {\n  box-shadow: var(--wa-shadow-m);\n}\n\n.Input::part(base) {\n  box-shadow: var(--wa-shadow-m);\n}\n'
    );
  });

  it('reads a component once when the CSS holds both its old and its new rule', () => {
    const css =
      '.Button {\n  box-shadow: var(--wa-shadow-m);\n}\n\n.Button::part(base) {\n  box-shadow: var(--wa-shadow-m);\n}';
    const overrides = parseComponentOverrides(css);
    expect(overrides).toEqual({ shadowComponents: ['Button'], customCSS: '' });
    expect(
      generateThemeCSS({}, {}, { shadowComponents: overrides.shadowComponents })
    ).toBe(
      '/* Component Shadows */\n.Button::part(base) {\n  box-shadow: var(--wa-shadow-m);\n}\n'
    );
  });

  it('keeps a shadow rule the export never writes as custom CSS', () => {
    const rules = [
      // A part on a component whose host is its box.
      '.Card::part(base) {\n  box-shadow: var(--wa-shadow-m);\n}',
      // A part other than the one that draws the component.
      '.Button::part(label) {\n  box-shadow: var(--wa-shadow-m);\n}',
      // A component no longer in the list: kept as the project had it.
      '.Menu {\n  box-shadow: var(--wa-shadow-m);\n}',
    ];
    const overrides = parseComponentOverrides(rules.join('\n\n'));
    expect(overrides).toEqual({
      shadowComponents: [],
      customCSS: rules.join('\n\n'),
    });
  });

  it('round-trips shadow color+opacity combination', () => {
    const light = {
      '--wa-color-shadow': '#000000',
      '--wa-shadow-opacity': '0.3',
    };
    const css = generateThemeCSS(light, {}, {});
    expect(css).toContain('rgb(0 0 0 / 0.3)');
    const parsed = parseThemeCSS(css);
    expect(parsed.light['--wa-color-shadow']).toBe('#000000');
    expect(parsed.light['--wa-shadow-opacity']).toBe('0.3');
  });

  it('round-trips font import without corrupting properties', () => {
    const light = {
      '--wa-font-family-body': "'Inter', ui-sans-serif, system-ui, sans-serif",
      '--wa-color-brand': '#3b82f6',
    };
    const css = generateThemeCSS(light, {}, {});
    expect(css).toContain('@import');
    const parsed = parseThemeCSS(css);
    expect(parsed.light['--wa-color-brand']).toBe('#3b82f6');
    expect(parsed.light['--wa-font-family-body']).toBe(
      "'Inter', ui-sans-serif, system-ui, sans-serif"
    );
  });

  it('generates zero warnings when round-tripping known properties', () => {
    const light: Record<string, string> = {
      '--wa-color-brand': '#ff0000',
      '--wa-border-style': 'dashed',
      '--wa-space-scale': '1.5',
    };
    const dark: Record<string, string> = {
      '--wa-color-surface-default': '#101219',
      '--wa-color-text-normal': '#f1f5f9',
    };

    const css = generateThemeCSS(light, dark, {});
    const parsed = parseThemeCSS(css);
    expect(parsed.warnings).toHaveLength(0);
  });
});

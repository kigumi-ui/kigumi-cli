import { describe, it, expect } from 'vitest';
import { generateThemeCSS } from '../lib/css-generator';
import { parseThemeCSS, parseComponentOverrides } from '../lib/css-parser';

describe('round-trip: generate → parse → verify', () => {
  it('round-trips a simple light property', () => {
    const light = { '--wa-color-brand': '#ff0000' };
    const css = generateThemeCSS(light, {}, { includeHeader: false });
    const parsed = parseThemeCSS(css);
    expect(parsed.light['--wa-color-brand']).toBe('#ff0000');
  });

  it('round-trips light and dark properties', () => {
    const light = {
      '--wa-color-brand': '#ff0000',
      '--wa-border-style': 'dashed',
    };
    const dark = { '--wa-color-surface-default': '#1a1a2e' };
    const css = generateThemeCSS(light, dark, { includeHeader: true });
    const parsed = parseThemeCSS(css);
    expect(parsed.light['--wa-color-brand']).toBe('#ff0000');
    expect(parsed.light['--wa-border-style']).toBe('dashed');
    expect(parsed.dark['--wa-color-surface-default']).toBe('#1a1a2e');
  });

  it('round-trips shadow components', () => {
    const css = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      { includeHeader: false, shadowComponents: ['Card', 'Button', 'Badge'] }
    );
    const overrides = parseComponentOverrides(css, '.studio-preview');
    expect(overrides.shadowComponents.sort()).toEqual(
      ['Badge', 'Button', 'Card'].sort()
    );
  });

  it('round-trips custom CSS through generate → parse', () => {
    const customCSS =
      '.studio-preview .Card > .inner {\n  box-shadow: none;\n}';
    const css = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      { includeHeader: false, customCSS }
    );
    const overrides = parseComponentOverrides(css, '.studio-preview');
    expect(overrides.customCSS).toContain('.Card > .inner');
    expect(overrides.customCSS).toContain('box-shadow: none');
  });

  it('round-trips shadow color+opacity combination', () => {
    const light = {
      '--wa-color-shadow': '#000000',
      '--wa-shadow-opacity': '0.3',
    };
    const css = generateThemeCSS(light, {}, { includeHeader: false });
    expect(css).toContain('rgb(0 0 0 / 0.3)');
    const parsed = parseThemeCSS(css);
    expect(parsed.light['--wa-color-shadow']).toBe('rgb(0 0 0 / 0.3)');
  });

  it('round-trips font import without corrupting properties', () => {
    const light = {
      '--wa-font-family-body': "'Inter', ui-sans-serif, system-ui, sans-serif",
      '--wa-color-brand': '#3b82f6',
    };
    const css = generateThemeCSS(light, {}, { includeHeader: false });
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

    const css = generateThemeCSS(light, dark, { includeHeader: false });
    const parsed = parseThemeCSS(css);
    expect(parsed.warnings).toHaveLength(0);
  });
});

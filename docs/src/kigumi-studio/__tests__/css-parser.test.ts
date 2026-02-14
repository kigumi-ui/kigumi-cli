import { describe, it, expect } from 'vitest';
import { parseThemeCSS } from '../lib/css-parser';

describe('parseThemeCSS', () => {
  it('parses :root block with a single property', () => {
    const css = `:root {
      --wa-color-brand: #ff0000;
    }`;
    const result = parseThemeCSS(css);
    expect(result.light['--wa-color-brand']).toBe('#ff0000');
    expect(Object.keys(result.dark)).toHaveLength(0);
  });

  it('parses :root and .wa-dark blocks together', () => {
    const css = `:root {
      --wa-color-surface-default: white;
    }
    .wa-dark {
      --wa-color-surface-default: #101219;
    }`;
    const result = parseThemeCSS(css);
    expect(result.light['--wa-color-surface-default']).toBe('white');
    expect(result.dark['--wa-color-surface-default']).toBe('#101219');
  });

  it('handles oklch() color values', () => {
    const css = `:root {
      --wa-color-brand: oklch(0.55 0.25 265);
    }`;
    const result = parseThemeCSS(css);
    expect(result.light['--wa-color-brand']).toBe('oklch(0.55 0.25 265)');
  });

  it('handles hsl() color values', () => {
    const css = `:root {
      --wa-color-brand: hsl(220, 90%, 56%);
    }`;
    const result = parseThemeCSS(css);
    expect(result.light['--wa-color-brand']).toBe('hsl(220, 90%, 56%)');
  });

  it('handles rgb() color values', () => {
    const css = `:root {
      --wa-color-brand: rgb(0, 113, 236);
    }`;
    const result = parseThemeCSS(css);
    expect(result.light['--wa-color-brand']).toBe('rgb(0, 113, 236)');
  });

  it('handles #hex color values', () => {
    const css = `:root {
      --wa-color-brand: #0071ec;
    }`;
    const result = parseThemeCSS(css);
    expect(result.light['--wa-color-brand']).toBe('#0071ec');
  });

  it('handles var() references as unknown properties with warning', () => {
    const css = `:root {
      --wa-form-control-border-width: var(--wa-border-width-s);
    }`;
    const result = parseThemeCSS(css);
    // Removed from property definitions, so parsed but flagged as unknown
    expect(result.warnings).toContain(
      'Unknown property: --wa-form-control-border-width'
    );
  });

  it('handles calc() expressions as unknown properties with warning', () => {
    const css = `:root {
      --wa-border-radius-s: calc(var(--wa-border-radius-scale) * 0.1875rem);
    }`;
    const result = parseThemeCSS(css);
    // Removed from property definitions, so parsed but flagged as unknown
    expect(result.warnings).toContain('Unknown property: --wa-border-radius-s');
  });

  it('handles complex multi-value properties as unknown with warning', () => {
    const css = `:root {
      --wa-link-decoration-default: underline color-mix(in oklab, currentColor 70%, transparent) dotted;
    }`;
    const result = parseThemeCSS(css);
    // Removed from property definitions, so parsed but flagged as unknown
    expect(result.warnings).toContain(
      'Unknown property: --wa-link-decoration-default'
    );
  });

  it('ignores non --wa-* properties', () => {
    const css = `:root {
      --custom-color: red;
      --wa-color-brand: blue;
      --my-var: green;
    }`;
    const result = parseThemeCSS(css);
    expect(Object.keys(result.light)).toHaveLength(1);
    expect(result.light['--wa-color-brand']).toBe('blue');
    expect(result.warnings).toHaveLength(0);
  });

  it('handles comments inside blocks', () => {
    const css = `:root {
      /* Brand color */
      --wa-color-brand: #ff0000;
      /* --wa-color-text-normal: ignored; */
      --wa-border-style: dashed;
    }`;
    const result = parseThemeCSS(css);
    expect(result.light['--wa-color-brand']).toBe('#ff0000');
    expect(result.light['--wa-border-style']).toBe('dashed');
    expect(Object.keys(result.light)).toHaveLength(2);
  });

  it('handles empty blocks', () => {
    const css = `:root {}
    .wa-dark {}`;
    const result = parseThemeCSS(css);
    expect(Object.keys(result.light)).toHaveLength(0);
    expect(Object.keys(result.dark)).toHaveLength(0);
  });

  it('handles malformed CSS with missing closing brace gracefully', () => {
    const css = `:root {
      --wa-color-brand: red;
    `;
    // Should not throw, may return empty or partial
    const result = parseThemeCSS(css);
    expect(result.warnings).toBeDefined();
  });

  it('warns about unrecognized --wa-* properties', () => {
    const css = `:root {
      --wa-nonexistent-property: value;
    }`;
    const result = parseThemeCSS(css);
    expect(result.warnings).toContain(
      'Unknown property: --wa-nonexistent-property'
    );
  });

  it('parses multiple properties in a single block', () => {
    const css = `:root {
      --wa-color-brand: #ff0000;
      --wa-border-style: dashed;
      --wa-space-scale: 1.5;
      --wa-transition-fast: 50ms;
    }`;
    const result = parseThemeCSS(css);
    expect(Object.keys(result.light)).toHaveLength(4);
    expect(result.light['--wa-space-scale']).toBe('1.5');
    expect(result.light['--wa-transition-fast']).toBe('50ms');
  });

  it('handles CSS with no recognized blocks', () => {
    const css = `body { color: red; }`;
    const result = parseThemeCSS(css);
    expect(Object.keys(result.light)).toHaveLength(0);
    expect(Object.keys(result.dark)).toHaveLength(0);
  });
});

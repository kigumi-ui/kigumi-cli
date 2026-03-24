import { describe, it, expect } from 'vitest';
import { generateThemeCSS } from '../lib/css-generator';

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

  it('appends custom CSS at the end', () => {
    const result = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      {
        customCSS: '.studio-preview .Card > .Card {\n  box-shadow: none;\n}',
      }
    );
    expect(result).toContain('/* Custom Styles */');
    expect(result).toContain('.Card > .Card {\n  box-shadow: none;\n}');
    // Custom CSS should be unscoped (no .studio-preview prefix)
    expect(result).not.toContain('.studio-preview');
  });

  it('outputs shadow rules before custom CSS', () => {
    const result = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      {
        shadowComponents: ['Card'],
        customCSS: '.studio-preview .Card > .Card { box-shadow: none; }',
      }
    );
    const shadowIndex = result.indexOf('/* Component Shadows */');
    const customIndex = result.indexOf('/* Custom Styles */');
    expect(shadowIndex).toBeLessThan(customIndex);
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

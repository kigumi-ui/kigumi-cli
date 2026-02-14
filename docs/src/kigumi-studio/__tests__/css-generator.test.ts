import { describe, it, expect } from 'vitest';
import { generateThemeCSS } from '../lib/css-generator';

describe('generateThemeCSS', () => {
  it('generates :root block with one property', () => {
    const result = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      { includeHeader: false }
    );
    expect(result).toContain(':root {');
    expect(result).toContain('--wa-color-brand: #ff0000;');
    expect(result).not.toContain('.wa-dark');
  });

  it('generates :root and .wa-dark blocks with separate properties', () => {
    const result = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      { '--wa-color-surface-default': '#101219' },
      { includeHeader: false }
    );
    expect(result).toContain(':root {');
    expect(result).toContain('--wa-color-brand: #ff0000;');
    expect(result).toContain('.wa-dark {');
    expect(result).toContain('--wa-color-surface-default: #101219;');
  });

  it('includes header comment when includeHeader is true', () => {
    const result = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      { includeHeader: true }
    );
    expect(result).toContain('Kigumi Studio Theme');
    expect(result).toContain('kigumi.style/kigumi-studio');
  });

  it('returns empty string when no properties provided', () => {
    const result = generateThemeCSS({}, {});
    expect(result).toBe('');
  });

  it('handles only dark mode properties', () => {
    const result = generateThemeCSS(
      {},
      { '--wa-color-surface-raised': '#1a1a2e' },
      { includeHeader: false }
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
      { includeHeader: false }
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
      { includeHeader: false }
    );
    const lines = result.split('\n');
    // Should have :root {, 3 properties, }
    expect(lines.filter((l) => l.startsWith('  --wa-'))).toHaveLength(3);
  });

  it('ends output with a newline', () => {
    const result = generateThemeCSS(
      { '--wa-color-brand': '#ff0000' },
      {},
      { includeHeader: false }
    );
    expect(result.endsWith('\n')).toBe(true);
  });
});

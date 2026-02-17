import { describe, it, expect } from 'vitest';
import { generateThemeCSS } from '../lib/css-generator';
import { AVAILABLE_FONTS } from '../lib/font-definitions';

describe('generateThemeCSS - font imports', () => {
  const inter = AVAILABLE_FONTS.find((f) => f.name === 'Inter')!;
  const playfair = AVAILABLE_FONTS.find((f) => f.name === 'Playfair Display')!;
  const jetbrains = AVAILABLE_FONTS.find((f) => f.name === 'JetBrains Mono')!;
  const systemFont = AVAILABLE_FONTS.find((f) => f.category === 'System')!;

  it('generates @import for a recognized web font in light properties', () => {
    const result = generateThemeCSS(
      { '--wa-font-family-body': inter.value },
      {},
      { includeHeader: false }
    );
    expect(result).toContain('@import url(');
    expect(result).toContain(inter.bunnyUrl);
  });

  it('does not generate @import for system fonts', () => {
    const result = generateThemeCSS(
      { '--wa-font-family-body': systemFont.value },
      {},
      { includeHeader: false }
    );
    expect(result).not.toContain('@import');
  });

  it('deduplicates font imports when same font used for body and heading', () => {
    const result = generateThemeCSS(
      {
        '--wa-font-family-body': inter.value,
        '--wa-font-family-heading': inter.value,
      },
      {},
      { includeHeader: false }
    );
    const importCount = (result.match(/@import/g) || []).length;
    expect(importCount).toBe(1);
  });

  it('generates multiple @import for different fonts', () => {
    const result = generateThemeCSS(
      {
        '--wa-font-family-body': inter.value,
        '--wa-font-family-heading': playfair.value,
      },
      {},
      { includeHeader: false }
    );
    expect(result).toContain(inter.bunnyUrl);
    expect(result).toContain(playfair.bunnyUrl);
  });

  it('places @import statements before :root block', () => {
    const result = generateThemeCSS(
      {
        '--wa-font-family-body': inter.value,
        '--wa-color-brand': '#ff0000',
      },
      {},
      { includeHeader: false }
    );
    const importIndex = result.indexOf('@import');
    const rootIndex = result.indexOf(':root');
    expect(importIndex).toBeLessThan(rootIndex);
  });

  it('detects font in dark-mode-only properties', () => {
    const result = generateThemeCSS(
      {},
      { '--wa-font-family-code': jetbrains.value },
      { includeHeader: false }
    );
    expect(result).toContain(jetbrains.bunnyUrl);
  });
});

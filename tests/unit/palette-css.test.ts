/**
 * The palette import in layers.css (issue #174): syncPaletteImport brings
 * an existing layers.css in line with the configured palette.
 */

import { describe, it, expect } from 'vitest';
import { syncPaletteImport } from '../../src/utils/palette-css.js';
import { generateLayersCSS } from '../../src/utils/regenerate.js';

const PRO = '@awesome.me/webawesome-pro';
const FREE = '@awesome.me/webawesome';

/** A layers.css as the CLI wrote it before the palette import existed. */
const BEFORE_174 = `@layer base, theme, overrides;

/* Layer 1: Web Awesome base styles */
@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base);

/* Layer 1: Web Awesome theme styles */
@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base);

/* Layer 2: Your theme customization (sibling of layers.css) */
@import './theme.css' layer(theme);
`;

const WITH_RUDIMENTARY = `@layer base, theme, overrides;

/* Layer 1: Web Awesome base styles */
@import '@awesome.me/webawesome-pro/dist/styles/webawesome.css' layer(base);

/* Layer 1: Web Awesome theme styles */
@import '@awesome.me/webawesome-pro/dist/styles/themes/default.css' layer(base);

/* Layer 1: Web Awesome color palette */
@import '@awesome.me/webawesome-pro/dist/styles/color/palettes/rudimentary.css' layer(base);

/* Layer 2: Your theme customization (sibling of layers.css) */
@import './theme.css' layer(theme);
`;

describe('syncPaletteImport', () => {
  it('adds the palette import right after the theme import', () => {
    const result = syncPaletteImport(BEFORE_174, PRO, 'rudimentary');
    expect(result.status).toBe('added');
    expect(result.content).toBe(WITH_RUDIMENTARY);
  });

  it('adds it where the generator puts it in a file the generator wrote', async () => {
    const current = await generateLayersCSS(PRO, 'tailspin', 'vogue', '');
    const older = current.replace(
      /\/\* Layer 1: Web Awesome color palette \*\/\n@import [^\n]*\n\n/,
      ''
    );
    expect(older).not.toContain('color/palettes');

    expect(syncPaletteImport(older, PRO, 'vogue')).toEqual({
      status: 'added',
      content: current,
    });
  });

  it('leaves a file that already imports the palette as it is', () => {
    expect(syncPaletteImport(WITH_RUDIMENTARY, PRO, 'rudimentary')).toEqual({
      status: 'present',
      content: WITH_RUDIMENTARY,
    });
  });

  it('points an import of another palette at the configured one', () => {
    const result = syncPaletteImport(WITH_RUDIMENTARY, PRO, 'mild');
    expect(result.status).toBe('updated');
    expect(result.content).toBe(
      WITH_RUDIMENTARY.replace('palettes/rudimentary.css', 'palettes/mild.css')
    );
  });

  it("points an import from the other tier's package at this one", () => {
    const result = syncPaletteImport(WITH_RUDIMENTARY, FREE, 'rudimentary');
    expect(result.status).toBe('updated');
    expect(result.content).toContain(
      "@import '@awesome.me/webawesome/dist/styles/color/palettes/rudimentary.css' layer(base);"
    );
    expect(result.content).not.toContain(`${PRO}/dist/styles/color`);
  });

  it('does not count a commented-out palette import', () => {
    const commented = BEFORE_174.replace(
      '/* Layer 2',
      `/* @import '${PRO}/dist/styles/color/palettes/rudimentary.css' layer(base); */\n\n/* Layer 2`
    );
    expect(syncPaletteImport(commented, PRO, 'rudimentary').status).toBe(
      'added'
    );
  });

  it('adds it without a layer after a theme import without one', () => {
    const plain = BEFORE_174.replace(/ layer\(base\)/g, '');
    const result = syncPaletteImport(plain, PRO, 'rudimentary');
    expect(result.status).toBe('added');
    expect(result.content).toContain(
      `@import '${PRO}/dist/styles/themes/default.css';\n\n/* Layer 1: Web Awesome color palette */\n@import '${PRO}/dist/styles/color/palettes/rudimentary.css';\n`
    );
  });

  it('adds it after a community theme import', () => {
    const community = BEFORE_174.replace(
      `${PRO}/dist/styles/themes/default.css`,
      './community-themes/sunset.css'
    );
    const result = syncPaletteImport(community, PRO, 'rudimentary');
    expect(result.status).toBe('added');
    expect(result.content).toContain(
      `@import './community-themes/sunset.css' layer(base);\n\n/* Layer 1: Web Awesome color palette */`
    );
  });

  it("keeps the file's CRLF line endings", () => {
    const crlf = BEFORE_174.replace(/\n/g, '\r\n');
    const result = syncPaletteImport(crlf, PRO, 'rudimentary');
    expect(result.content).toBe(WITH_RUDIMENTARY.replace(/\n/g, '\r\n'));
  });

  it('leaves a file with no theme import to add it after alone', () => {
    const noTheme = `@import './theme.css' layer(theme);\n`;
    expect(syncPaletteImport(noTheme, PRO, 'rudimentary')).toEqual({
      status: 'unrecognized',
      content: noTheme,
    });
  });
});

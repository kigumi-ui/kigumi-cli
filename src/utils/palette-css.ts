/**
 * The palette import in `layers.css` (issue #174).
 *
 * Web Awesome scopes every palette but `default` to `.wa-palette-<name>`, so
 * the class kigumi.ts puts on `<html>` only takes effect when `layers.css`
 * loads that palette's stylesheet. It is imported into the base layer,
 * right after the theme.
 */

import fs from 'fs-extra';
import type { OutputInterface } from '../output/types.js';
import { maskComments } from './overrides-css.js';
import type { Tier } from './tier.js';
import { isPaletteAvailable } from './tier-restrictions.js';

/** How `layers.css` introduces the palette import. */
const PALETTE_COMMENT = '/* Layer 1: Web Awesome color palette */';

/** The palette's stylesheet in the Web Awesome package. */
export function paletteSpecifier(packageName: string, palette: string): string {
  return `${packageName}/dist/styles/color/palettes/${palette}.css`;
}

/**
 * The palette `layers.css` imports: the configured one, or `default` when
 * the tier's package does not ship it (a Pro palette left in the config
 * after a move to Free). Importing a file the package lacks fails the
 * build; `default` is what such a project showed before the import existed.
 */
export function importablePalette(palette: string, tier: Tier): string {
  return isPaletteAvailable(palette, tier) ? palette : 'default';
}

/**
 * The commented palette import, shared by `generateLayersCSS` and
 * `syncPaletteImport` so the two never differ.
 */
export function paletteImport(
  packageName: string,
  palette: string,
  qualifier: string,
  eol = '\n'
): string {
  return `${PALETTE_COMMENT}${eol}@import '${paletteSpecifier(packageName, palette)}'${qualifier};`;
}

/** What `syncPaletteImport` found, and what it did. */
export type PaletteImportStatus =
  /** The configured palette is imported already. */
  | 'present'
  /** There was no palette import; one now follows the theme import. */
  | 'added'
  /** A palette import named another palette or package; it now names this one. */
  | 'updated'
  /** No palette import and no theme import to add one after: left alone. */
  | 'unrecognized';

// Matched on the file with its comments blanked out (`maskComments`), so a
// commented-out import never counts. Group 2 is the specifier.
const PALETTE_IMPORT =
  /@import\s+(?:url\(\s*)?(['"])([^'"]*\/dist\/styles\/color\/palettes\/[^'"/]+\.css)\1/g;
// A built-in theme from the package, or a community theme next to layers.css.
// Group 1 is what follows the specifier up to the `;`.
const THEME_IMPORT =
  /@import\s+(?:url\(\s*)?['"][^'"]*(?:\/dist\/styles\/themes\/|community-themes\/)[^'"/]+\.css['"]\s*\)?([^;]*);/;

/**
 * `layers.css` content that imports the configured palette. A file without
 * a palette import gets one after its theme import, with the theme import's
 * layer qualifier and the file's own line endings; a palette import that
 * names another palette, or the other tier's package, is pointed at this
 * one. Everything else stays as the user has it.
 */
export function syncPaletteImport(
  content: string,
  packageName: string,
  palette: string
): { status: PaletteImportStatus; content: string } {
  const masked = maskComments(content);
  const wanted = paletteSpecifier(packageName, palette);
  const imports = [...masked.matchAll(PALETTE_IMPORT)];

  if (imports.some(([, , specifier]) => specifier === wanted)) {
    return { status: 'present', content };
  }

  const [first] = imports;
  if (first) {
    const start =
      (first.index ?? 0) + first[0].length - first[1].length - first[2].length;
    return {
      status: 'updated',
      content:
        content.slice(0, start) +
        wanted +
        content.slice(start + first[2].length),
    };
  }

  const theme = THEME_IMPORT.exec(masked);
  if (!theme) return { status: 'unrecognized', content };
  const qualifier = /\blayer\(/.test(theme[1]) ? ' layer(base)' : '';
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const end = theme.index + theme[0].length;
  return {
    status: 'added',
    content:
      content.slice(0, end) +
      `${eol}${eol}${paletteImport(packageName, palette, qualifier, eol)}` +
      content.slice(end),
  };
}

/**
 * Bring the project's `layers.css` in line with the configured palette
 * (`syncPaletteImport`) and write it when that changed it. `absent` when
 * there is no `layers.css`.
 */
export async function ensurePaletteImport(
  layersPath: string,
  packageName: string,
  palette: string
): Promise<PaletteImportStatus | 'absent'> {
  if (!(await fs.pathExists(layersPath))) return 'absent';
  const content = await fs.readFile(layersPath, 'utf-8');
  const synced = syncPaletteImport(content, packageName, palette);
  if (synced.content !== content) {
    await fs.writeFile(layersPath, synced.content);
  }
  return synced.status;
}

/**
 * Tell the user what `ensurePaletteImport` did to a `layers.css` the
 * command kept, or, when it could not add the import, the line to add.
 */
export function reportPaletteImport(
  status: PaletteImportStatus | 'absent',
  stylesDir: string,
  packageName: string,
  palette: string,
  output: OutputInterface
): void {
  if (status === 'added' || status === 'updated') {
    output.info(
      `Pointed ${stylesDir}/layers.css at the "${palette}" palette's stylesheet`
    );
  }
  if (status === 'unrecognized') {
    output.warning(
      `${stylesDir}/layers.css has no theme import to add the "${palette}" palette after, so it was left as it is.\n` +
        `Import the palette right after your theme import, or the wa-palette-${palette} class has no effect:\n` +
        `  @import '${paletteSpecifier(packageName, palette)}' layer(base);`
    );
  }
}

/**
 * overrides.css and the `overrides` cascade layer (docs/adr/0009).
 *
 * Custom CSS rules live apart from the theme: `layers.css` imports
 * `overrides.css` last, into a layer after `theme`, so a rule there beats
 * the same rule in `theme.css`. Like `theme.css`, the file is the user's:
 * created when missing, never overwritten.
 */

import fs from 'fs-extra';
import path from 'path';
import type { OutputInterface } from '../output/types.js';

/**
 * What became of `layers.css`: it already imported `overrides.css`
 * (`present`), the layer was added (`added`), it has no `theme.css` import
 * to add it after (`unrecognized`, left alone), or there is none (`absent`).
 */
export type OverridesLayerStatus =
  'present' | 'added' | 'unrecognized' | 'absent';

/** What `ensureOverridesLayer` did. */
export interface OverridesLayerResult {
  /** `overrides.css` was missing and is now written. */
  created: boolean;
  layers: OverridesLayerStatus;
}

// Relative ('./theme.css') or through the project alias ('@/styles/theme.css'),
// which older CLI versions wrote. Group 1 is the directory part.
const OVERRIDES_IMPORT =
  /@import\s+(?:url\(\s*)?['"](?:[^'"]*\/)?overrides\.css['"]/;
const THEME_IMPORT = /@import\s+['"]((?:[^'"]*\/)?)theme\.css['"]([^;]*);/;
// A statement on a line of its own, never the "@layer" in a comment's URL.
const LAYER_ORDER = /^([ \t]*@layer[ \t]+[^;{\n]*\btheme\b)([^;{\n]*;)/m;

/** The content of a new `overrides.css`: comments, no rule. */
export function generateOverridesCSS(): string {
  return `/**
 * Custom CSS overrides
 *
 * This file is yours: Kigumi creates it once and never overwrites it.
 * layers.css imports it last, into the 'overrides' cascade layer, so a rule
 * here beats the same rule in theme.css, whatever their specificity. On the
 * Next.js Pages Router, which drops the layers, it wins by coming later, so
 * give it at least the specificity of the rule it overrides.
 *
 * Use theme.css for design tokens (--wa-* custom properties) and this file
 * for rules no token expresses, for example:
 *
 *   wa-button::part(base) {
 *     text-transform: uppercase;
 *   }
 */
`;
}

/**
 * `layers.css` content with the overrides layer added, or `undefined` when
 * it has no `theme.css` import to add it after. Only two things change: the
 * `@layer` order statement names `overrides` right after `theme`, and the
 * `overrides.css` import follows the `theme.css` import, from the same
 * directory and qualified the same way (unqualified on the Next.js Pages Router path, where it wins by source
 * order). Everything else stays as the user has it.
 */
export function addOverridesLayer(content: string): string | undefined {
  const themeImport = THEME_IMPORT.exec(content);
  if (!themeImport) return undefined;
  const [, directory, rest] = themeImport;
  const qualifier = /\blayer\(/.test(rest) ? ' layer(overrides)' : '';
  const end = themeImport.index + themeImport[0].length;
  const withImport =
    content.slice(0, end) +
    `\n\n/* Layer 3: Your custom CSS rules, which beat the theme (sibling of layers.css) */\n@import '${directory}overrides.css'${qualifier};` +
    content.slice(end);
  return /\boverrides\b/.test(LAYER_ORDER.exec(withImport)?.[0] ?? '')
    ? withImport
    : withImport.replace(LAYER_ORDER, '$1, overrides$2');
}

/**
 * Make sure the project's `overrides.css` exists next to `layers.css`, and
 * that `layers.css` imports it: one written before the overrides layer gets
 * it added in place (`addOverridesLayer`).
 *
 * @param cwd - Project root
 * @param stylesDir - Styles directory from the config, e.g. `src/styles`
 */
export async function ensureOverridesLayer(
  cwd: string,
  stylesDir: string
): Promise<OverridesLayerResult> {
  const overridesPath = path.join(cwd, stylesDir, 'overrides.css');
  const created = !(await fs.pathExists(overridesPath));
  if (created) {
    await fs.ensureDir(path.dirname(overridesPath));
    await fs.writeFile(overridesPath, generateOverridesCSS());
  }

  const layersPath = path.join(cwd, stylesDir, 'layers.css');
  if (!(await fs.pathExists(layersPath))) return { created, layers: 'absent' };
  const content = await fs.readFile(layersPath, 'utf-8');
  if (OVERRIDES_IMPORT.test(content)) return { created, layers: 'present' };
  const next = addOverridesLayer(content);
  if (next === undefined) return { created, layers: 'unrecognized' };
  await fs.writeFile(layersPath, next);
  return { created, layers: 'added' };
}

/**
 * Tell the user what `ensureOverridesLayer` did: the new file, the layer
 * added to their `layers.css`, or, when it could not be added, the import to
 * add by hand.
 */
export function reportOverridesLayer(
  result: OverridesLayerResult,
  stylesDir: string,
  output: OutputInterface
): void {
  if (result.created) {
    output.info(`Created ${stylesDir}/overrides.css for your custom CSS rules`);
  }
  if (result.layers === 'added') {
    output.info(
      `Added the overrides layer to ${stylesDir}/layers.css, after theme.css`
    );
  }
  if (result.layers === 'unrecognized') {
    output.warning(
      `${stylesDir}/layers.css has no theme.css import to add the overrides layer after, so it was left as it is.\n` +
        `Add this line after your theme.css import, or rules in overrides.css will not load:\n` +
        `  @import './overrides.css' layer(overrides);`
    );
  }
}

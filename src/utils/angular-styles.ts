/**
 * Angular global styles: `layers.css` in `angular.json`.
 *
 * Angular loads global CSS through the build target's `styles` option, not
 * through a CSS import in TypeScript: the build cannot resolve one through an
 * `@/` alias `ng new` never sets up, and TypeScript 6 rejects it without a
 * `*.css` declaration (issue #156). So the Angular `kigumi.ts` imports no CSS,
 * and `layers.css` goes first in every application's `styles`, ahead of the
 * project's own stylesheet.
 */

import fs from 'fs-extra';
import path from 'path';
import { readJSONWithComments } from './json.js';
import type { OutputInterface } from '../output/types.js';

/**
 * `added` / `present`: every application's build target lists `layers.css`.
 * `no-angular-json`: there is no `angular.json` to edit.
 * `no-build-target`: `angular.json` names no application with a build target.
 */
export type AngularStylesResult =
  'added' | 'present' | 'no-angular-json' | 'no-build-target';

type StyleEntry = string | { input?: string };

interface AngularJson {
  projects?: Record<
    string,
    {
      projectType?: string;
      architect?: { build?: { options?: { styles?: StyleEntry[] } } };
    }
  >;
}

/** The `angular.json` path of `layers.css`, relative to the workspace root. */
export function angularLayersEntry(stylesDir: string): string {
  return path.posix.join(stylesDir.split(path.sep).join('/'), 'layers.css');
}

/**
 * Put `layers.css` first in the `styles` of every application in
 * `angular.json`, unless it is listed already.
 */
export async function ensureAngularStyles(
  cwd: string,
  stylesDir: string
): Promise<AngularStylesResult> {
  const angularJsonPath = path.join(cwd, 'angular.json');
  if (!(await fs.pathExists(angularJsonPath))) return 'no-angular-json';

  const angularJson = (await readJSONWithComments(
    angularJsonPath
  )) as AngularJson;
  const entry = angularLayersEntry(stylesDir);
  const isLayers = (style: StyleEntry): boolean =>
    path.posix.normalize(
      typeof style === 'string' ? style : (style.input ?? '')
    ) === entry;

  let applications = 0;
  let added = false;
  for (const project of Object.values(angularJson.projects ?? {})) {
    const options = project.architect?.build?.options;
    if (project.projectType !== 'application' || !options) continue;
    applications++;
    const styles = options.styles ?? [];
    if (!styles.some(isLayers)) {
      options.styles = [entry, ...styles];
      added = true;
    }
  }

  if (applications === 0) return 'no-build-target';
  if (added) await fs.writeJSON(angularJsonPath, angularJson, { spaces: 2 });
  return added ? 'added' : 'present';
}

/** Tell the user what `ensureAngularStyles` did, or what is left to do. */
export function reportAngularStyles(
  result: AngularStylesResult | undefined,
  stylesDir: string,
  output: OutputInterface
): void {
  const entry = angularLayersEntry(stylesDir);
  if (result === 'added') {
    output.info(`Added ${entry} to the styles in angular.json`);
  } else if (result === 'no-angular-json' || result === 'no-build-target') {
    output.warn(
      `Could not add ${entry} to angular.json: add it first in your application's build "styles", or Web Awesome loads unstyled`
    );
  }
}

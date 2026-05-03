/**
 * Configuration Management
 *
 * PURPOSE: Load, validate, and save kigumi configuration files. Three honest
 * operations:
 *
 *   - loadConfig: returns the raw, unvalidated payload from disk plus the
 *     filepath cosmiconfig discovered. Use only when you need access to the
 *     user's literal data (e.g. to detect typos before merging).
 *   - getConfig: loadConfig -> mergeWithDefaults. Throws ConfigInvalidError on
 *     malformed data, ConfigNotFoundError when no file exists. Use this almost
 *     everywhere.
 *   - saveConfig: patch primitive. Reads the on-disk file, merges the patch
 *     keys top-level (with one-level spread for `theme` and `webAwesome`),
 *     writes back to the same filepath cosmiconfig discovered. Throws
 *     ConfigNotFoundError when there is nothing to save back to.
 *
 * @internal - Utility module for internal CLI use
 */

import { cosmiconfigSync } from 'cosmiconfig';
import fs from 'fs-extra';
import path from 'path';
import { DEFAULT_CONFIG, mergeWithDefaults } from '../schemas/config.js';
import type {
  KigumiConfig,
  ThemeConfig,
  WebAwesomeConfig,
} from '../schemas/config.js';
import { ConfigNotFoundError } from '../errors/config.js';

/**
 * A patch applied to an on-disk kigumi config. Top-level fields are optional;
 * the two nested config objects accept partial shapes so callers can update a
 * single nested field (e.g. `{ theme: { selected } }`) without rewriting the
 * sibling keys.
 */
export type ConfigPatch = Omit<
  Partial<KigumiConfig>,
  'theme' | 'webAwesome'
> & {
  theme?: Partial<ThemeConfig>;
  webAwesome?: Partial<WebAwesomeConfig>;
};

// Re-export type and defaults from the canonical source (schemas/config.ts)
export type { KigumiConfig };
export { DEFAULT_CONFIG };

const SEARCH_PLACES = [
  'kigumi.config.json',
  'kigumi-components.json',
  'kigumi.json',
  '.kigumirc',
  '.kigumirc.json',
  'package.json',
] as const;

/**
 * Result of loading a config file from disk.
 */
export interface LoadedConfig {
  /** Raw, unvalidated user config payload from cosmiconfig. */
  config: unknown;
  /** Absolute path to the discovered config file. */
  filepath: string;
}

/**
 * Load kigumi configuration from the user's project.
 *
 * Returns raw on-disk data plus the discovered filepath, or null if no config
 * was found. Pinned to the given cwd via `stopDir` so monorepo sub-packages
 * never inherit a parent's config silently.
 *
 * @internal
 */
export function loadConfig(cwd: string = process.cwd()): LoadedConfig | null {
  const explorer = cosmiconfigSync('kigumi', {
    searchPlaces: [...SEARCH_PLACES],
    stopDir: cwd,
  });

  const result = explorer.search(cwd);
  if (!result) return null;
  return { config: result.config, filepath: result.filepath };
}

/**
 * Search places `loadConfig` consults, in priority order.
 */
export function getSearchPlaces(): readonly string[] {
  return SEARCH_PLACES;
}

/**
 * Get the resolved configuration with defaults applied and strict validation.
 *
 * Throws `ConfigNotFoundError` when no config file is present and
 * `ConfigInvalidError` when the on-disk data fails strict validation.
 * Callers that want to handle the not-found case differently (e.g. `doctor`)
 * should wrap with try/catch.
 *
 * @internal
 */
export function getConfig(cwd: string = process.cwd()): KigumiConfig {
  const loaded = loadConfig(cwd);
  if (!loaded) {
    throw new ConfigNotFoundError(cwd);
  }
  return mergeWithDefaults(loaded.config as Partial<KigumiConfig>);
}

/**
 * Shallow-merge a patch into the on-disk config payload.
 *
 * Top-level keys from `patch` override `onDisk`. The two nested config objects
 * `theme` and `webAwesome` get one level of spread so a partial patch like
 * `{ theme: { selected } }` does not blow away sibling keys the user set.
 */
function mergePatch(
  onDisk: Record<string, unknown>,
  patch: ConfigPatch
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...onDisk, ...patch };

  if (patch.theme) {
    const existingTheme = (onDisk.theme as Record<string, unknown>) ?? {};
    next.theme = { ...existingTheme, ...patch.theme };
  }

  if (patch.webAwesome) {
    const existingWa = (onDisk.webAwesome as Record<string, unknown>) ?? {};
    next.webAwesome = { ...existingWa, ...patch.webAwesome };
  }

  return next;
}

/**
 * Write a top-level key into a `package.json` while preserving sibling keys.
 */
async function writePackageJsonKey(
  filepath: string,
  key: string,
  value: unknown
): Promise<void> {
  const pkg = (await fs.readJson(filepath)) as Record<string, unknown>;
  pkg[key] = value;
  await fs.writeJson(filepath, pkg, { spaces: 2 });
}

/**
 * Apply a config patch, writing back to the file `loadConfig` discovered.
 *
 * Only the fields in `patch` are mutated; existing on-disk keys not in the
 * patch are preserved (no default re-injection). When the discovered file is
 * `package.json`, the patch is written to its `kigumi` key with sibling keys
 * preserved.
 *
 * **Caller responsibility:** the patch shape is not validated against the
 * strict schema before write — `ConfigPatch` accepts partial nested objects
 * so a caller can update a single nested field. A degenerate patch like
 * `{ theme: {} }` would write an empty `theme` block to disk; subsequent
 * `getConfig` calls still succeed because `mergeWithDefaults` re-fills the
 * defaults, but the on-disk artefact would be lossy. Pass concrete fields,
 * not empty objects.
 *
 * Throws ConfigNotFoundError when there is no on-disk file to patch (init
 * bypasses this and writes a fresh kigumi.config.json directly).
 *
 * @internal
 */
export async function saveConfig(
  patch: ConfigPatch,
  cwd: string = process.cwd()
): Promise<void> {
  const loaded = loadConfig(cwd);
  if (!loaded) {
    throw new ConfigNotFoundError(cwd);
  }

  const onDisk = (loaded.config as Record<string, unknown>) ?? {};
  const next = mergePatch(onDisk, patch);

  if (path.basename(loaded.filepath) === 'package.json') {
    await writePackageJsonKey(loaded.filepath, 'kigumi', next);
  } else {
    await fs.writeJson(loaded.filepath, next, { spaces: 2 });
  }
}

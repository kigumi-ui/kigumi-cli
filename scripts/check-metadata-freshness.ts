#!/usr/bin/env tsx
/**
 * Compare mtimes between Web Awesome's custom-elements.json (CEM) and the
 * generated `src/utils/component-metadata.ts`. Used by `prebuild` to decide
 * whether to regenerate metadata before the CLI bundle is built.
 *
 * Exit codes (matching the historical `test -f` behavior `prebuild` used):
 *   0 → up-to-date, OR cannot check (CEM not on disk); skip regen
 *   1 → metadata is missing or stale relative to CEM; regen
 *
 * The cannot-check branch (CEM missing) is intentional: it lets `pnpm build`
 * run inside environments where `docs/node_modules` isn't installed (CI matrix
 * for downstream consumers, fresh clones before pnpm install). The parser
 * itself errors loudly if the metadata file ends up missing when something
 * actually needs it.
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { findCustomElementsJson } from './find-cem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

export interface FreshnessCheckResult {
  isStale: boolean;
  reason: 'metadata-missing' | 'cem-newer' | 'fresh' | 'cem-missing-skip-check';
}

/**
 * Pure comparison between metadata and CEM mtimes. Exported for unit testing.
 *
 *   metaMtime null → metadata file doesn't exist; must regen
 *   cemMtime null  → CEM unreachable; defer (skip regen)
 *   cemMtime > metaMtime → CEM newer than generated output; regen
 *   otherwise → fresh
 */
export function compareFreshness(
  metaMtime: number | null,
  cemMtime: number | null
): FreshnessCheckResult {
  if (metaMtime === null) return { isStale: true, reason: 'metadata-missing' };
  if (cemMtime === null)
    return { isStale: false, reason: 'cem-missing-skip-check' };
  if (cemMtime > metaMtime) return { isStale: true, reason: 'cem-newer' };
  return { isStale: false, reason: 'fresh' };
}

async function main(): Promise<void> {
  const metaPath = path.join(PROJECT_ROOT, 'src/utils/component-metadata.ts');

  const metaExists = await fs.pathExists(metaPath);
  const metaMtime = metaExists ? (await fs.stat(metaPath)).mtimeMs : null;

  const cemPath = await findCustomElementsJson();
  const cemMtime = cemPath ? (await fs.stat(cemPath)).mtimeMs : null;

  const { isStale } = compareFreshness(metaMtime, cemMtime);
  process.exit(isStale ? 1 : 0);
}

// Run only when invoked directly, not when imported by tests
const invokedDirectly = process.argv[1]
  ? path.resolve(process.argv[1]) === __filename
  : false;
if (invokedDirectly) {
  void main();
}

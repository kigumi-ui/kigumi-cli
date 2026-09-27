#!/usr/bin/env tsx
/**
 * Compare mtimes between the generated `src/utils/component-metadata.ts` and
 * the two Web Awesome inputs it is parsed from: custom-elements.json (CEM) and
 * the event class declarations beside it (`dist/events/*.d.ts`, which supply
 * every handler type, see docs/adr/0005). The newer of the two is what the
 * metadata is compared against. Used by `prebuild` to decide whether to
 * regenerate metadata before the CLI bundle is built.
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
import { resolveCem } from './find-cem.js';

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

/** What each outcome means, for the one line this script prints about itself. */
const REASON_TEXT: Record<FreshnessCheckResult['reason'], string> = {
  'metadata-missing': 'component-metadata.ts is missing; regenerating',
  'cem-newer':
    'Web Awesome CEM or event declarations are newer than ' +
    'component-metadata.ts; regenerating',
  fresh:
    'component-metadata.ts is up to date with the Web Awesome CEM and event ' +
    'declarations',
  'cem-missing-skip-check':
    'NOT CHECKED: no Web Awesome CEM on disk, so metadata freshness could ' +
    'not be compared. Skipping regeneration (expected in a fresh clone or ' +
    'without docs dependencies installed).',
};

/**
 * The newest mtime among the parser's Web Awesome inputs: the CEM and every
 * `dist/events/*.d.ts` next to it. An events directory that is missing counts
 * for nothing here; the parser itself refuses to run without it.
 */
async function newestInputMtime(cemPath: string): Promise<number> {
  let newest = (await fs.stat(cemPath)).mtimeMs;
  const eventsDir = path.join(path.dirname(cemPath), 'events');
  if (!(await fs.pathExists(eventsDir))) return newest;
  for (const file of await fs.readdir(eventsDir)) {
    if (!file.endsWith('.d.ts')) continue;
    const { mtimeMs } = await fs.stat(path.join(eventsDir, file));
    if (mtimeMs > newest) newest = mtimeMs;
  }
  return newest;
}

async function main(): Promise<void> {
  const metaPath = path.join(PROJECT_ROOT, 'src/utils/component-metadata.ts');

  const metaExists = await fs.pathExists(metaPath);
  const metaMtime = metaExists ? (await fs.stat(metaPath)).mtimeMs : null;

  const cemResolution = await resolveCem(PROJECT_ROOT);
  const cemPath = cemResolution.path;
  const cemMtime = cemPath ? await newestInputMtime(cemPath) : null;

  const { isStale, reason } = compareFreshness(metaMtime, cemMtime);

  // `compareFreshness` distinguishes "fresh" from "could not check", and the
  // exit code cannot: both are 0, deliberately, so `pnpm build` keeps working
  // without docs dependencies. Printing the reason is what stops the two from
  // being indistinguishable to whoever reads the build log -- the same
  // conflation that hid issue #43 for months, in a branch that is otherwise
  // correct to be lenient.
  console.error(`[metadata-freshness] ${REASON_TEXT[reason]}`);

  process.exit(isStale ? 1 : 0);
}

// Run only when invoked directly, not when imported by tests
const invokedDirectly = process.argv[1]
  ? path.resolve(process.argv[1]) === __filename
  : false;
if (invokedDirectly) {
  void main();
}

// Test-only seam (tests/AGENTS.md, "Internals Exported for Test Coverage").
export { newestInputMtime };

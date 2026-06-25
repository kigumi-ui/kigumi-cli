import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const PRO_PACKAGE = '@awesome.me/webawesome-pro';
const PRO_STORE_PREFIX = '@awesome.me+webawesome-pro@';
const CEM_SUBPATH =
  'node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json';

/**
 * Resolve the Web Awesome Pro version pinned in `docs/package.json`. The pin is
 * exact (no `^`/`~`), but any leading range operators are stripped defensively.
 * Returns null when the file or dependency entry is unreadable, in which case
 * callers fall back to "highest installed version wins".
 */
function resolvePinnedProVersion(): string | null {
  try {
    const pkg = fs.readJsonSync(path.join(PROJECT_ROOT, 'docs/package.json'));
    const spec: unknown =
      pkg?.dependencies?.[PRO_PACKAGE] ?? pkg?.devDependencies?.[PRO_PACKAGE];
    if (typeof spec !== 'string') return null;
    const version = spec.replace(/^[\s^~>=<]+/, '').trim();
    return version || null;
  } catch {
    return null;
  }
}

/**
 * Order the pnpm-store dirs to probe for the Pro CEM. When a pinned version is
 * resolvable, only dirs matching that exact version are returned (the store dir
 * is `@awesome.me+webawesome-pro@<version>` optionally followed by a
 * `_<peer-hash>` suffix). This prevents a stale higher version left in the
 * store from silently winning over the pinned one (finding F-152). When no pin
 * resolves, or no dir matches it, fall back to the legacy "highest wins" sort.
 */
function selectProStoreDirs(
  storeDirs: string[],
  pinnedVersion: string | null
): string[] {
  const proDirs = storeDirs.filter((dir) => dir.startsWith(PRO_STORE_PREFIX));

  if (pinnedVersion) {
    const exact = `${PRO_STORE_PREFIX}${pinnedVersion}`;
    const pinned = proDirs.filter(
      (dir) => dir === exact || dir.startsWith(`${exact}_`)
    );
    if (pinned.length > 0) return pinned;
  }

  return proDirs.sort().reverse();
}

/**
 * Find the Web Awesome Pro custom-elements.json on disk. Returns the absolute
 * path, or null when the file is unreachable (e.g. docs/ deps not installed).
 *
 * Two locations are probed, in order:
 *   1. docs/node_modules/.pnpm/@awesome.me+webawesome-pro@<version>/...
 *      The version pinned in docs/package.json is preferred; only when no pin
 *      is resolvable does the highest installed version win.
 *   2. docs/node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json
 *      (the non-pnpm fallback)
 */
export async function findCustomElementsJson(): Promise<string | null> {
  const pnpmPath = path.join(PROJECT_ROOT, 'docs/node_modules/.pnpm');

  if (await fs.pathExists(pnpmPath)) {
    const dirs = selectProStoreDirs(
      await fs.readdir(pnpmPath),
      resolvePinnedProVersion()
    );

    for (const dir of dirs) {
      const jsonPath = path.join(pnpmPath, dir, CEM_SUBPATH);
      if (await fs.pathExists(jsonPath)) {
        return jsonPath;
      }
    }
  }

  const regularPath = path.join(
    PROJECT_ROOT,
    'docs/node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json'
  );

  if (await fs.pathExists(regularPath)) {
    return regularPath;
  }

  return null;
}

/**
 * Synchronous counterpart to {@link findCustomElementsJson}, for callers that
 * run inside synchronous validation pipelines (e.g. validate:cem-sync). Probes
 * the same two locations in the same order and honours the same pin.
 */
export function findCustomElementsJsonSync(): string | null {
  const pnpmPath = path.join(PROJECT_ROOT, 'docs/node_modules/.pnpm');

  if (fs.pathExistsSync(pnpmPath)) {
    const dirs = selectProStoreDirs(
      fs.readdirSync(pnpmPath),
      resolvePinnedProVersion()
    );

    for (const dir of dirs) {
      const jsonPath = path.join(pnpmPath, dir, CEM_SUBPATH);
      if (fs.pathExistsSync(jsonPath)) {
        return jsonPath;
      }
    }
  }

  const regularPath = path.join(
    PROJECT_ROOT,
    'docs/node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json'
  );

  if (fs.pathExistsSync(regularPath)) {
    return regularPath;
  }

  return null;
}

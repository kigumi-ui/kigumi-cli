import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Find the Web Awesome Pro custom-elements.json on disk. Returns the absolute
 * path, or null when the file is unreachable (e.g. docs/ deps not installed).
 *
 * Two locations are probed, in order:
 *   1. docs/node_modules/.pnpm/@awesome.me+webawesome-pro@*\/...
 *      (sorted descending so the newest installed version wins when more than
 *      one is hoisted)
 *   2. docs/node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json
 *      (the non-pnpm fallback)
 */
export async function findCustomElementsJson(): Promise<string | null> {
  const pnpmPath = path.join(PROJECT_ROOT, 'docs/node_modules/.pnpm');

  if (await fs.pathExists(pnpmPath)) {
    const pnpmDirs = await fs.readdir(pnpmPath);
    const webAwesomeDirs = pnpmDirs
      .filter((dir) => dir.startsWith('@awesome.me+webawesome-pro@'))
      .sort()
      .reverse();

    for (const dir of webAwesomeDirs) {
      const jsonPath = path.join(
        pnpmPath,
        dir,
        'node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json'
      );
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
 * the same two locations in the same order.
 */
export function findCustomElementsJsonSync(): string | null {
  const pnpmPath = path.join(PROJECT_ROOT, 'docs/node_modules/.pnpm');

  if (fs.pathExistsSync(pnpmPath)) {
    const webAwesomeDirs = fs
      .readdirSync(pnpmPath)
      .filter((dir) => dir.startsWith('@awesome.me+webawesome-pro@'))
      .sort()
      .reverse();

    for (const dir of webAwesomeDirs) {
      const jsonPath = path.join(
        pnpmPath,
        dir,
        'node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json'
      );
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

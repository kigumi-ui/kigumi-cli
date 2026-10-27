/**
 * Scaffold pin guard
 *
 * An E2E or integration test that runs `create vite` without a version floats
 * to the latest release. create-vite 9.3.2 shipped without its react-ts
 * template and broke every such test at once. The pin is CREATE_VITE_VERSION
 * in src/constants.ts.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIRS = ['tests/e2e', 'tests/integration'];

// `create vite` in a shell string, or 'create', 'vite' in an argv array,
// not followed by `@`.
const UNPINNED = /\bcreate\s+vite(?!@)\b|'create',\s*'vite'(?!@)/;

export function findUnpinnedScaffolds(file: string, source: string): string[] {
  return source
    .split('\n')
    .flatMap((line, i) => (UNPINNED.test(line) ? [`${file}:${i + 1}`] : []));
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(path.join(ROOT, dir), {
    withFileTypes: true,
  });
  const nested = await Promise.all(
    entries.map(async (e) =>
      e.isDirectory()
        ? listFiles(path.join(dir, e.name))
        : [path.join(dir, e.name)]
    )
  );
  return nested.flat();
}

describe('e2e scaffold pins', () => {
  it('flags an unpinned create vite call', () => {
    expect(findUnpinnedScaffolds('x.ts', "['create', 'vite', '.']")).toEqual([
      'x.ts:1',
    ]);
    expect(findUnpinnedScaffolds('x.ts', 'pnpm create vite .')).toEqual([
      'x.ts:1',
    ]);
  });

  it('accepts a pinned call', () => {
    expect(
      findUnpinnedScaffolds('x.ts', "['create', `vite@${V}`, '.']")
    ).toEqual([]);
  });

  it('has no unpinned create vite call under tests/e2e or tests/integration', async () => {
    const files = (await Promise.all(DIRS.map(listFiles)))
      .flat()
      .filter((f) => /\.(ts|tsx|js|mjs)$/.test(f));
    expect(files.length).toBeGreaterThan(0);
    const hits: string[] = [];
    for (const f of files) {
      const src = await fs.readFile(path.join(ROOT, f), 'utf-8');
      hits.push(...findUnpinnedScaffolds(f, src));
    }
    expect(hits).toEqual([]);
  });
});

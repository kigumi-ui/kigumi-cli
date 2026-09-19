/**
 * Docs wrappers sit in front of Web Awesome JSX types that declare
 * `ref?: T | ((e: T) => void)`. A React RefObject is neither, so
 * `docs` `tsc -b` fails on object host refs (WA 3.13 Vercel). Templates
 * already emit `ref={setXxxRef}`; this guard keeps the hand-maintained
 * docs copies on the same contract.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_UI = resolve(__dirname, '../..', 'docs/src/components/ui');

/** Host ref that is not a `setXxxRef` callback. */
const OBJECT_HOST_REF = /ref=\{(?!set)[a-zA-Z]+Ref\}/;

function* walkTsx(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkTsx(full);
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      yield full;
    }
  }
}

function stripCommentsAndExamples(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('docs wrappers use callback refs on wa-* hosts', () => {
  it('no docs/src/components/ui TSX passes an object ref to a host', () => {
    expect(statSync(DOCS_UI).isDirectory()).toBe(true);

    const violations: string[] = [];
    for (const file of walkTsx(DOCS_UI)) {
      const body = stripCommentsAndExamples(readFileSync(file, 'utf-8'));
      if (!body.includes('<wa-')) continue;
      if (OBJECT_HOST_REF.test(body)) {
        const rel = file.replace(DOCS_UI + '/', '');
        violations.push(rel);
      }
    }

    expect(
      violations,
      `Object host ref on <wa-*> (use ref={setXxxRef}):\n${violations.join('\n')}`
    ).toEqual([]);
  });
});

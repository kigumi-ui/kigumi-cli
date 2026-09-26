/**
 * Tests for the scripts' entry-point check.
 *
 * The comparison it replaced, `process.argv[1] === __filename`, failed when a
 * script was invoked by an absolute path through a symlinked directory: Node
 * hands `import.meta.url` over as the real path and `argv[1]` as typed, so
 * `main()` was skipped and the script exited 0 having done nothing.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isEntryPoint } from '../../../scripts/is-entry-point.js';

describe('isEntryPoint', () => {
  let root: string;
  let script: string;
  let linkedScript: string;

  beforeAll(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'entry-')));
    fs.mkdirSync(path.join(root, 'real'));
    script = path.join(root, 'real', 'script.ts');
    fs.writeFileSync(script, '');
    fs.symlinkSync(path.join(root, 'real'), path.join(root, 'link'), 'dir');
    linkedScript = path.join(root, 'link', 'script.ts');
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('matches when argv[1] is the module path', () => {
    expect(isEntryPoint(pathToFileURL(script).href, script)).toBe(true);
  });

  it('matches when argv[1] reaches the module through a symlink', () => {
    // Premise: the two spellings differ, so a plain string compare would fail.
    expect(linkedScript).not.toBe(script);
    expect(isEntryPoint(pathToFileURL(script).href, linkedScript)).toBe(true);
  });

  it('does not match another script', () => {
    const other = path.join(root, 'real', 'other.ts');
    fs.writeFileSync(other, '');
    expect(isEntryPoint(pathToFileURL(script).href, other)).toBe(false);
  });

  it('does not match when argv[1] is missing or names no file', () => {
    expect(isEntryPoint(pathToFileURL(script).href, undefined)).toBe(false);
    expect(
      isEntryPoint(pathToFileURL(script).href, path.join(root, 'nope.ts'))
    ).toBe(false);
  });
});

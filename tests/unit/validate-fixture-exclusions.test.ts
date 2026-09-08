/**
 * Tests for the fixture-exclusion matchers.
 *
 * Synthetic throughout: nothing reads the repo's real ignore files, so these
 * cannot start passing because someone edited .prettierignore.
 */
import { describe, expect, it } from 'vitest';

import {
  extractArray,
  globListCovers,
  prettierIgnoreCovers,
} from '../../scripts/validate-fixture-exclusions.js';

const DIR = 'tests/fixtures/starter-snapshots';

describe('prettierIgnoreCovers', () => {
  it('accepts a bare directory path, which is how gitignore syntax works', () => {
    expect(prettierIgnoreCovers(`node_modules\n${DIR}\n`, DIR)).toBe(true);
  });

  it('accepts trailing-slash and /** forms', () => {
    expect(prettierIgnoreCovers(`${DIR}/\n`, DIR)).toBe(true);
    expect(prettierIgnoreCovers(`${DIR}/**\n`, DIR)).toBe(true);
  });

  it('accepts a ./-prefixed path', () => {
    expect(prettierIgnoreCovers(`./${DIR}\n`, DIR)).toBe(true);
  });

  it('is false when the directory is absent', () => {
    expect(prettierIgnoreCovers('node_modules\ndist\n', DIR)).toBe(false);
  });

  it('does not count a commented-out entry', () => {
    expect(prettierIgnoreCovers(`# ${DIR}\n`, DIR)).toBe(false);
  });

  it('does not count a mere prefix of the path', () => {
    // "tests/fixtures" would not actually be what the repo excludes.
    expect(prettierIgnoreCovers('tests/fixtures\n', DIR)).toBe(false);
  });
});

describe('globListCovers', () => {
  it('accepts the bare, /** and /**/* forms', () => {
    expect(globListCovers([DIR], DIR)).toBe(true);
    expect(globListCovers([`${DIR}/**`], DIR)).toBe(true);
    expect(globListCovers([`${DIR}/**/*`], DIR)).toBe(true);
  });

  it('finds the entry among unrelated globs', () => {
    expect(globListCovers(['dist/**', 'docs/**', `${DIR}/**`], DIR)).toBe(true);
  });

  it('is false for an empty or unrelated list', () => {
    expect(globListCovers([], DIR)).toBe(false);
    expect(globListCovers(['dist/**', 'coverage/**'], DIR)).toBe(false);
  });

  it('does not accept a sibling directory', () => {
    expect(globListCovers(['tests/fixtures/migration/**'], DIR)).toBe(false);
  });
});

describe('extractArray', () => {
  it('reads a single-quoted JS array', () => {
    expect(extractArray("ignores: ['dist/**', 'docs/**'],", 'ignores')).toEqual(
      ['dist/**', 'docs/**']
    );
  });

  it('reads a double-quoted JSON array', () => {
    expect(
      extractArray('"exclude": ["node_modules", "dist"]', 'exclude')
    ).toEqual(['node_modules', 'dist']);
  });

  it('reads an array spanning several lines', () => {
    const source = `
      ignores: [
        'dist/**',
        '${DIR}/**',
      ],
    `;
    expect(extractArray(source, 'ignores')).toContain(`${DIR}/**`);
  });

  it('returns nothing when the key is absent', () => {
    expect(extractArray('rules: {}', 'ignores')).toEqual([]);
  });
});

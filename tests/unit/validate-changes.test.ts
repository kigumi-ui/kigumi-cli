/**
 * Validate Changes Tests
 *
 * Tests for scripts/validate-changes.ts - AI guard-rail checks.
 *
 * Two tiers, deliberately:
 *
 * 1. Structural tests against the real repo state, which catch "the script
 *    crashed" or "its output shape changed".
 * 2. Table tests over the pure `scanAntiPatterns` matcher, which catch "the
 *    rule silently stopped matching". Tier 1 alone cannot do this: a check
 *    that matches nothing still reports a well-formed passing result. The
 *    previous `className` anti-pattern was written backwards and reported
 *    green for months precisely because only tier 1 existed.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import {
  validateChanges,
  scanAntiPatterns,
  findFiles,
} from '../../scripts/validate-changes.js';

describe('validate:changes', () => {
  describe('validateChanges (structural)', () => {
    it('should return a valid result structure', async () => {
      const result = await validateChanges();

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should derive passed from the absence of errors', async () => {
      const result = await validateChanges();

      expect(result.passed).toBe(result.errors.length === 0);
    });

    it('should keep issue counts consistent with reported issues', async () => {
      const result = await validateChanges();

      expect(result.stats.issuesFound).toBe(
        result.errors.length + result.warnings.length
      );
    });
  });

  describe('scanAntiPatterns (detection)', () => {
    it('should flag .hide() on a dialog-like API', () => {
      const found = scanAntiPatterns('  dialog.hide();', 'src/example.ts');

      expect(found).toHaveLength(1);
      expect(found[0].message).toContain('requestClose()');
      expect(found[0].severity).toBe('error');
    });

    it('should report the 1-indexed line number of the violation', () => {
      const content = ['const a = 1;', 'const b = 2;', 'el.hide();'].join('\n');

      const found = scanAntiPatterns(content, 'src/example.ts');

      expect(found).toHaveLength(1);
      expect(found[0].line).toBe(3);
    });

    it('should flag every occurrence, not just the first', () => {
      const content = ['a.hide();', 'b.hide();'].join('\n');

      expect(scanAntiPatterns(content, 'src/example.ts')).toHaveLength(2);
    });

    it('should attribute findings to the file it was given', () => {
      const found = scanAntiPatterns('x.hide();', 'src/components/Thing.tsx');

      expect(found[0].file).toBe('src/components/Thing.tsx');
    });

    it.each([
      ['the approved replacement API', 'dialog.requestClose();'],
      ['an unrelated method', 'element.show();'],
      ['a similarly named identifier', 'const hidden = isHide();'],
      ['ordinary code', 'export const value = 42;'],
      ['empty content', ''],
    ])('should not flag %s', (_label, content) => {
      expect(scanAntiPatterns(content, 'src/example.ts')).toEqual([]);
    });

    it('should not flag className usage', () => {
      // The class/className rule was deliberately removed: a line regex cannot
      // see multi-line JSX. This asserts the removal is intentional, so a
      // future regex re-added here fails loudly instead of silently.
      const content = '<wa-button className={styles.x}>Click</wa-button>';

      expect(scanAntiPatterns(content, 'src/example.tsx')).toEqual([]);
    });
  });
  describe('findFiles (glob matching)', () => {
    // Built on disk rather than mocked: the defects these pin were in how the
    // old hand-rolled walker read real directory entries, so a fake fs would
    // have reproduced the abstraction rather than the bug.
    let tmp: string;

    beforeAll(async () => {
      tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-findfiles-'));
      await Promise.all([
        fs.outputFile(path.join(tmp, 'src/real.ts'), ''),
        fs.outputFile(path.join(tmp, 'src/plain.ts'), ''),
        fs.outputFile(path.join(tmp, 'src/thing.test.ts'), ''),
        fs.outputFile(path.join(tmp, 'src/types.d.ts'), ''),
        // A file whose name merely CONTAINS the ignored suffix.
        fs.outputFile(path.join(tmp, 'src/thing.test.ts.bak.ts'), ''),
        // A directory whose name merely CONTAINS the ignored suffix.
        fs.outputFile(path.join(tmp, 'src/my.d.ts-helpers/keep.ts'), ''),
        fs.outputFile(path.join(tmp, 'src/deep/Nested.tsx'), ''),
        fs.outputFile(path.join(tmp, 'src/Button.tsx'), ''),
        fs.outputFile(path.join(tmp, 'src/Button.stories.tsx'), ''),
      ]);
    });

    afterAll(async () => {
      await fs.remove(tmp);
    });

    it('should ignore a suffix without swallowing names that merely contain it', async () => {
      const found = await findFiles('src/**/*.ts', {
        cwd: tmp,
        ignore: ['**/*.test.ts', '**/*.d.ts'],
      });

      expect(found).toContain(path.join('src', 'thing.test.ts.bak.ts'));
      expect(found).not.toContain(path.join('src', 'thing.test.ts'));
      expect(found).not.toContain(path.join('src', 'types.d.ts'));
    });

    it('should treat a bare suffix as a literal glob, not a substring', async () => {
      // The call sites used to pass bare '.d.ts' and '.test.ts', which the old
      // matcher stripped of glob characters and fed to String.includes(). That
      // made '.d.ts' match the DIRECTORY 'src/my.d.ts-helpers/' and skip every
      // file beneath it. A validator that never reads a file still reports a
      // pass, which is the failure this pins.
      //
      // Passing those same bare values now matches nothing, so the directory
      // survives. The suffix form the call sites use lives in the test above.
      const found = await findFiles('src/**/*.ts', {
        cwd: tmp,
        ignore: ['.test.ts', '.d.ts'],
      });

      expect(found).toContain(path.join('src', 'my.d.ts-helpers', 'keep.ts'));
      expect(found).toContain(path.join('src', 'thing.test.ts'));
    });

    it('should anchor a single-star segment to one directory level', async () => {
      const found = await findFiles('src/*.tsx', { cwd: tmp });

      expect(found).toContain(path.join('src', 'Button.tsx'));
      expect(found).not.toContain(path.join('src', 'deep', 'Nested.tsx'));
    });

    it('should match a star that is not in the leading position', async () => {
      const found = await findFiles('src/Button.*', { cwd: tmp });

      expect(found.sort()).toEqual([
        path.join('src', 'Button.stories.tsx'),
        path.join('src', 'Button.tsx'),
      ]);
    });

    it('should return no matches rather than throwing for a missing directory', async () => {
      await expect(
        findFiles('does-not-exist/**/*.ts', { cwd: tmp })
      ).resolves.toEqual([]);
    });
  });
});

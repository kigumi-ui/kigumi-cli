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

import { describe, it, expect } from 'vitest';
import {
  validateChanges,
  scanAntiPatterns,
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
});

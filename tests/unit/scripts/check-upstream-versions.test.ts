import { describe, expect, it } from 'vitest';
import {
  isMajorBump,
  majorOf,
  parsePinned,
  readWebAwesomePin,
} from '../../../scripts/check-upstream-versions.js';

/**
 * Internals exported for test coverage: `parsePinned`, `majorOf`,
 * `isMajorBump` and `readWebAwesomePin` are the version matchers, pulled out
 * of the reporter so the major-boundary rule can be asserted without reaching
 * the npm registry. Registered in tests/AGENTS.md.
 */
describe('check-upstream-versions matchers (test-only seams)', () => {
  describe('parsePinned', () => {
    it('strips the caret from a normal dependency range', () => {
      expect(parsePinned('^6.0.3')).toBe('6.0.3');
    });

    it('strips a tilde and comparison operators', () => {
      expect(parsePinned('~4.1.9')).toBe('4.1.9');
      expect(parsePinned('>=15.0.0')).toBe('15.0.0');
    });

    it('leaves an exact pin alone', () => {
      // Web Awesome is exact-pinned on purpose; the pin must survive intact.
      expect(parsePinned('3.10.0')).toBe('3.10.0');
    });

    it('tolerates surrounding whitespace', () => {
      expect(parsePinned('  ^2.0.0  ')).toBe('2.0.0');
    });
  });

  describe('majorOf', () => {
    it('reads the leading number', () => {
      expect(majorOf('6.0.3')).toBe(6);
      expect(majorOf('15.0.0')).toBe(15);
    });

    it('reads a zero major', () => {
      expect(majorOf('0.27.2')).toBe(0);
    });

    it('returns null when there is no parseable major', () => {
      expect(majorOf('latest')).toBeNull();
      expect(majorOf('')).toBeNull();
      expect(majorOf('next')).toBeNull();
    });
  });

  describe('isMajorBump', () => {
    it('flags the TypeScript 6 to 7 jump that motivated this check', () => {
      // TypeScript 7 removing baseUrl broke `kigumi init` with no change here.
      expect(isMajorBump('6.0.3', '7.0.2')).toBe(true);
    });

    it('ignores a minor or patch release', () => {
      expect(isMajorBump('3.10.0', '3.12.0')).toBe(false);
      expect(isMajorBump('3.10.0', '3.10.1')).toBe(false);
    });

    it('ignores an identical version', () => {
      expect(isMajorBump('4.1.9', '4.1.9')).toBe(false);
    });

    it('does not flag a downgrade', () => {
      // A yanked release can make latest lower than the pin. Not a bump.
      expect(isMajorBump('7.0.0', '6.9.0')).toBe(false);
    });

    it('stays quiet when either side is unparseable', () => {
      // Reporting on garbage is worse than reporting nothing.
      expect(isMajorBump('latest', '7.0.0')).toBe(false);
      expect(isMajorBump('6.0.3', 'next')).toBe(false);
    });
  });

  describe('readWebAwesomePin', () => {
    it('reads the version out of the constant that owns it', () => {
      const source = "export const DEFAULT_WEBAWESOME_VERSION = '3.10.0';";
      expect(readWebAwesomePin(source)).toBe('3.10.0');
    });

    it('tolerates whitespace around the assignment', () => {
      const source = "export const DEFAULT_WEBAWESOME_VERSION   =   '3.12.0';";
      expect(readWebAwesomePin(source)).toBe('3.12.0');
    });

    it('returns null when the constant is absent', () => {
      // Renaming the constant must surface as "cannot read", never as a
      // silent comparison against the wrong value.
      expect(readWebAwesomePin('export const SOMETHING_ELSE = "3.10.0";')).toBe(
        null
      );
    });
  });
});

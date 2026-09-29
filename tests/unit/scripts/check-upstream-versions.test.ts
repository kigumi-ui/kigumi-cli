import { describe, expect, it } from 'vitest';
import {
  classifyScaffold,
  groupStatus,
  isHeld,
  isMajorBump,
  majorOf,
  parsePinned,
  readHolds,
  type UpstreamHold,
  type VersionDrift,
} from '../../../scripts/check-upstream-versions.js';

/**
 * Internals exported for test coverage: `parsePinned`, `majorOf`,
 * `isMajorBump`, `classifyScaffold`, `groupStatus`, `readHolds` and `isHeld`
 * are the version matchers, pulled out of the reporter so the
 * major-boundary, hold and did-not-run rules can be asserted without
 * reaching the npm registry. Registered in tests/AGENTS.md.
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

  describe('readHolds', () => {
    it('returns an empty object when the holds file does not exist', () => {
      expect(readHolds('/nonexistent/upstream-holds.json')).toEqual({});
    });
  });

  describe('isHeld', () => {
    const held: UpstreamHold = {
      upTo: '7.0.2',
      reason: 'TS7 removes baseUrl and breaks kigumi init',
    };

    it('covers the exact held version', () => {
      expect(isHeld('7.0.2', held)).toBe(true);
    });

    it('covers a later patch or minor within the same held major', () => {
      // The hold is a decision about the major, not the exact patch that was
      // on npm the week it was written.
      expect(isHeld('7.1.0', held)).toBe(true);
      expect(isHeld('7.0.9', held)).toBe(true);
    });

    it('does not cover a major newer than the one held', () => {
      // A hold against 7.0.2 has never seen 8.x; that is new information.
      expect(isHeld('8.0.0', held)).toBe(false);
    });

    it('does not cover a major older than the one held', () => {
      expect(isHeld('6.9.0', held)).toBe(false);
    });

    it('is false when there is no hold for the package', () => {
      expect(isHeld('7.0.2', undefined)).toBe(false);
    });

    it('stays quiet when either side is unparseable', () => {
      expect(isHeld('latest', held)).toBe(false);
      expect(isHeld('7.0.2', { upTo: 'next', reason: 'n/a' })).toBe(false);
    });
  });

  describe('classifyScaffold', () => {
    const angular22: UpstreamHold = {
      upTo: '22.2.0',
      reason: 'init output fails ngc on TypeScript 6',
    };

    it('is current when the pin is the latest release', () => {
      expect(
        classifyScaffold('@angular/cli', '21.2.24', '21.2.24', undefined)
      ).toEqual({ kind: 'current' });
    });

    it('reports a minor or patch release, since the pin is exact', () => {
      expect(
        classifyScaffold('create-vite', '9.2.1', '9.3.0', undefined)
      ).toEqual({
        kind: 'drift',
        drift: {
          name: 'create-vite',
          current: '9.2.1',
          latest: '9.3.0',
          majorBump: false,
        },
      });
    });

    it('reports a major nobody has held', () => {
      expect(
        classifyScaffold('@angular/cli', '21.2.24', '22.2.0', undefined)
      ).toMatchObject({ kind: 'drift', drift: { majorBump: true } });
    });

    it('holds a major the holds file covers', () => {
      expect(
        classifyScaffold('@angular/cli', '21.2.24', '22.3.1', angular22)
      ).toMatchObject({ kind: 'held', drift: { latest: '22.3.1' } });
    });

    it('reports a major newer than the held one', () => {
      expect(
        classifyScaffold('@angular/cli', '21.2.24', '23.0.0', angular22)
      ).toMatchObject({ kind: 'drift', drift: { majorBump: true } });
    });

    it('never holds a release inside the pinned major', () => {
      // A hold records a decision about a major. A newer patch of the
      // pinned major is not that decision and still reports.
      const held21: UpstreamHold = { upTo: '21.0.0', reason: 'n/a' };
      expect(
        classifyScaffold('@angular/cli', '21.2.24', '21.2.25', held21)
      ).toMatchObject({ kind: 'drift', drift: { majorBump: false } });
    });
  });

  describe('groupStatus', () => {
    const scaffolds = ['create-vite', '@angular/cli'];
    const drift: VersionDrift = {
      name: 'create-vite',
      current: '9.2.1',
      latest: '9.3.0',
      majorBump: false,
    };

    it('is current when every package was compared and none drifted', () => {
      expect(groupStatus([], scaffolds, [])).toBe('current');
    });

    it('is unchecked, never current, when a lookup failed', () => {
      // docs/adr/0003: a check that did not run may not read as a pass.
      expect(groupStatus([], scaffolds, ['@angular/cli'])).toBe('unchecked');
    });

    it('ignores a failed lookup from another group', () => {
      expect(groupStatus([], scaffolds, ['typescript'])).toBe('current');
    });

    it('reports drift found in the packages that were reached', () => {
      expect(groupStatus([drift], scaffolds, ['@angular/cli'])).toBe('drift');
    });
  });
});

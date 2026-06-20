/**
 * Version Map Tests
 *
 * Tests for src/utils/version-map.ts
 */

import { describe, it, expect } from 'vitest';
import {
  VERSION_MAP,
  getVersionEntry,
  getLatestVersion,
  getBreakingChangesBetween,
  getVersionsBetween,
} from '../../src/utils/version-map.js';

describe('VERSION_MAP', () => {
  it('is sorted newest first', () => {
    function compareSemver(a: string, b: string): number {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    }

    for (let i = 0; i < VERSION_MAP.length - 1; i++) {
      const current = VERSION_MAP[i].kigumiVersion;
      const next = VERSION_MAP[i + 1].kigumiVersion;
      expect(compareSemver(current, next)).toBeGreaterThanOrEqual(0);
    }
  });

  it('every entry has required fields', () => {
    for (const entry of VERSION_MAP) {
      expect(entry.kigumiVersion).toMatch(/^\d+\.\d+\.\d+$/);
      expect(entry.webAwesomeVersion).toBeTruthy();
      expect(entry.releasedAt).toBeTruthy();
      expect(Array.isArray(entry.breakingChanges)).toBe(true);
    }
  });

  it('pins every Web Awesome version exactly (no ^ or ~ ranges)', () => {
    // F-146: kigumi releases are conformant to a specific WA version and must
    // never auto-float. Every map entry stores an exact version.
    for (const entry of VERSION_MAP) {
      expect(entry.webAwesomeVersion).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('has a 0.20.0 entry pinned exactly to Web Awesome 3.5.0', () => {
    const entry = VERSION_MAP.find((e) => e.kigumiVersion === '0.20.0');
    expect(entry).toBeDefined();
    expect(entry!.webAwesomeVersion).toBe('3.5.0');
  });
});

describe('getVersionEntry', () => {
  it('returns entry for known version', () => {
    const entry = getVersionEntry('0.12.0');
    expect(entry).toBeDefined();
    expect(entry!.webAwesomeVersion).toBe('3.3.1');
  });

  it('returns entry for 0.18.0 with WA 3.4.0', () => {
    const entry = getVersionEntry('0.18.0');
    expect(entry).toBeDefined();
    expect(entry!.webAwesomeVersion).toBe('3.4.0');
    expect(entry!.breakingChanges).toHaveLength(2);
  });

  it('falls back to nearest version for patch releases', () => {
    const entry = getVersionEntry('0.18.1');
    expect(entry).toBeDefined();
    expect(entry!.kigumiVersion).toBe('0.18.0');
    expect(entry!.webAwesomeVersion).toBe('3.4.0');
  });

  it('falls back to latest entry for future versions', () => {
    const entry = getVersionEntry('99.99.99');
    expect(entry).toBeDefined();
    expect(entry!.kigumiVersion).toBe(VERSION_MAP[0].kigumiVersion);
  });

  it('returns undefined for version older than all entries', () => {
    const entry = getVersionEntry('0.0.1');
    expect(entry).toBeUndefined();
  });
});

describe('getLatestVersion', () => {
  it('returns the first entry in VERSION_MAP', () => {
    const latest = getLatestVersion();
    expect(latest).toBe(VERSION_MAP[0]);
  });
});

describe('getBreakingChangesBetween', () => {
  it('returns empty array when no breaking changes exist', () => {
    const changes = getBreakingChangesBetween('0.11.0', '0.12.0');
    expect(changes).toEqual([]);
  });

  it('returns breaking changes across multiple versions', () => {
    const changes = getBreakingChangesBetween('0.7.0', '0.12.0');
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0].description).toContain('onWa*');
  });

  it('returns empty for same version', () => {
    const changes = getBreakingChangesBetween('0.12.0', '0.12.0');
    expect(changes).toEqual([]);
  });

  it('returns WA 3.4.0 breaking changes for 0.12.0 to 0.18.0', () => {
    const changes = getBreakingChangesBetween('0.12.0', '0.18.0');
    expect(changes).toHaveLength(2);

    const sliderChange = changes.find((c) =>
      c.affectedComponents.includes('slider')
    );
    expect(sliderChange).toBeDefined();
    expect(sliderChange!.description).toContain('required');

    const inputChange = changes.find((c) =>
      c.affectedComponents.includes('input')
    );
    expect(inputChange).toBeDefined();
    expect(inputChange!.description).toContain('autocorrect');
  });
});

describe('getVersionsBetween', () => {
  it('returns versions in range (exclusive from, inclusive to)', () => {
    const versions = getVersionsBetween('0.10.0', '0.12.0');
    const versionStrings = versions.map((v) => v.kigumiVersion);
    expect(versionStrings).toContain('0.11.0');
    expect(versionStrings).toContain('0.12.0');
    expect(versionStrings).not.toContain('0.10.0');
  });

  it('returns empty for same version', () => {
    const versions = getVersionsBetween('0.12.0', '0.12.0');
    expect(versions).toEqual([]);
  });
});

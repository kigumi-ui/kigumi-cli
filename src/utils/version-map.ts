/**
 * Version Map
 *
 * Static data structure mapping Kigumi CLI versions to their compatible
 * Web Awesome versions and documenting breaking changes between versions.
 *
 * Maintained manually alongside CHANGELOG.md — each release with
 * component-affecting changes gets an entry.
 */

export interface BreakingChange {
  /** Human-readable description of the change */
  description: string;
  /** Which components are affected (empty array = all components) */
  affectedComponents: string[];
  /** Instructions for migrating */
  migrationGuide: string;
}

export interface VersionEntry {
  /** Kigumi CLI version */
  kigumiVersion: string;
  /** Compatible Web Awesome version range */
  webAwesomeVersion: string;
  /** Release date (ISO 8601) */
  releasedAt: string;
  /** Breaking changes from the previous version */
  breakingChanges: BreakingChange[];
}

/**
 * Compare two semver strings. Returns:
 * - negative if a < b
 * - 0 if a === b
 * - positive if a > b
 */
function compareSemver(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Version history — newest first.
 *
 * Each release that changes templates, WA version, or component APIs
 * should have an entry here. Add new entries at the TOP of the array.
 */
export const VERSION_MAP: VersionEntry[] = [
  {
    kigumiVersion: '0.13.0',
    webAwesomeVersion: '^3.4.0',
    releasedAt: '2026-03-25',
    breakingChanges: [
      {
        description:
          'Slider: `required` prop removed (WA 3.4.0 dropped the attribute)',
        affectedComponents: ['slider'],
        migrationGuide:
          'Remove the `required` prop from Slider components. Use custom validation if needed.',
      },
      {
        description:
          'Input: `autocorrect` prop type changed from string union to boolean',
        affectedComponents: ['input'],
        migrationGuide:
          'Change autocorrect="off" to autocorrect={false} and autocorrect="on" to autocorrect={true}.',
      },
    ],
  },
  {
    kigumiVersion: '0.12.0',
    webAwesomeVersion: '^3.3.1',
    releasedAt: '2026-03-01',
    breakingChanges: [],
  },
  {
    kigumiVersion: '0.11.0',
    webAwesomeVersion: '^3.2.1',
    releasedAt: '2026-02-15',
    breakingChanges: [],
  },
  {
    kigumiVersion: '0.10.0',
    webAwesomeVersion: '^3.2.1',
    releasedAt: '2026-02-01',
    breakingChanges: [],
  },
  {
    kigumiVersion: '0.8.0',
    webAwesomeVersion: '^3.1.0',
    releasedAt: '2026-01-15',
    breakingChanges: [
      {
        description:
          'Event handler props renamed from onWa* to on* (e.g., onWaChange → onChange)',
        affectedComponents: [],
        migrationGuide:
          'Rename event handler props: onWaChange → onChange, onWaInput → onInput, etc.',
      },
    ],
  },
];

/**
 * Get the version entry for a specific kigumi version.
 */
export function getVersionEntry(version: string): VersionEntry | undefined {
  return VERSION_MAP.find((e) => e.kigumiVersion === version);
}

/**
 * Get the latest version entry (first in the array).
 */
export function getLatestVersion(): VersionEntry {
  return VERSION_MAP[0];
}

/**
 * Get all breaking changes between two versions.
 *
 * Returns changes from versions > fromVersion and <= toVersion.
 */
export function getBreakingChangesBetween(
  fromVersion: string,
  toVersion: string
): BreakingChange[] {
  const changes: BreakingChange[] = [];

  for (const entry of VERSION_MAP) {
    if (
      compareSemver(entry.kigumiVersion, fromVersion) > 0 &&
      compareSemver(entry.kigumiVersion, toVersion) <= 0
    ) {
      changes.push(...entry.breakingChanges);
    }
  }

  return changes;
}

/**
 * Get all version entries between two versions (exclusive of from, inclusive of to).
 */
export function getVersionsBetween(
  fromVersion: string,
  toVersion: string
): VersionEntry[] {
  return VERSION_MAP.filter(
    (entry) =>
      compareSemver(entry.kigumiVersion, fromVersion) > 0 &&
      compareSemver(entry.kigumiVersion, toVersion) <= 0
  );
}

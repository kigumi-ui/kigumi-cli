/**
 * Version Check Utility
 *
 * Compares the running CLI version against the project's pinned kigumiVersion.
 * Used by commands like `add` to warn or block on version mismatches.
 */

import semver from 'semver';

export type VersionCheckResult =
  | { status: 'match' }
  | { status: 'minor-mismatch'; configVersion: string; cliVersion: string }
  | { status: 'major-mismatch'; configVersion: string; cliVersion: string }
  | { status: 'no-pin' }
  | { status: 'unparseable-pin'; configVersion: string };

/**
 * Parse a semver string. Returns null if it is not valid semver.
 *
 * Uses `semver.parse` rather than a regex so that `v` prefixes and
 * pre-release tags are handled by the same library that does the comparison
 * in {@link satisfiesMinimum}. The previous regex was anchored but not
 * terminated, so it accepted trailing junk (`1.2.3.4`) while rejecting
 * ordinary forms like `v1.2.3`.
 *
 * Deliberately NOT `semver.coerce`, which is lenient in ways that turn
 * corrupt input into a confident wrong answer: it reads `1.2.3.4` as
 * `1.2.3`, and flattens `1.0.0-beta.1` to `1.0.0`. A pin we cannot read
 * should be reported, not guessed at.
 */
function parseSemver(version: string): semver.SemVer | null {
  return semver.parse(version.trim());
}

/**
 * Check compatibility between project's pinned version and running CLI version.
 *
 * Rules:
 * - Same major+minor: match (proceed silently)
 * - Same major, different minor: minor-mismatch (warn but proceed)
 * - Different major: major-mismatch (hard error)
 * - No kigumiVersion in config: no-pin (info message, proceed)
 * - kigumiVersion present but not valid semver: unparseable-pin (warn, proceed)
 *
 * Exception: a project pinned to 0.x running against CLI 1.x is a
 * minor-mismatch, not a major-mismatch. 1.0.0 marked the surface as stable
 * rather than changing it, so every 0.x project is compatible with it. Without
 * this carve-out the 1.0.0 release would hard-fail `add` in every project that
 * existed before it, for a release that broke nothing. Later major jumps
 * (1.x -> 2.x) stay fatal.
 */
export function checkVersionCompatibility(
  configVersion: string | undefined,
  cliVersion: string
): VersionCheckResult {
  if (!configVersion) {
    return { status: 'no-pin' };
  }

  const parsedConfig = parseSemver(configVersion);
  const parsedCli = parseSemver(cliVersion);

  // An unreadable pin stays permissive: it is almost always a hand-edited or
  // corrupted config, and a bad string there must never stop `add` from
  // working. But it is reported rather than swallowed, because the real
  // consequence is that the compatibility check silently does not run. The
  // previous code returned 'match' here, which was indistinguishable from a
  // genuine match.
  if (!parsedConfig) {
    return { status: 'unparseable-pin', configVersion };
  }

  // An unparseable CLI version is our own bug, not the user's, and there is
  // nothing actionable for them in a warning about it. Stay silent.
  if (!parsedCli) {
    return { status: 'match' };
  }

  if (parsedConfig.major !== parsedCli.major) {
    // The 0.x -> 1.x step is the one major jump that changed no behaviour, so
    // it warns instead of blocking. See the rules note above.
    const isZeroToOne = parsedConfig.major === 0 && parsedCli.major === 1;
    return {
      status: isZeroToOne ? 'minor-mismatch' : 'major-mismatch',
      configVersion,
      cliVersion,
    };
  }

  if (parsedConfig.minor !== parsedCli.minor) {
    return {
      status: 'minor-mismatch',
      configVersion,
      cliVersion,
    };
  }

  return { status: 'match' };
}

/**
 * Returns true when `version` satisfies `>=minimum` per semver, including
 * pre-release versions in comparisons. Returns false on invalid input rather
 * than throwing — callers use this to gate non-fatal warnings.
 */
export function satisfiesMinimum(version: string, minimum: string): boolean {
  if (!semver.valid(version) || !semver.valid(minimum)) return false;
  return semver.satisfies(version, `>=${minimum}`, { includePrerelease: true });
}

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
  | { status: 'no-pin' };

/**
 * Parse a semver string into major.minor.patch numbers.
 * Returns null if the string is not a valid semver.
 */
function parseSemver(
  version: string
): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Check compatibility between project's pinned version and running CLI version.
 *
 * Rules:
 * - Same major+minor: match (proceed silently)
 * - Same major, different minor: minor-mismatch (warn but proceed)
 * - Different major: major-mismatch (hard error)
 * - No kigumiVersion in config: no-pin (info message, proceed)
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

  // If either version can't be parsed, treat as match to avoid blocking
  if (!parsedConfig || !parsedCli) {
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

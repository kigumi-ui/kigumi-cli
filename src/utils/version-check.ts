/**
 * Version Check Utility
 *
 * Compares the running CLI version against the project's pinned kigumiVersion.
 * Used by commands like `add` to warn or block on version mismatches.
 */

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
    return {
      status: 'major-mismatch',
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

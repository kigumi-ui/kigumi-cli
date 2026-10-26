/**
 * Skip Reasons
 *
 * PURPOSE: Why `kigumi add` left a component on disk alone, and what it says
 * about it. Each reason asks something different of the user, so each gets
 * its own lines (issue #177); both installers and the summary read them here.
 *
 * EXPORTS:
 * - SkipReason - Why a component was skipped
 * - SKIP_REASONS - Every reason, in the order the summary lists them
 * - skipLine - The spinner line for one skipped component
 * - skipSummary - The summary line for all components skipped for one reason
 */

import pc from 'picocolors';

/**
 * - `exists`: `--all` without `--force` never touches an installed component
 * - `declined`: the user answered no to the overwrite prompt
 * - `up-to-date`: every file already matches, so there was nothing to write
 */
export type SkipReason = 'exists' | 'declined' | 'up-to-date';

const MESSAGES: Record<
  SkipReason,
  { line: (name: string) => string; summary: (count: number) => string }
> = {
  'up-to-date': {
    line: (name) => `${pc.dim('○')} ${name} is already up to date`,
    summary: (n) => `${n} component(s) already up to date`,
  },
  exists: {
    line: (name) =>
      `${pc.yellow('○')} Skipped ${name} (already installed, pass --force to overwrite)`,
    summary: (n) =>
      `Skipped ${n} installed component(s): pass --force to overwrite`,
  },
  declined: {
    line: (name) => `${pc.yellow('○')} Kept your local version of ${name}`,
    summary: (n) => `Kept your local version of ${n} component(s)`,
  },
};

export const SKIP_REASONS = Object.keys(MESSAGES) as SkipReason[];

export function skipLine(name: string, reason: SkipReason): string {
  return MESSAGES[reason].line(pc.cyan(name));
}

export function skipSummary(reason: SkipReason, count: number): string {
  return MESSAGES[reason].summary(count);
}

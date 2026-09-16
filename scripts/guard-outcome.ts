/**
 * Shared reporting vocabulary for validators that depend on a Custom Elements
 * Manifest (CEM).
 *
 * Two guards have now shipped the same defect: a module could not reach its
 * input, returned empty, and the caller read empty as "everything is fine".
 *
 *   - Issue #43: Check A (`validate:generated-fresh`) printed
 *     "freshness check passed!" directly beneath its own skip notice.
 *   - `validate:cem-sync`: the prop-value half returned an empty attribute map
 *     when the CEM was absent and still printed "Prop-value drift: 0" and
 *     "CEM sync validation passed!". Output was byte-identical with and
 *     without the manifest on disk.
 *
 * The rule this module exists to enforce: **a guard may not report success for
 * a check it did not perform.** "Did it pass" and "did it actually run" are
 * separate facts, so `GuardSummary` carries both and only a fully verified run
 * may print an unqualified pass.
 *
 * Deciding what absence *means* stays with the caller (see `SummarizeOptions`).
 * A resolver reports facts; policy differs per guard, because the operations
 * differ: Check A regenerates every template and is dishonest against a partial
 * manifest, while a caller that merely enriches output may legitimately
 * continue without one. What no caller may do is map absence onto success.
 */

import type { CemVerdict } from './find-cem.js';

/** One thing a guard found wrong. `check` labels the sub-check that found it. */
export interface Finding {
  check: string;
  component: string;
  message: string;
}

export interface GuardResult {
  passed: boolean;
  findings: Finding[];
  /** Whether the guard had a manifest complete enough to run against. */
  cem: CemVerdict;
}

export interface GuardSummary {
  exitCode: number;
  /** True only when the guard actually ran against a complete manifest. */
  verified: boolean;
  headline: string;
  detail: string;
}

export interface SummarizeOptions {
  /**
   * Whether an unusable manifest may be tolerated. True only where the Pro
   * package genuinely cannot be installed -- fork pull requests, which receive
   * no secrets. Everywhere else an unusable manifest is a real failure.
   */
  allowSkip?: boolean;
  /**
   * What to call the thing that did or did not run, e.g. "Check A" or
   * "Prop-value drift". Appears in the skipped and could-not-run headlines.
   */
  label?: string;
  /** Headline for a fully verified, finding-free run. */
  passHeadline?: string;
  /** What the reader should do about an unusable manifest. */
  fixHint?: string;
}

const DEFAULT_LABEL = 'This check';
const DEFAULT_PASS_HEADLINE = 'Validation passed!';
const DEFAULT_FIX_HINT =
  'Install the Web Awesome Pro package so the guard can run against a\n' +
  'complete manifest (pnpm setup:npmrc, then install docs deps).';

/**
 * Turn a guard result into an exit code and a report.
 *
 * Exit codes are deliberately just 0 and 1. A distinct "could not check" code
 * (Nagios-style UNKNOWN=3) was considered and rejected: nothing reads the code
 * beyond zero/non-zero, and a second convention would only let the two guards
 * disagree. The distinction that matters is carried by `verified`, which is
 * what makes a skip legible as a skip.
 */
export function summarizeGuard(
  result: GuardResult,
  options: SummarizeOptions = {}
): GuardSummary {
  const label = options.label ?? DEFAULT_LABEL;

  if (result.findings.length > 0) {
    return {
      exitCode: 1,
      verified: result.cem.usable,
      headline: `Drift found (${result.findings.length})`,
      detail: result.findings
        .map((f) => `  [${f.check}] ${f.component}: ${f.message}`)
        .join('\n'),
    };
  }

  if (!result.cem.usable) {
    const skipAllowed = options.allowSkip ?? false;
    return {
      exitCode: skipAllowed ? 0 : 1,
      verified: false,
      headline: skipAllowed
        ? `${label} skipped, NOT verified: ${result.cem.reason}`
        : `${label} could not run: ${result.cem.reason}`,
      detail: skipAllowed
        ? `${label} is unguarded on this run. Expected only where the\n` +
          'Web Awesome Pro package cannot be installed (fork pull requests).'
        : (options.fixHint ?? DEFAULT_FIX_HINT),
    };
  }

  return {
    exitCode: 0,
    verified: true,
    headline: options.passHeadline ?? DEFAULT_PASS_HEADLINE,
    detail: `  Verified against the ${result.cem.reason}.`,
  };
}

/**
 * Whether a guard may treat an unusable manifest as a skip rather than a
 * failure.
 *
 * Permitted only where the Web Awesome Pro package genuinely cannot be
 * installed: a fork pull request, which receives no repository secrets.
 * Everywhere else an unusable manifest is a real failure, because tolerating it
 * everywhere is what let Check A skip on every CI run for months.
 *
 * This is the local/CI asymmetry pytest's maintainers recommend for the same
 * problem (pytest-dev/pytest#1364): skip where the dependency is legitimately
 * absent, fail where its absence means something is broken. The choice is made
 * here, at the call site, not inside the resolver.
 */
export function skipPermitted(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.KIGUMI_FRESHNESS_ALLOW_SKIP === '1') return true;
  // Outside CI a developer may not have the Pro package; keep local runs
  // usable, but still report them as unverified rather than as a pass.
  return env.CI !== 'true';
}

/**
 * Whether the Pro consumer tsc suite has what it typechecks against, and what
 * it reports when it does not (issue #79).
 *
 * The Free consumer installs from the public registry and always runs. The
 * Pro consumer needs the pinned Pro package, which this machine can get only
 * with a Web Awesome Pro token `init` finds and a registry that serves the
 * package with this machine's auth. Without it the consumer did not run, and
 * it says so in the guard-outcome vocabulary of docs/adr/0003:
 * `summarizeGuard` words the report and `skipPermitted` decides whether the
 * missing package is a skip or a failure. It is never a pass.
 *
 * `resolveProPackage` reports facts and takes the registry probe as an
 * argument, so every outcome can be asserted without a network or a token.
 * `consumerPremise` is the policy; `reportNotRun` settles the test.
 */

import { spawnSync } from 'node:child_process';
import os from 'node:os';
import {
  skipPermitted,
  summarizeGuard,
  type GuardSummary,
} from '../../../scripts/guard-outcome.js';
import type { CemVerdict } from '../../../scripts/find-cem.js';
import {
  NPM_PRO_REGISTRY,
  WEB_AWESOME_PRO_PACKAGE,
  WEB_AWESOME_SCOPE,
} from '../../../src/constants.js';

export type ConsumerPremise =
  { run: true } | { run: false; summary: GuardSummary };

/** What the registry said when asked for the pinned Pro package. */
export interface ProPackageProbe {
  ok: boolean;
  /** The version it served, or why it did not. */
  detail: string;
}

export interface ProPackageFacts {
  /** The Pro token `init` would find (`detectProTokenSync`), or null. */
  token: string | null;
  /** Asks the registry for the pinned Pro package with this machine's auth. */
  probe: () => ProPackageProbe;
}

/**
 * Whether this machine can install the pinned Pro package the way the Pro
 * consumer's `init` will. The verdict describes the Pro package, which is
 * also what ships the complete manifest the other guard-outcome callers need.
 */
export function resolveProPackage({
  token,
  probe,
}: ProPackageFacts): CemVerdict {
  if (!token) {
    return {
      usable: false,
      outcome: 'absent',
      reason: 'no Web Awesome Pro token, so `init` would install Free',
    };
  }

  const served = probe();
  if (!served.ok) {
    return {
      usable: false,
      outcome: 'absent',
      reason: `the registry does not serve the pinned Pro package to this machine (${served.detail})`,
    };
  }

  return {
    usable: true,
    outcome: 'complete',
    reason: `pinned Pro package (${served.detail})`,
  };
}

/**
 * `npm view` of the pinned Pro package, against the registry `init` points
 * the project at, with this machine's user config. npm and pnpm both
 * authenticate that registry from the `_authToken` line in `~/.npmrc`, and
 * neither reads WEBAWESOME_NPM_TOKEN (#160), so a machine this probe fails on
 * would fail the consumer's install too. Runs from the temp directory so no
 * project `.npmrc` takes part.
 */
export function probeProPackage(version: string): ProPackageProbe {
  const result = spawnSync(
    'npm',
    [
      'view',
      `${WEB_AWESOME_PRO_PACKAGE}@${version}`,
      'version',
      `--${WEB_AWESOME_SCOPE}:registry=${NPM_PRO_REGISTRY}`,
    ],
    { cwd: os.tmpdir(), encoding: 'utf8', timeout: 60_000 }
  );

  if (result.error) {
    return { ok: false, detail: `npm view: ${result.error.message}` };
  }
  const served = result.stdout.trim();
  if (result.status === 0 && served === version) {
    return { ok: true, detail: served };
  }
  const code = /npm error code (\S+)/.exec(result.stderr)?.[1];
  return {
    ok: false,
    detail: `npm view: ${code ?? `exit ${result.status ?? 'unknown'}`}`,
  };
}

// `init` detects a token in WEBAWESOME_NPM_TOKEN too, but only this line
// authenticates the install (#160).
const PRO_FIX_HINT =
  'Give this machine a Web Awesome Pro token where `init` reads it and the\n' +
  'package manager can install with it:\n' +
  '  npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken <token>\n' +
  '(or `pnpm setup:npmrc`, which writes that line from .env).';

/** Run the Pro consumer, or report that it did not run and why. */
export function consumerPremise(
  proPackage: CemVerdict,
  { label, env = process.env }: { label: string; env?: NodeJS.ProcessEnv }
): ConsumerPremise {
  if (proPackage.usable) {
    return { run: true };
  }

  return {
    run: false,
    summary: summarizeGuard(
      { passed: false, findings: [], cem: proPackage },
      { allowSkip: skipPermitted(env), label, fixHint: PRO_FIX_HINT }
    ),
  };
}

/**
 * Settle a consumer that did not run: skip it where `summary` permits a skip,
 * printing the report first, and fail it with the report everywhere else.
 * `skip` is the test's own `ctx.skip`, which throws.
 */
export function reportNotRun(
  summary: GuardSummary,
  skip: (note: string) => never
): never {
  const report = `${summary.headline}\n${summary.detail}`;
  if (summary.exitCode !== 0) {
    throw new Error(report);
  }
  console.error(report);
  return skip(summary.headline);
}

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

import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  skipPermitted,
  summarizeGuard,
  type GuardSummary,
} from '../../../scripts/guard-outcome.js';
import type { CemVerdict } from '../../../scripts/find-cem.js';
import {
  ENV_TOKEN_KEY,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../../src/constants.js';
import { projectNpmrcFor } from '../../../src/utils/npmrc.js';

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
 * `npm view` of the pinned Pro package, authenticated the way the Pro
 * consumer's install is: from a directory holding the `.npmrc` `init` writes
 * (`projectNpmrcFor`), with `token` as WEBAWESOME_NPM_TOKEN, which is what
 * `init` hands its package manager. That `.npmrc` reads the variable unless
 * the user npmrc holds the token (#160), so a machine this probe fails on
 * would fail the consumer's install too.
 */
export function probeProPackage(
  version: string,
  token: string
): ProPackageProbe {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kigumi-pro-probe-'));
  let result: SpawnSyncReturns<string>;
  try {
    fs.writeFileSync(path.join(dir, '.npmrc'), projectNpmrcFor('', 'pro'));
    result = spawnSync(
      'npm',
      ['view', `${WEB_AWESOME_PRO_PACKAGE}@${version}`, 'version'],
      {
        cwd: dir,
        encoding: 'utf8',
        timeout: 60_000,
        env: { ...process.env, [ENV_TOKEN_KEY]: token },
      }
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

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

const PRO_FIX_HINT =
  'Give this machine a Web Awesome Pro token `init` finds and can install with:\n' +
  '  export WEBAWESOME_NPM_TOKEN=<token>\n' +
  'or, once per machine:\n' +
  '  npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken <token>\n' +
  '(`pnpm setup:npmrc` writes that line from .env).';

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

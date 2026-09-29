/**
 * Whether a consumer tsc suite has what it typechecks against (issue #79).
 *
 * The Free consumer installs from the public registry and always runs. The
 * Pro consumer needs the Pro package, which only a Web Awesome Pro token
 * installs. Without one it did not run, and it says so in the guard-outcome
 * vocabulary of docs/adr/0003: `summarizeGuard` words the report and
 * `skipPermitted` decides whether the missing token is a skip or a failure.
 * It is never a pass.
 *
 * The token is an argument, not looked up here, so each outcome can be
 * asserted without touching the machine's environment or `~/.npmrc`. The
 * caller passes what `init` itself would find (`detectProTokenSync`).
 */

import {
  skipPermitted,
  summarizeGuard,
  type GuardSummary,
} from '../../../scripts/guard-outcome.js';
import type { Tier } from '../../../src/utils/tier.js';

export type ConsumerPremise =
  { run: true } | { run: false; summary: GuardSummary };

export interface ConsumerPremiseOptions {
  /** The suite's name, which the report opens with. */
  label: string;
  /** The Pro token `init` would find, or null. Ignored for Free. */
  token: string | null;
  env?: NodeJS.ProcessEnv;
}

const NO_PRO_PACKAGE =
  'no Web Awesome Pro token, so the Pro package cannot be installed';

// `init` detects a token in WEBAWESOME_NPM_TOKEN too, but only this line
// authenticates the install (#160).
const PRO_FIX_HINT =
  'Give this machine a Web Awesome Pro token where `init` reads it and the\n' +
  'package manager can install with it:\n' +
  '  npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken <token>\n' +
  '(or `pnpm setup:npmrc`, which writes that line from .env).';

export function consumerPremise(
  tier: Tier,
  { label, token, env = process.env }: ConsumerPremiseOptions
): ConsumerPremise {
  if (tier === 'free' || token) {
    return { run: true };
  }

  // The verdict describes the Pro package, which is also what ships the
  // complete manifest the other guard-outcome callers need.
  return {
    run: false,
    summary: summarizeGuard(
      {
        passed: false,
        findings: [],
        cem: { usable: false, outcome: 'absent', reason: NO_PRO_PACKAGE },
      },
      { allowSkip: skipPermitted(env), label, fixHint: PRO_FIX_HINT }
    ),
  };
}

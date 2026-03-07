/**
 * Version Error Classes
 *
 * Errors related to CLI version mismatches between the running CLI
 * and the project's pinned kigumiVersion.
 */

import { KigumiError, ErrorCode } from './base.js';

/**
 * Thrown when CLI major version differs from project's pinned kigumiVersion
 */
export class VersionMismatchError extends KigumiError {
  constructor(
    public readonly configVersion: string,
    public readonly cliVersion: string
  ) {
    super(
      ErrorCode.VERSION_MISMATCH,
      `CLI version ${cliVersion} does not match project version ${configVersion}`,
      { configVersion, cliVersion },
      [
        {
          title: 'Use the matching CLI version',
          steps: [`npx kigumi@${configVersion} add <component>`],
        },
        {
          title: 'Or upgrade your project to the current CLI version',
          steps: [`npx kigumi@${cliVersion} upgrade`],
        },
      ]
    );
  }
}

/**
 * File System Error Classes
 *
 * Errors raised when a file Kigumi needs from the user's project exists but
 * cannot be read or parsed.
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';

function errnoCode(error: unknown): string | undefined {
  if (error instanceof Error && 'code' in error) {
    const { code } = error as { code: unknown };
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

/**
 * The shell commands use the relative path on purpose. The CLI has no --cwd
 * flag: every command reads package.json from the directory it was run in,
 * so `package.json` is the right path for the user. The absolute path is in
 * the message already, and inside a command it wraps in the terminal box and
 * can no longer be copied.
 */
function readFixSteps(code: string | undefined): string[] {
  switch (code) {
    case 'EACCES':
    case 'EPERM':
      return [
        'Check who can read it: ls -l package.json',
        'Give your user read access, e.g.: chmod u+r package.json',
        'Then run the command again',
      ];
    case 'EISDIR':
      return [
        'package.json is a directory, not a file',
        'Move or rename that directory',
        'Restore your package.json file, then run the command again',
      ];
    default:
      return [
        'Confirm package.json is a regular file your user can read',
        'Then run the command again',
      ];
  }
}

/**
 * Thrown when `package.json` exists but cannot be read.
 *
 * Thrown by `readDependencies` / `readDependenciesSync`
 * (`src/utils/package-json.ts`), which tier and project detection both read
 * through. A read failure (permissions, a directory at that path) is a
 * problem in the user's project, not a bug in Kigumi, so it gets its own
 * error instead of the generic "unexpected error, please report" one.
 */
export class PackageJsonReadError extends KigumiError {
  constructor(filePath: string, cause: unknown) {
    const code = errnoCode(cause);
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Make package.json readable',
        steps: readFixSteps(code),
      },
    ];

    super(
      ErrorCode.PACKAGE_JSON_UNREADABLE,
      `Cannot read package.json at ${filePath}`,
      { filePath, code },
      suggestions,
      toError(cause)
    );
  }
}

/**
 * Thrown when `package.json` can be read but is not a JSON object: a syntax
 * error, or valid JSON such as `null` that has no fields to read.
 *
 * Tier detection catches it and falls through to the token, since a broken
 * file says nothing about the tier. Project detection (`init`, `upgrade`)
 * lets it reach the user, who has to fix the file before anything else works.
 */
export class PackageJsonInvalidError extends KigumiError {
  constructor(filePath: string, cause: unknown) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Fix package.json',
        steps: [
          'Fix the problem named under "Caused by" above',
          'package.json must hold a single JSON object',
          'Then run the command again',
        ],
      },
    ];

    super(
      ErrorCode.PACKAGE_JSON_INVALID,
      `Invalid package.json at ${filePath}`,
      { filePath },
      suggestions,
      toError(cause)
    );
  }
}

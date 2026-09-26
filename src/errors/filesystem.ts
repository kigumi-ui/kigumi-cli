/**
 * File System Error Classes
 *
 * Errors raised when a file Kigumi needs from the user's project exists but
 * cannot be read.
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';

function errnoCode(error: unknown): string | undefined {
  if (error instanceof Error && 'code' in error) {
    const { code } = error as { code: unknown };
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

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
 * Thrown by `readPackageJson` / `readPackageJsonSync` (`src/utils/package-json.ts`),
 * which tier and project detection both read through. A read failure
 * (permissions, a directory at that path) is a problem in the user's project,
 * not a bug in Kigumi, so it gets its own error instead of the generic
 * "unexpected error, please report" one.
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
      cause instanceof Error ? cause : new Error(String(cause))
    );
  }
}

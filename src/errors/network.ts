/**
 * Network and Dependency Error Classes
 *
 * Errors related to package installation, network requests, and registries
 */

import {
  ENV_TOKEN_KEY,
  ENV_TOKEN_REFERENCE,
  NPM_PRO_AUTH_TOKEN_KEY,
} from '../constants.js';
import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';

/**
 * Dependency installation failed error
 */
export class DependencyInstallError extends KigumiError {
  constructor(
    packageName: string,
    packageManager: string,
    cause?: Error,
    statusCode?: number
  ) {
    const isAuthError = statusCode === 401 || statusCode === 403;
    const isNotFoundError = statusCode === 404;
    const errorMessage = cause?.message || '';
    const isRegistryMismatch =
      errorMessage.includes('ERR_PNPM_REGISTRIES_MISMATCH') ||
      errorMessage.includes('REGISTRIES_MISMATCH');

    const suggestions: ErrorSuggestion[] = [];

    if (isRegistryMismatch) {
      suggestions.push({
        title: 'Registry configuration mismatch detected',
        steps: [
          'Your package manager detected a registry URL change',
          'This happens when .npmrc was updated after packages were installed',
          `Run: rm -rf node_modules ${
            packageManager === 'pnpm'
              ? 'pnpm-lock.yaml'
              : packageManager === 'yarn'
                ? 'yarn.lock'
                : 'package-lock.json'
          }`,
          `Then run: ${packageManager} install`,
          'This will recreate the lockfile with the new registry configuration',
        ],
      });
    } else if (isAuthError) {
      suggestions.push({
        title: 'Authentication required',
        steps: [
          `Failed to install ${packageName} - authentication failed`,
          'This package requires a Web Awesome Pro token',
          'Get your token from: https://webawesome.com/login',
          `Set ${ENV_TOKEN_KEY} in your environment; the project .npmrc reads it via ${NPM_PRO_AUTH_TOKEN_KEY}=${ENV_TOKEN_REFERENCE}`,
          `Or, once per machine: npm config set ${NPM_PRO_AUTH_TOKEN_KEY} YOUR_TOKEN`,
        ],
      });
    } else if (isNotFoundError) {
      suggestions.push({
        title: 'Package not found',
        steps: [
          `Package "${packageName}" not found`,
          'Verify the package name is correct',
          'Check if the package exists in the registry',
          'Ensure you have access to the package',
        ],
      });
    } else {
      suggestions.push({
        title: 'Installation failed',
        steps: [
          `Failed to install: ${packageName}`,
          'Check the error message above for specific details',
          'Verify you have internet connectivity',
          'Try running the command again',
        ],
      });

      suggestions.push({
        title: 'Try manual installation',
        steps: [
          `Run: ${packageManager} ${
            packageManager === 'npm' ? 'install' : 'add'
          } ${packageName}`,
          'Check the error output for specific issues',
          'Resolve any conflicts or version mismatches',
        ],
      });
    }

    super(
      ErrorCode.DEPENDENCY_INSTALL_FAILED,
      `Failed to install dependency: ${packageName}`,
      { packageName, packageManager, statusCode, error: cause?.message },
      suggestions,
      cause
    );
  }
}

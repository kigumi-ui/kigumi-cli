/**
 * Network and Dependency Error Classes
 *
 * Errors related to package installation, network requests, and registries
 */

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

    const suggestions: ErrorSuggestion[] = [];

    if (isAuthError) {
      suggestions.push({
        title: 'Authentication required',
        steps: [
          `Failed to install ${packageName} - authentication failed`,
          'This package requires a Pro tier token',
          'Get your token from: https://webawesome.com/pro',
          'Add to .env file: WA_TOKEN=your-token',
          'Configure npm: npm config set @awesome.me:registry https://npm.cloudsmith.io/fortawesome/webawesome-pro/',
          'Login: npm login --registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro/',
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
        title: 'Check your network connection',
        steps: [
          `Failed to install: ${packageName}`,
          'Verify you have internet connectivity',
          'Check if the package registry is accessible',
          'Try running the command again',
        ],
      });

      suggestions.push({
        title: 'Try manual installation',
        steps: [
          `Run: ${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} ${packageName}`,
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

/**
 * Package not found error
 */
export class PackageNotFoundError extends KigumiError {
  constructor(packageName: string, registry?: string) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Check package name',
        steps: [
          `Package "${packageName}" not found`,
          'Verify the package name is spelled correctly',
          ...(registry
            ? [`Package registry: ${registry}`]
            : []),
          'Check if the package exists',
        ],
      },
    ];

    super(
      ErrorCode.PACKAGE_NOT_FOUND,
      `Package not found: ${packageName}`,
      { packageName, registry },
      suggestions
    );
  }
}

/**
 * Network error
 */
export class NetworkError extends KigumiError {
  constructor(url: string, cause: Error) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Check your network',
        steps: [
          `Failed to connect to: ${url}`,
          'Verify your internet connection',
          'Check if the URL is accessible',
          'Verify proxy settings if applicable',
          'Try again in a few moments',
        ],
      },
    ];

    super(
      ErrorCode.NETWORK_ERROR,
      `Network error: ${url}`,
      { url, error: cause.message },
      suggestions,
      cause
    );
  }
}

/**
 * Authentication failed error
 */
export class AuthenticationError extends KigumiError {
  constructor(
    service: string,
    statusCode: number,
    message?: string
  ) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Check your credentials',
        steps: [
          `Authentication failed for: ${service} (${statusCode})`,
          ...(message ? [`Error: ${message}`] : []),
          'Verify your token is correct',
          'Check if your token has expired',
          'Ensure you have the necessary permissions',
        ],
      },
    ];

    if (service.includes('webawesome') || service.includes('awesome.me')) {
      suggestions.push({
        title: 'Get a new Web Awesome token',
        steps: [
          'Visit: https://webawesome.com/pro',
          'Sign in to your account',
          'Navigate to Settings → API Tokens',
          'Generate a new token',
          'Add to .env: WA_TOKEN=your-token',
        ],
      });
    }

    super(
      ErrorCode.AUTH_FAILED,
      `Authentication failed: ${service}`,
      { service, statusCode, message },
      suggestions
    );
  }
}

/**
 * Registry error
 */
export class RegistryError extends KigumiError {
  constructor(
    registry: string,
    operation: string,
    cause: Error,
    statusCode?: number
  ) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Registry issue',
        steps: [
          `Failed to ${operation} from registry: ${registry}`,
          ...(statusCode ? [`Status code: ${statusCode}`] : []),
          'Check if the registry is accessible',
          'Verify your registry configuration',
          'Try again later if the registry is temporarily down',
        ],
      },
    ];

    super(
      ErrorCode.REGISTRY_ERROR,
      `Registry error: ${registry}`,
      { registry, operation, statusCode, error: cause.message },
      suggestions,
      cause
    );
  }
}

/**
 * Community Registry Error Classes
 *
 * Errors specific to the community registry system:
 * fetching, validation, and resolution of remote components and themes.
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';

/**
 * Community registry not found (repo or registry.json missing)
 */
export class CommunityRegistryNotFoundError extends KigumiError {
  constructor(url: string, cause?: Error) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Registry not found',
        steps: [
          `Could not find registry.json at: ${url}`,
          'Verify the URL points to a valid GitHub repository',
          'Check that the repository contains a registry.json file at its root',
          'Ensure the repository is public or you have provided a GitHub token',
        ],
      },
    ];

    super(
      ErrorCode.REGISTRY_ERROR,
      `Community registry not found: ${url}`,
      { url, error: cause?.message },
      suggestions,
      cause
    );
  }
}

/**
 * Community registry has invalid schema
 */
export class CommunityRegistryInvalidError extends KigumiError {
  constructor(url: string, errors: string[]) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Registry validation failed',
        steps: [
          'The registry.json file has validation errors:',
          ...errors.map((e) => `  - ${e}`),
          'Run "kigumi registry validate" in the registry repo to fix',
        ],
      },
    ];

    super(
      ErrorCode.REGISTRY_ERROR,
      `Invalid community registry: ${url}`,
      { url, errors },
      suggestions
    );
  }
}

/**
 * Component not found in a community registry
 */
export class CommunityComponentNotFoundError extends KigumiError {
  /**
   * `kind` names what was being looked up. Registries hold themes as well as
   * components, and "Component ... not found" reads wrong for a theme.
   */
  constructor(
    componentName: string,
    registryName: string,
    available: string[],
    kind: 'component' | 'theme' = 'component'
  ) {
    const Kind = kind === 'theme' ? 'Theme' : 'Component';
    const suggestions: ErrorSuggestion[] = [
      {
        title: `${Kind} not found`,
        steps:
          available.length > 0
            ? [
                `${Kind} "${componentName}" is not in registry "${registryName}"`,
                `Available ${kind}s: ${available.join(', ')}`,
              ]
            : [
                `${Kind} "${componentName}" is not in registry "${registryName}"`,
                `This registry has no ${kind}s`,
              ],
      },
    ];

    super(
      ErrorCode.INVALID_COMPONENT,
      `${Kind} "${componentName}" not found in registry "${registryName}"`,
      { componentName, registryName, available, kind },
      suggestions
    );
  }
}

/**
 * Registry does not support the user's framework
 */
export class FrameworkMismatchError extends KigumiError {
  constructor(
    registryName: string,
    registryFrameworks: string[],
    userFramework: string
  ) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Framework mismatch',
        steps: [
          `Your project uses: ${userFramework}`,
          `This registry supports: ${registryFrameworks.join(', ')}`,
          'Look for a registry that supports your framework',
          'OR re-run with --cross-framework to fetch the source-framework ' +
            'files into .kigumi/foreign/ for an agent-driven conversion',
        ],
      },
    ];

    super(
      ErrorCode.INVALID_FRAMEWORK,
      `Registry "${registryName}" does not support ${userFramework}`,
      { registryName, registryFrameworks, userFramework },
      suggestions
    );
  }
}

/**
 * Circular dependency detected in registry components
 */
export class CircularDependencyError extends KigumiError {
  constructor(cycle: string[]) {
    const cycleStr = cycle.join(' → ');
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Circular dependency',
        steps: [
          `Dependency cycle detected: ${cycleStr}`,
          'Remove one of the dependencies to break the cycle',
          'Run "kigumi registry validate" to check for issues',
        ],
      },
    ];

    super(
      ErrorCode.VALIDATION_FAILED,
      `Circular dependency detected: ${cycleStr}`,
      { cycle },
      suggestions
    );
  }
}

/**
 * A registry-supplied file path attempted to escape the registry root.
 * The schema rejects such paths up front; this is the runtime second-line
 * of defense in `fetchFile` for local sources.
 */
export class PathTraversalError extends KigumiError {
  constructor(filePath: string, registryRoot: string, cause?: Error) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Path traversal blocked',
        steps: [
          `File path "${filePath}" resolves outside the registry root`,
          'Only paths within the registry directory are permitted',
        ],
      },
    ];

    super(
      ErrorCode.REGISTRY_ERROR,
      `Path traversal attempt: "${filePath}" escapes registry root "${registryRoot}"`,
      { filePath, registryRoot },
      suggestions,
      cause
    );
  }
}

/**
 * A registry source URL is not a usable GitHub repository URL.
 *
 * Covers an unparseable URL, a non-GitHub host, and a GitHub URL that does not
 * name an owner and repo.
 */
export class RegistrySourceInvalidError extends KigumiError {
  constructor(url: string, reason: string, cause?: Error) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Registry source is not a valid GitHub URL',
        steps: [
          reason,
          'Expected format: https://github.com/owner/repo',
          'A branch may be included: https://github.com/owner/repo/tree/branch',
          'Local filesystem paths are also accepted for development',
        ],
      },
    ];

    // The reason is the message, not just a suggestion: it is the part that
    // says which of the three failures happened.
    super(
      ErrorCode.REGISTRY_ERROR,
      reason,
      { url, reason },
      suggestions,
      cause
    );
  }
}

/**
 * A file could not be fetched from a registry source.
 *
 * `status` carries the HTTP status where the failure came from a fetch, so an
 * authentication failure can suggest a token while a 404 suggests checking the
 * path.
 */
export class RegistryFetchError extends KigumiError {
  constructor(
    filePath: string,
    sourceLabel: string,
    reason: string,
    options: { status?: number; cause?: Error } = {}
  ) {
    const { status, cause } = options;

    const steps =
      status === 401 || status === 403
        ? [
            `Access to ${sourceLabel} was denied.`,
            'If the repository is private, provide a GitHub token.',
            'Check that the token has permission to read this repository.',
          ]
        : status === 404
          ? [
              `${filePath} does not exist in ${sourceLabel}.`,
              'Check the registry.json entry that names this file.',
              'Confirm the branch is correct.',
            ]
          : [
              reason,
              'Check your network connection.',
              `Confirm that ${sourceLabel} is reachable.`,
            ];

    const suggestions: ErrorSuggestion[] = [
      { title: 'Could not fetch from registry', steps },
    ];

    super(
      ErrorCode.REGISTRY_ERROR,
      reason,
      { filePath, source: sourceLabel, status },
      suggestions,
      cause
    );
  }
}

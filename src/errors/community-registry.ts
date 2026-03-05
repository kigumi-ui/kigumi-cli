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
  constructor(
    componentName: string,
    registryName: string,
    available: string[]
  ) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Component not found',
        steps:
          available.length > 0
            ? [
                `Component "${componentName}" is not in registry "${registryName}"`,
                `Available components: ${available.join(', ')}`,
              ]
            : [
                `Component "${componentName}" is not in registry "${registryName}"`,
                'This registry has no components',
              ],
      },
    ];

    super(
      ErrorCode.INVALID_COMPONENT,
      `Component "${componentName}" not found in registry "${registryName}"`,
      { componentName, registryName, available },
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

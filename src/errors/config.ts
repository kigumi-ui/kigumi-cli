/**
 * Configuration Error Classes
 *
 * Errors related to kigumi configuration file (kigumi.config.json)
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';
import { GITHUB_REPO_URL } from '../constants.js';

/**
 * Configuration file not found
 */
export class ConfigNotFoundError extends KigumiError {
  constructor(cwd: string) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Initialize kigumi in your project',
        steps: [
          'Run: kigumi init',
          'Follow the prompts to configure your project',
          'This will create kigumi.config.json',
        ],
      },
      {
        title: 'Or create the config file manually',
        steps: [
          'Create kigumi.config.json in your project root',
          'Add the required configuration fields',
          `See: ${GITHUB_REPO_URL}#configuration`,
        ],
      },
    ];

    super(
      ErrorCode.CONFIG_NOT_FOUND,
      'Configuration file not found',
      { cwd, searchedFiles: ['kigumi.config.json', 'kigumi.json'] },
      suggestions
    );
  }
}

/**
 * Configuration file is invalid
 */
export class ConfigInvalidError extends KigumiError {
  constructor(errors: string[], filePath?: string) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Fix the configuration errors',
        steps: [
          ...errors.map((err) => `Fix: ${err}`),
          'Ensure all required fields are present',
          'Check that values match the expected types',
        ],
      },
      {
        title: 'Or reinitialize the project',
        steps: [
          'Backup your current config',
          'Run: kigumi init',
          'Reconfigure with correct values',
        ],
      },
    ];

    super(
      ErrorCode.CONFIG_INVALID,
      'Configuration file is invalid',
      { errors, filePath },
      suggestions
    );
  }

  format(): string {
    const errors = (this.context.details?.errors || []) as string[];
    return `Configuration file is invalid:\n\n${errors.map((e) => `  - ${e}`).join('\n')}`;
  }
}

/**
 * Configuration file parse error
 */
export class ConfigParseError extends KigumiError {
  constructor(filePath: string, cause: Error) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Fix JSON syntax errors',
        steps: [
          'Open the config file in your editor',
          'Look for syntax errors (missing commas, quotes, etc.)',
          'Use a JSON validator to check for issues',
          'Or delete the file and run: kigumi init',
        ],
      },
    ];

    super(
      ErrorCode.CONFIG_PARSE_ERROR,
      `Failed to parse configuration file: ${filePath}`,
      { filePath, parseError: cause.message },
      suggestions,
      cause
    );
  }
}

/**
 * Configuration field missing
 */
export class ConfigFieldMissingError extends KigumiError {
  constructor(field: string, filePath?: string) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Add the missing field',
        steps: [
          `Add "${field}" to your kigumi.config.json`,
          'Check the documentation for the expected value',
          'Or run: kigumi init to reconfigure',
        ],
      },
    ];

    super(
      ErrorCode.CONFIG_INVALID,
      `Missing required configuration field: ${field}`,
      { field, filePath },
      suggestions
    );
  }
}

/**
 * Configuration field has invalid value
 */
export class ConfigFieldInvalidError extends KigumiError {
  constructor(
    field: string,
    value: unknown,
    expectedType: string,
    validValues?: unknown[]
  ) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Correct the field value',
        steps: [
          `Field "${field}" has invalid value: ${JSON.stringify(value)}`,
          `Expected type: ${expectedType}`,
          ...(validValues
            ? [
                `Valid values: ${validValues.map((v) => JSON.stringify(v)).join(', ')}`,
              ]
            : []),
          'Update the value in kigumi.config.json',
        ],
      },
    ];

    super(
      ErrorCode.CONFIG_INVALID,
      `Invalid value for configuration field: ${field}`,
      { field, value, expectedType, validValues },
      suggestions
    );
  }
}

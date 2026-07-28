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

/**
 * Validation Error Classes
 *
 * Errors related to input validation (options, arguments, etc.)
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';
import type { ZodError } from 'zod';

/**
 * Generic validation error
 */
export class ValidationError extends KigumiError {
  constructor(
    field: string,
    value: any,
    validValues?: any[],
    zodError?: ZodError
  ) {
    const errorMessages = zodError?.errors.map((err) => {
      return `${err.path.join('.')}: ${err.message}`;
    }) || [];

    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Provide a valid value',
        steps: [
          `The value "${value}" is not valid for: ${field}`,
          ...(validValues
            ? [`Valid values: ${validValues.map((v) => JSON.stringify(v)).join(', ')}`]
            : []),
          ...errorMessages.map((msg) => `Error: ${msg}`),
          'Check the command documentation for valid options',
        ],
      },
    ];

    super(
      ErrorCode.VALIDATION_FAILED,
      `Validation failed for: ${field}`,
      { field, value, validValues, zodErrors: errorMessages },
      suggestions
    );
  }

  format(): string {
    const { field, value, validValues } = this.context.details || {};
    const parts = [`Validation failed for: ${field}`];

    parts.push(`  Received: ${JSON.stringify(value)}`);

    if (validValues && Array.isArray(validValues)) {
      parts.push(`  Valid values: ${validValues.map((v) => JSON.stringify(v)).join(', ')}`);
    }

    const zodErrors = this.context.details?.zodErrors as string[] | undefined;
    if (zodErrors && zodErrors.length > 0) {
      parts.push('');
      parts.push('Validation errors:');
      zodErrors.forEach((err) => parts.push(`  - ${err}`));
    }

    return parts.join('\n');
  }
}

/**
 * Invalid framework error
 */
export class InvalidFrameworkError extends KigumiError {
  constructor(framework: string, supportedFrameworks: string[]) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Use a supported framework',
        steps: [
          `"${framework}" is not supported`,
          `Supported frameworks: ${supportedFrameworks.join(', ')}`,
          'Update your configuration or command',
        ],
      },
    ];

    super(
      ErrorCode.INVALID_FRAMEWORK,
      `Unsupported framework: ${framework}`,
      { framework, supportedFrameworks },
      suggestions
    );
  }
}

/**
 * Invalid component error
 */
export class InvalidComponentError extends KigumiError {
  constructor(componentName: string, availableComponents?: string[]) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Use a valid component name',
        steps: [
          `Component "${componentName}" does not exist`,
          ...(availableComponents
            ? [
                'Available components:',
                ...availableComponents.map((c) => `  - ${c}`),
              ]
            : ['Run: kigumi list to see available components']),
        ],
      },
    ];

    super(
      ErrorCode.INVALID_COMPONENT,
      `Invalid component: ${componentName}`,
      { componentName, availableComponents },
      suggestions
    );
  }
}

/**
 * Invalid theme error
 */
export class InvalidThemeError extends KigumiError {
  constructor(theme: string, availableThemes: string[], tier: 'free' | 'pro') {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Use a valid theme',
        steps: [
          `Theme "${theme}" is not available`,
          `Available themes for ${tier} tier:`,
          ...availableThemes.map((t) => `  - ${t}`),
        ],
      },
    ];

    super(
      ErrorCode.INVALID_THEME,
      `Invalid theme: ${theme}`,
      { theme, availableThemes, tier },
      suggestions
    );
  }
}

/**
 * Invalid palette error
 */
export class InvalidPaletteError extends KigumiError {
  constructor(palette: string, availablePalettes: string[]) {
    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Use a valid palette',
        steps: [
          `Palette "${palette}" does not exist`,
          'Available palettes:',
          ...availablePalettes.map((p) => `  - ${p}`),
        ],
      },
    ];

    super(
      ErrorCode.INVALID_PALETTE,
      `Invalid palette: ${palette}`,
      { palette, availablePalettes },
      suggestions
    );
  }
}

/**
 * Invalid options error
 */
export class InvalidOptionsError extends KigumiError {
  constructor(zodError: ZodError) {
    const errorMessages = zodError.errors.map((err) => {
      return `${err.path.join('.')}: ${err.message}`;
    });

    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Fix the invalid options',
        steps: [
          ...errorMessages.map((msg) => `- ${msg}`),
          'Check the command documentation for correct usage',
          'Run: kigumi <command> --help',
        ],
      },
    ];

    super(
      ErrorCode.INVALID_OPTIONS,
      'Invalid command options',
      { errors: errorMessages },
      suggestions
    );
  }

  format(): string {
    const errors = this.context.details?.errors as string[];
    return `Invalid command options:\n\n${errors.map((e) => `  - ${e}`).join('\n')}`;
  }
}

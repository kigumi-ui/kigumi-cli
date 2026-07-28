/**
 * Validation Error Classes
 *
 * Errors related to input validation (options, arguments, etc.)
 */

import { KigumiError, ErrorCode, type ErrorSuggestion } from './base.js';
import type { ZodError, ZodIssue } from 'zod';

/**
 * Generic validation error
 */
export class ValidationError extends KigumiError {
  constructor(
    field: string,
    value: unknown,
    validValues?: unknown[],
    zodError?: ZodError
  ) {
    const errorMessages =
      zodError?.issues.map((err: ZodIssue) => {
        return `${err.path.join('.')}: ${err.message}`;
      }) || [];

    const suggestions: ErrorSuggestion[] = [
      {
        title: 'Provide a valid value',
        steps: [
          `The value "${value}" is not valid for: ${field}`,
          ...(validValues
            ? [
                `Valid values: ${validValues.map((v) => JSON.stringify(v)).join(', ')}`,
              ]
            : []),
          ...errorMessages.map((msg: string) => `Error: ${msg}`),
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
      parts.push(
        `  Valid values: ${validValues.map((v) => JSON.stringify(v)).join(', ')}`
      );
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

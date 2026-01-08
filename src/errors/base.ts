/**
 * Base Error Classes
 *
 * Foundation for all Kigumi CLI errors with semantic exit codes,
 * structured context, and actionable suggestions.
 */

/**
 * Error codes for semantic categorization
 */
export enum ErrorCode {
  // User actions (exit code 0)
  USER_CANCELLED = 0,

  // Configuration errors (exit code 1)
  CONFIG_NOT_FOUND = 100,
  CONFIG_INVALID = 101,
  CONFIG_PARSE_ERROR = 102,

  // Validation errors (exit code 2)
  VALIDATION_FAILED = 200,
  INVALID_FRAMEWORK = 201,
  INVALID_COMPONENT = 202,
  INVALID_THEME = 203,
  INVALID_PALETTE = 204,
  INVALID_OPTIONS = 205,

  // Tier restriction errors (exit code 3)
  TIER_RESTRICTION = 300,
  PRO_COMPONENT_REQUIRED = 301,
  PRO_THEME_REQUIRED = 302,
  TOKEN_REQUIRED = 303,
  TOKEN_INVALID = 304,

  // File system errors (exit code 4)
  FILE_NOT_FOUND = 400,
  FILE_READ_ERROR = 401,
  FILE_WRITE_ERROR = 402,
  DIRECTORY_NOT_FOUND = 403,
  PERMISSION_DENIED = 404,

  // Network/Dependency errors (exit code 5)
  DEPENDENCY_INSTALL_FAILED = 500,
  PACKAGE_NOT_FOUND = 501,
  NETWORK_ERROR = 502,
  AUTH_FAILED = 503,
  REGISTRY_ERROR = 504,

  // Pre-flight check errors (exit code 6)
  PREFLIGHT_CHECK_FAILED = 600,
  MISSING_DEPENDENCY = 601,
  INCOMPATIBLE_VERSION = 602,

  // Unknown errors (exit code 1)
  UNKNOWN = 999,
}

/**
 * Error context - structured information about what went wrong
 */
export interface ErrorContext {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  cause?: Error;
}

/**
 * Error suggestion - actionable step to resolve the error
 */
export interface ErrorSuggestion {
  title: string;
  steps: string[];
}

/**
 * Base KigumiError class
 *
 * All CLI errors should extend this class to ensure consistent
 * error handling, exit codes, and user-facing messages.
 */
export abstract class KigumiError extends Error {
  public readonly code: ErrorCode;
  public readonly context: ErrorContext;
  public readonly suggestions: ErrorSuggestion[];
  public readonly exitCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, any>,
    suggestions: ErrorSuggestion[] = [],
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.exitCode = this.getExitCode(code);
    this.context = {
      code,
      message,
      details,
      cause,
    };
    this.suggestions = suggestions;

    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Map error code to semantic exit code
   *
   * Exit codes:
   * - 0: User cancelled (not an error)
   * - 1: Configuration error
   * - 2: Validation error
   * - 3: Tier restriction error
   * - 4: File system error
   * - 5: Network/dependency error
   * - 6: Pre-flight check error
   */
  private getExitCode(code: ErrorCode): number {
    if (code === ErrorCode.USER_CANCELLED) return 0;
    if (code >= 100 && code < 200) return 1; // Config
    if (code >= 200 && code < 300) return 2; // Validation
    if (code >= 300 && code < 400) return 3; // Tier restrictions
    if (code >= 400 && code < 500) return 4; // Filesystem
    if (code >= 500 && code < 600) return 5; // Network
    if (code >= 600 && code < 700) return 6; // Pre-flight checks
    return 1; // Default
  }

  /**
   * Format error for display to user
   *
   * Each error subclass can override this to provide custom formatting,
   * but the default implementation provides a consistent format.
   */
  format(): string {
    const parts: string[] = [];

    // Error message
    parts.push(this.message);

    // Details (if any)
    if (this.context.details && Object.keys(this.context.details).length > 0) {
      parts.push('');
      parts.push('Details:');
      for (const [key, value] of Object.entries(this.context.details)) {
        parts.push(`  ${key}: ${JSON.stringify(value)}`);
      }
    }

    // Cause (if any)
    if (this.context.cause) {
      parts.push('');
      parts.push(`Caused by: ${this.context.cause.message}`);
    }

    return parts.join('\n');
  }

  /**
   * Get formatted suggestions
   */
  formatSuggestions(): string {
    if (this.suggestions.length === 0) {
      return '';
    }

    return this.suggestions
      .map((suggestion) => {
        const steps = suggestion.steps
          .map((step, i) => `  ${i + 1}. ${step}`)
          .join('\n');
        return `${suggestion.title}:\n${steps}`;
      })
      .join('\n\n');
  }

  /**
   * Convert to JSON for logging/telemetry
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      exitCode: this.exitCode,
      message: this.message,
      context: this.context,
      suggestions: this.suggestions,
      stack: this.stack,
    };
  }
}

/**
 * User cancelled error
 *
 * Special case - exit code 0, not actually an error
 */
export class UserCancelledError extends KigumiError {
  constructor(message: string = 'Operation cancelled by user') {
    super(ErrorCode.USER_CANCELLED, message);
  }
}

/**
 * Unknown error wrapper
 *
 * Used to wrap unexpected errors with our error structure
 */
export class UnknownError extends KigumiError {
  constructor(message: string, cause?: Error) {
    super(
      ErrorCode.UNKNOWN,
      message,
      { originalError: cause?.message },
      [
        {
          title: 'This is an unexpected error',
          steps: [
            'Please report this issue at: https://github.com/anthropics/kigumi-cli/issues',
            'Include the full error message and stack trace',
          ],
        },
      ],
      cause
    );
  }

  /**
   * Wrap any error with KigumiError structure
   */
  static from(error: unknown): KigumiError {
    if (error instanceof KigumiError) {
      return error;
    }

    if (error instanceof Error) {
      return new UnknownError(
        `An unexpected error occurred: ${error.message}`,
        error
      );
    }

    return new UnknownError(
      `An unexpected error occurred: ${String(error)}`
    );
  }
}

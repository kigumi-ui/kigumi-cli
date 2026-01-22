/**
 * Output Abstraction Types
 *
 * Defines the interface for outputting messages to the user
 */

/**
 * Output spinner interface
 */
export interface OutputSpinner {
  /**
   * Start the spinner
   */
  start(message?: string): void;

  /**
   * Update spinner message
   */
  message(text: string): void;

  /**
   * Stop spinner with success
   */
  stop(message?: string): void;

  /**
   * Stop spinner with error
   */
  error(message?: string): void;
}

/**
 * Output interface
 *
 * Abstraction layer for user-facing output
 */
export interface OutputInterface {
  /**
   * Show intro message
   */
  intro(message: string): void;

  /**
   * Show outro message
   */
  outro(message: string): void;

  /**
   * Show info message
   */
  info(message: string): void;

  /**
   * Show success message
   */
  success(message: string): void;

  /**
   * Show warning message
   */
  warning(message: string): void;

  /**
   * Show warning message (alias for warning)
   */
  warn(message: string): void;

  /**
   * Show error message
   */
  error(message: string, error?: Error): void;

  /**
   * Show note with title and content
   */
  note(title: string, message: string): void;

  /**
   * Create a spinner
   */
  spinner(message: string): OutputSpinner;

  /**
   * Log a message (for debugging)
   */
  log(message: string): void;
}

/**
 * Console Output Implementation
 *
 * Implementation using @clack/prompts for beautiful CLI output
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { OutputInterface, OutputSpinner } from './types.js';

/**
 * Clack spinner wrapper
 */
class ClackSpinner implements OutputSpinner {
  private spinner: ReturnType<typeof p.spinner>;

  constructor(message: string) {
    this.spinner = p.spinner();
    this.spinner.start(message);
  }

  start(message?: string): void {
    if (message) {
      this.spinner.start(message);
    }
  }

  message(text: string): void {
    this.spinner.message(text);
  }

  stop(message?: string): void {
    this.spinner.stop(message || 'Done');
  }

  error(message?: string): void {
    this.spinner.stop(message || 'Failed', 1);
  }
}

/**
 * Console output implementation
 *
 * Uses @clack/prompts for beautiful terminal output
 */
export class ConsoleOutput implements OutputInterface {
  intro(message: string): void {
    p.intro(pc.bgCyan(pc.black(` ${message} `)));
  }

  outro(message: string): void {
    p.outro(message);
  }

  info(message: string): void {
    p.log.info(message);
  }

  success(message: string): void {
    p.log.success(pc.green(message));
  }

  warning(message: string): void {
    p.log.warning(pc.yellow(message));
  }

  warn(message: string): void {
    this.warning(message);
  }

  error(message: string, error?: Error): void {
    if (error) {
      // Check if it's a KigumiError with formatting
      if (
        error &&
        typeof error === 'object' &&
        'format' in error &&
        typeof error.format === 'function'
      ) {
        const formatted = (error as { format: () => string }).format();
        p.log.error(pc.red(formatted));
        // Note: Suggestions are handled by handleError() in errors/index.ts
        // to avoid duplicate output
      } else {
        p.log.error(pc.red(message));
        if (error.message) {
          p.log.error(pc.dim(error.message));
        }
      }
    } else {
      p.log.error(pc.red(message));
    }
  }

  note(title: string, message: string): void {
    p.note(message, title);
  }

  spinner(message: string): OutputSpinner {
    return new ClackSpinner(message);
  }

  log(message: string): void {
    p.log.message(message);
  }
}

/**
 * Get default output instance
 */
export function getOutput(): OutputInterface {
  return new ConsoleOutput();
}

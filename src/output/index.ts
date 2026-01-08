/**
 * Output Abstraction Layer
 *
 * Provides a consistent interface for outputting messages to users,
 * decoupled from the specific output library used.
 *
 * Usage:
 * ```typescript
 * import { getOutput } from './output/index.js';
 *
 * const output = getOutput();
 * output.intro('My Command');
 * output.success('Operation completed!');
 * ```
 */

export type { OutputInterface, OutputSpinner } from './types.js';
export { ConsoleOutput, getOutput } from './console.js';

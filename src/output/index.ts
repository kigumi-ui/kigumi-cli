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
 *
 * Test-only DI hook: tests register a recording or scripted OutputInterface
 * via setOutputForTesting() instead of vi.mock-ing the whole module. See
 * tests/unit/_helpers/output.ts for the recording helper, and the cluster S
 * spec for the rationale.
 */

import { ConsoleOutput, getOutput as defaultGetOutput } from './console.js';
import type { OutputInterface } from './types.js';

let registeredOutput: OutputInterface | null = null;

export function setOutputForTesting(output: OutputInterface): void {
  registeredOutput = output;
}

export function resetOutputForTesting(): void {
  registeredOutput = null;
}

export function getOutput(): OutputInterface {
  return registeredOutput ?? defaultGetOutput();
}

export type { OutputInterface, OutputSpinner } from './types.js';
export { ConsoleOutput };

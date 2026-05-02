import { vi } from 'vitest';
import type {
  OutputInterface,
  OutputSpinner,
} from '../../../src/output/types.js';

export function createTestOutput(): OutputInterface {
  return {
    intro: vi.fn(),
    outro: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    note: vi.fn(),
    log: vi.fn(),
    spinner: vi.fn(
      (): OutputSpinner => ({
        start: vi.fn(),
        message: vi.fn(),
        stop: vi.fn(),
        error: vi.fn(),
      })
    ),
  } satisfies OutputInterface;
}

export interface OutputCall {
  method: keyof OutputInterface;
  args: unknown[];
}

export interface RecordingOutput extends OutputInterface {
  readonly calls: ReadonlyArray<OutputCall>;
  reset(): void;
}

/**
 * Captures every output method call into a typed array. Tests assert with
 *   expect(output.calls).toContainEqual({ method: 'success', args: ['...'] })
 * instead of vi.mocked(output.success).toHaveBeenCalledWith(...). This lets
 * tests register the instance via setOutputForTesting() without touching
 * the production module via vi.mock(). The spinner() factory returns a
 * no-op spinner; spinner method calls themselves are not recorded (only
 * the factory invocation is).
 */
export function createRecordingOutput(): RecordingOutput {
  const calls: OutputCall[] = [];
  const noopSpinner: OutputSpinner = {
    start: () => {},
    message: () => {},
    stop: () => {},
    error: () => {},
  };
  const record = (method: keyof OutputInterface, args: unknown[]): void => {
    calls.push({ method, args });
  };

  return {
    intro: (m) => record('intro', [m]),
    outro: (m) => record('outro', [m]),
    info: (m) => record('info', [m]),
    success: (m) => record('success', [m]),
    warning: (m) => record('warning', [m]),
    warn: (m) => record('warn', [m]),
    error: (m, e) => record('error', e === undefined ? [m] : [m, e]),
    note: (t, m) => record('note', [t, m]),
    log: (m) => record('log', [m]),
    spinner: (m) => {
      record('spinner', [m]);
      return noopSpinner;
    },
    get calls() {
      return calls;
    },
    reset() {
      calls.length = 0;
    },
  };
}

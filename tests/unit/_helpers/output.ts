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
    debug: vi.fn(),
    spinner: vi.fn((): OutputSpinner => ({
      start: vi.fn(),
      message: vi.fn(),
      stop: vi.fn(),
      error: vi.fn(),
    })),
  } satisfies OutputInterface;
}

export interface OutputCall {
  method: keyof OutputInterface;
  args: unknown[];
}

export interface RecordingOutput extends OutputInterface {
  readonly calls: ReadonlyArray<OutputCall>;
  /** Every message a spinner was stopped with, in order. */
  readonly spinnerStops: ReadonlyArray<string>;
  reset(): void;
}

/**
 * Captures every output method call into a typed array. Tests assert with
 *   expect(output.calls).toContainEqual({ method: 'success', args: ['...'] })
 * or
 *   expect(output.calls.find((c) => c.method === 'success')?.args).toEqual([...]).
 * This lets tests register the instance via setOutputForTesting() without
 * touching the production module via a factory mock. The spinner() factory
 * returns a spinner that records only the messages it is stopped with, in
 * `spinnerStops`; its other methods are not recorded.
 */
export function createRecordingOutput(): RecordingOutput {
  const calls: OutputCall[] = [];
  const spinnerStops: string[] = [];
  const spinner: OutputSpinner = {
    start: () => {},
    message: () => {},
    stop: (m) => {
      if (m !== undefined) spinnerStops.push(m);
    },
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
    debug: (m) => record('debug', [m]),
    spinner: (m) => {
      record('spinner', [m]);
      return spinner;
    },
    get calls() {
      return calls;
    },
    get spinnerStops() {
      return spinnerStops;
    },
    reset() {
      calls.length = 0;
      spinnerStops.length = 0;
    },
  };
}

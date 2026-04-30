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

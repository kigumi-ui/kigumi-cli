import type { AddOptions } from '../../../src/schemas/options.js';

export function createTestAddOptions(
  overrides: Partial<AddOptions> = {}
): AddOptions {
  return {
    force: false,
    all: false,
    tests: true,
    crossFramework: false,
    ...overrides,
  };
}

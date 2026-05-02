/**
 * Prompts Wrapper
 *
 * Re-exports the @clack/prompts surface the CLI uses (confirm, intro,
 * outro, note, log, select, text, multiselect, spinner, isCancel) through
 * a single registration hook so tests can swap in a scripted or recording
 * adapter via setPromptsForTesting().
 *
 * Production behavior is unchanged when no adapter is registered: each
 * named export forwards to the corresponding @clack/prompts function. The
 * wrapper is a one-line drop-in replacement at call sites:
 *
 * ```typescript
 * // Before
 * import * as p from '@clack/prompts';
 * // After
 * import * as p from '../prompts/index.js';
 * ```
 *
 * The default adapter reads clack lazily so a test file that mocks
 * @clack/prompts with a partial factory (e.g. only `select` and `isCancel`)
 * keeps working even though the wrapper namespace-imports the whole module
 * methods are only resolved when called, not at module load.
 *
 * Cluster S, F-126: replaces the per-test vi.mock('@clack/prompts')
 * pattern that appears in 22 declarations across tests/unit/.
 */

import * as clack from '@clack/prompts';
import type { PromptsAdapter } from './types.js';

let registered: PromptsAdapter | null = null;

export function setPromptsForTesting(adapter: PromptsAdapter): void {
  registered = adapter;
}

export function resetPromptsForTesting(): void {
  registered = null;
}

/**
 * Returns the registered adapter when one is set, else the live
 * @clack/prompts namespace cast as a PromptsAdapter. Methods on the
 * returned object are looked up at call time, so partial vi.mock factories
 * in test files only need to provide the methods the production code path
 * under test actually invokes.
 */
export function getPrompts(): PromptsAdapter {
  return registered ?? (clack as unknown as PromptsAdapter);
}

export type { PromptsAdapter } from './types.js';

// Forward via `...args` so omitted trailing optional arguments stay omitted,
// matching the underlying @clack/prompts call shape exactly.

export const confirm: PromptsAdapter['confirm'] = (
  ...args: Parameters<PromptsAdapter['confirm']>
) => getPrompts().confirm(...args);

export const intro: PromptsAdapter['intro'] = (
  ...args: Parameters<PromptsAdapter['intro']>
) => getPrompts().intro(...args);

export const outro: PromptsAdapter['outro'] = (
  ...args: Parameters<PromptsAdapter['outro']>
) => getPrompts().outro(...args);

export const note: PromptsAdapter['note'] = (
  ...args: Parameters<PromptsAdapter['note']>
) => getPrompts().note(...args);

export const select: PromptsAdapter['select'] = (opts) =>
  getPrompts().select(opts);

export const text: PromptsAdapter['text'] = (
  ...args: Parameters<PromptsAdapter['text']>
) => getPrompts().text(...args);

export const multiselect: PromptsAdapter['multiselect'] = (opts) =>
  getPrompts().multiselect(opts);

export const spinner: PromptsAdapter['spinner'] = (
  ...args: Parameters<PromptsAdapter['spinner']>
) => getPrompts().spinner(...args);

export const isCancel: PromptsAdapter['isCancel'] = ((value: unknown) =>
  getPrompts().isCancel(value)) as PromptsAdapter['isCancel'];

/**
 * `log` is exposed as an accessor object whose methods route through
 * `getPrompts().log` at call time, so swapping the adapter mid-test takes
 * effect immediately without re-importing.
 */
export const log: PromptsAdapter['log'] = {
  info: (...args) => getPrompts().log.info(...args),
  success: (...args) => getPrompts().log.success(...args),
  warning: (...args) => getPrompts().log.warning(...args),
  warn: (...args) => getPrompts().log.warn(...args),
  error: (...args) => getPrompts().log.error(...args),
  message: (...args) => getPrompts().log.message(...args),
  step: (...args) => getPrompts().log.step(...args),
};

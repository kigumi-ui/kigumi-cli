import type { PromptsAdapter } from '../../../src/prompts/types.js';

export interface PromptScripts {
  confirm?: Array<boolean | symbol>;
  select?: Array<unknown>;
  text?: Array<string | symbol>;
  multiselect?: Array<unknown>;
  /**
   * Optional symbol that isCancel() should treat as a cancellation. When
   * omitted, isCancel() always returns false.
   */
  cancelSymbol?: symbol;
}

/**
 * Returns a PromptsAdapter that:
 * - returns scripted answers for confirm/select/text/multiselect in the
 *   order the test provided them,
 * - throws "Unexpected prompt: <method>(<arg-summary>)" when a script is
 *   exhausted or a method is called without a script (so missing scripts
 *   fail loud rather than masking missing test setup),
 * - treats isCancel() as false unless the test passes the configured
 *   `cancelSymbol` (matches @clack/prompts' cancellation contract),
 * - intro/outro/note/log/spinner are no-ops; tests should assert on
 *   recorded output via createRecordingOutput() instead, since prompt UX
 *   chrome is the output layer's concern.
 */
export function createTestPrompts(scripts: PromptScripts): PromptsAdapter {
  const queues = {
    confirm: [...(scripts.confirm ?? [])],
    select: [...(scripts.select ?? [])],
    text: [...(scripts.text ?? [])],
    multiselect: [...(scripts.multiselect ?? [])],
  };

  function take<K extends keyof typeof queues>(
    method: K,
    summary: string
  ): (typeof queues)[K][number] {
    const queue = queues[method];
    if (queue.length === 0) {
      throw new Error(`Unexpected prompt: ${method}(${summary})`);
    }
    return queue.shift() as (typeof queues)[K][number];
  }

  const noopSpinner = {
    start: () => {},
    message: () => {},
    stop: () => {},
    error: () => {},
    cancel: () => {},
    clear: () => {},
    isCancelled: false,
  };

  const adapter: PromptsAdapter = {
    confirm: (async (opts: { message?: string }) =>
      take(
        'confirm',
        JSON.stringify(opts.message ?? '')
      )) as PromptsAdapter['confirm'],
    select: (async (opts: { message?: string }) =>
      take(
        'select',
        JSON.stringify(opts.message ?? '')
      )) as PromptsAdapter['select'],
    text: (async (opts: { message?: string }) =>
      take(
        'text',
        JSON.stringify(opts.message ?? '')
      )) as PromptsAdapter['text'],
    multiselect: (async (opts: { message?: string }) =>
      take(
        'multiselect',
        JSON.stringify(opts.message ?? '')
      )) as PromptsAdapter['multiselect'],
    intro: () => {},
    outro: () => {},
    note: () => {},
    spinner: (() => noopSpinner) as PromptsAdapter['spinner'],
    isCancel: ((value: unknown): boolean =>
      scripts.cancelSymbol !== undefined &&
      value === scripts.cancelSymbol) as PromptsAdapter['isCancel'],
    log: {
      info: () => {},
      success: () => {},
      warning: () => {},
      warn: () => {},
      error: () => {},
      message: () => {},
      step: () => {},
    },
  };

  return adapter;
}

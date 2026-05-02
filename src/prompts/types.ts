/**
 * Prompts Adapter Interface
 *
 * Defines the @clack/prompts API surface the CLI consumes. The adapter
 * shape mirrors the upstream signatures via `typeof clack.X` so tests can
 * pass a recording or scripted instance into setPromptsForTesting() without
 * having to reimplement clack's types.
 */

import type * as clack from '@clack/prompts';

export interface PromptsAdapter {
  confirm: typeof clack.confirm;
  intro: typeof clack.intro;
  outro: typeof clack.outro;
  note: typeof clack.note;
  log: typeof clack.log;
  select: typeof clack.select;
  text: typeof clack.text;
  multiselect: typeof clack.multiselect;
  spinner: typeof clack.spinner;
  isCancel: typeof clack.isCancel;
}

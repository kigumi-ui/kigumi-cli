/**
 * Vue adapter for the Template function harness (issue #76).
 *
 * A Vue Template re-emits each CEM event under its own name
 * (`emit('wa-after-hide', e)`), so a consumer's `@wa-after-hide` listener
 * arrives as the `on`-prefixed PascalCase prop with the `wa-` prefix kept
 * (`onWaAfterHide`). Public CEM methods are read off the `defineExpose`
 * proxy. The contract itself lives in `template-function-harness.ts`.
 *
 * One check is Vue-only: every CEM event must be declared in the component's
 * `emits`. An undeclared `onWaShow` is not an emit listener at all: it falls
 * through `$attrs` to the host as a native listener, so a dispatch reaches the
 * consumer without the Template wiring anything. The shared cleanup check
 * would catch the leak, but under a message that points at the wrong cause.
 */

import { toPascalCase } from '../../src/utils/naming.js';
import {
  proveTemplate,
  type TemplateAdapter,
  type TemplateProbe,
  type TemplateProof,
} from './template-function-harness.js';

export {
  probeAttributes,
  type MountedTemplate,
  type ProofCoverage,
} from './template-function-harness.js';

export interface VueTemplateProbe extends Omit<TemplateProbe, 'adapter'> {
  /** The compiled component's `emits` option, as Vue normalises it. */
  emits: readonly string[] | Record<string, unknown> | undefined;
}

export type VueTemplateProof = TemplateProof;

export const VUE_ADAPTER: TemplateAdapter = {
  callbackName: (eventName) => `on${toPascalCase(eventName)}`,
  handleName: 'defineExpose',
};

export async function proveVueTemplate(
  probe: VueTemplateProbe
): Promise<VueTemplateProof> {
  const { emits, ...rest } = probe;
  const declared = new Set(
    Array.isArray(emits) ? emits : Object.keys(emits ?? {})
  );
  const undeclared = probe.metadata.events
    .filter((event) => !declared.has(event.name))
    .map((event) => `emit ${event.name} is not declared in defineEmits`);

  const proof = await proveTemplate({ ...rest, adapter: VUE_ADAPTER });
  return { ...proof, violations: [...undeclared, ...proof.violations] };
}

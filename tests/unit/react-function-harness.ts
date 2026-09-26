/**
 * React adapter for the Template function harness (issues #74, #75).
 *
 * A CEM event becomes the `on`-prefixed PascalCase prop with the `wa-` vendor
 * prefix stripped (`wa-after-hide` -> `onAfterHide`), and public CEM methods
 * are read off the `useImperativeHandle` ref. The contract itself lives in
 * `template-function-harness.ts`.
 */

import { stripWaPrefix, toPascalCase } from '../../src/utils/naming.js';
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

export type ReactTemplateProbe = Omit<TemplateProbe, 'adapter'>;
export type ReactTemplateProof = TemplateProof;

export const REACT_ADAPTER: TemplateAdapter = {
  callbackName: (eventName) => `on${toPascalCase(stripWaPrefix(eventName))}`,
  handleName: 'ref',
  forwardsClass: true,
};

export function proveReactTemplate(
  probe: ReactTemplateProbe
): Promise<ReactTemplateProof> {
  return proveTemplate({ ...probe, adapter: REACT_ADAPTER });
}

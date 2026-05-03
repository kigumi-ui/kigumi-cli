import type { RecordingOutput } from './output.js';
import type { PromptsAdapter } from '../../../src/prompts/types.js';

/**
 * Registers a recording output and a scripted prompts adapter on the
 * production module-level seams (`setOutputForTesting`,
 * `setPromptsForTesting`). Call after `vi.resetModules()` so the seam
 * registration lands on the freshly-evaluated module instance, before the
 * production command's dynamic import.
 *
 * Cluster S, F-126: extracted from 14 inlined per-file copies.
 */
export async function registerTestSeams(
  output: RecordingOutput,
  prompts: PromptsAdapter
): Promise<void> {
  const outMod = await import('../../../src/output/index.js');
  outMod.setOutputForTesting(output);
  const promptsMod = await import('../../../src/prompts/index.js');
  promptsMod.setPromptsForTesting(prompts);
}

/**
 * Clears the seam state registered by `registerTestSeams`. Call in
 * `afterEach` so subsequent tests don't pick up stale recording output or
 * scripted prompts.
 */
export async function clearTestSeams(): Promise<void> {
  const outMod = await import('../../../src/output/index.js');
  outMod.resetOutputForTesting();
  const promptsMod = await import('../../../src/prompts/index.js');
  promptsMod.resetPromptsForTesting();
}

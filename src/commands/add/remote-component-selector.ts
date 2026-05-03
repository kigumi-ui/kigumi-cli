/**
 * Remote Component Selection Logic
 *
 * Handles interactive and non-interactive component selection
 * from a community registry.
 */

import * as p from '../../prompts/index.js';
import type { CommunityRegistry } from '../../schemas/community-registry.js';
import type { OutputInterface } from '../../output/types.js';
import type { Framework } from '../../schemas/config.js';

/**
 * Select components from a remote registry
 *
 * @param components - Component names from CLI args
 * @param registry - Fetched community registry
 * @param framework - User's framework
 * @param output - Output interface
 * @returns List of component keys to install
 */
export async function selectRemoteComponents(
  components: string[],
  registry: CommunityRegistry,
  framework: Framework,
  _output: OutputInterface
): Promise<string[]> {
  // Filter to components that support the user's framework
  const available = getAvailableRemoteComponents(registry, framework);

  // Direct component names provided
  if (components.length > 0) {
    return components;
  }

  // Interactive selection
  return selectRemoteComponentsInteractive(available, registry);
}

/**
 * Get component keys available for a specific framework
 */
export function getAvailableRemoteComponents(
  registry: CommunityRegistry,
  framework: Framework
): string[] {
  return Object.entries(registry.components)
    .filter(([, comp]) => framework in comp.files)
    .map(([key]) => key)
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Interactive component selection from remote registry
 */
async function selectRemoteComponentsInteractive(
  available: string[],
  registry: CommunityRegistry
): Promise<string[]> {
  if (available.length === 0) {
    throw new Error(
      'No components available for your framework in this registry'
    );
  }

  const choices = available.map((key) => {
    const comp = registry.components[key];
    return {
      value: key,
      label: comp.name,
      hint: comp.category || '',
    };
  });

  const selected = await p.multiselect({
    message: 'Select components (space to select, enter to confirm):',
    options: choices,
    required: true,
  });

  if (p.isCancel(selected)) {
    throw new Error('Operation cancelled');
  }

  return selected as string[];
}

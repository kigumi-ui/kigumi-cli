/**
 * Component Selection Logic
 *
 * Handles interactive and non-interactive component selection
 */

import * as p from '@clack/prompts';
import { getAllComponents } from '../../utils/registry.js';
import { isComponentAvailable } from '../../utils/tier-restrictions.js';
import type { OutputInterface } from '../../output/types.js';
import type { AddOptions } from '../../schemas/index.js';

/**
 * Select components to add
 *
 * @param components - Component names from CLI args
 * @param options - Command options
 * @param tier - User's tier (free/pro)
 * @param output - Output interface
 * @returns List of component names to add
 */
export async function selectComponents(
  components: string[],
  options: AddOptions,
  tier: 'free' | 'pro',
  _output: OutputInterface
): Promise<string[]> {
  // All components mode
  if (options.all) {
    return getAllAvailableComponents(tier);
  }

  // Interactive selection mode
  if (components.length === 0) {
    return selectComponentsInteractive(tier);
  }

  // Direct component names provided
  return components;
}

/**
 * Get all available components for tier
 */
function getAllAvailableComponents(tier: 'free' | 'pro'): string[] {
  const allComponents = getAllComponents();
  return Object.keys(allComponents)
    .filter((key) => isComponentAvailable(key, tier))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Interactive component selection
 */
async function selectComponentsInteractive(
  tier: 'free' | 'pro'
): Promise<string[]> {
  const allComponents = getAllComponents();

  const choices = Object.entries(allComponents)
    .filter(([key]) => isComponentAvailable(key, tier))
    .map(([key, comp]) => ({
      value: key,
      label: comp.name,
      hint: `${comp.category}${comp.tier === 'pro' ? ' • Pro' : ''}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

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

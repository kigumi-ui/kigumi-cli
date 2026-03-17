/**
 * Existing Configuration Handler
 *
 * Handles cases where configuration already exists
 */

import * as p from '@clack/prompts';
import type { OutputInterface } from '../../output/types.js';
import { loadConfig } from '../../utils/config.js';

export type ExistingConfigAction = 'update' | 'reinstall' | 'cancel';

/**
 * Handle existing configuration
 *
 * @param cwd - Current working directory
 * @param output - Output interface
 * @param force - Force overwrite in non-interactive mode
 * @returns Action to take
 */
export async function handleExistingConfig(
  cwd: string,
  output: OutputInterface,
  force = false
): Promise<ExistingConfigAction | null> {
  const existingConfig = loadConfig(cwd);

  if (!existingConfig) {
    output.warning('Configuration file exists but could not be loaded');
    return null;
  }

  const { detectTier } = await import('../../utils/tier.js');
  const tier = await detectTier(cwd);

  // Show existing config
  output.note(
    'Current Configuration',
    `Framework: ${existingConfig.framework}\n` +
      `TypeScript: ${existingConfig.typescript}\n` +
      `Tier: ${tier}\n` +
      `Theme: ${existingConfig.theme.selected}`
  );

  // In force mode (non-interactive), automatically update
  if (force) {
    output.info('Overwriting existing configuration (non-interactive mode)');
    return 'update';
  }

  // Ask what to do
  const action = await p.select({
    message: 'Configuration already exists. What would you like to do?',
    options: [
      {
        value: 'update',
        label: 'Update configuration',
        hint: 'Modify settings',
      },
      {
        value: 'reinstall',
        label: 'Reinstall dependencies only',
        hint: 'Keep config, reinstall packages',
      },
      { value: 'cancel', label: 'Cancel', hint: 'Exit without changes' },
    ],
  });

  if (p.isCancel(action)) {
    return 'cancel';
  }

  return action as ExistingConfigAction;
}

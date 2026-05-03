/**
 * Existing Configuration Handler
 *
 * Handles cases where configuration already exists
 */

import * as p from '../../prompts/index.js';
import type { OutputInterface } from '../../output/types.js';
import type { KigumiConfig } from '../../schemas/config.js';
import type { Tier } from '../../utils/tier.js';

export type ExistingConfigAction = 'update' | 'reinstall' | 'cancel';

/**
 * Handle existing configuration
 *
 * Caller must ensure a config was successfully loaded before calling this.
 * The function displays the current configuration and asks the user what to
 * do (update, reinstall, or cancel).
 *
 * @param existingConfig - Previously loaded config (guaranteed non-null by caller)
 * @param tier - Pre-resolved tier. Caller detects once at the command entry
 *   and threads it through so this helper does not repeat the .env/package.json
 *   lookup.
 * @param output - Output interface
 * @param force - Force overwrite in non-interactive mode
 * @returns Action to take
 */
export async function handleExistingConfig(
  existingConfig: KigumiConfig,
  tier: Tier,
  output: OutputInterface,
  force = false
): Promise<ExistingConfigAction | null> {
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

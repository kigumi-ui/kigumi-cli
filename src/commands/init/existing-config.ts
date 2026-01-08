/**
 * Existing Configuration Handler
 *
 * Handles cases where configuration already exists
 */

import fs from 'fs-extra';
import path from 'path';
import * as p from '@clack/prompts';
import type { OutputInterface } from '../../output/types.js';
import { loadConfig } from '../../utils/config.js';

export type ExistingConfigAction = 'update' | 'reinstall' | 'cancel';

/**
 * Handle existing configuration
 *
 * @param cwd - Current working directory
 * @param output - Output interface
 * @returns Action to take
 */
export async function handleExistingConfig(
  cwd: string,
  output: OutputInterface
): Promise<ExistingConfigAction | null> {
  const configPath = path.join(cwd, 'kigumi-components.json');
  const exists = await fs.pathExists(configPath);

  if (!exists) {
    return null;
  }

  // Load existing config
  const existingConfig = loadConfig(cwd);

  if (!existingConfig) {
    output.warning('Configuration file exists but could not be loaded');
    return null;
  }

  // Show existing config
  output.note(
    'Current Configuration',
    `Framework: ${existingConfig.framework}\n` +
    `TypeScript: ${existingConfig.typescript}\n` +
    `Tier: ${existingConfig.webAwesome?.tier || 'free'}\n` +
    `Theme: ${existingConfig.theme.selected}`
  );

  // Ask what to do
  const action = await p.select({
    message: 'Configuration already exists. What would you like to do?',
    options: [
      { value: 'update', label: 'Update configuration', hint: 'Modify settings' },
      { value: 'reinstall', label: 'Reinstall dependencies only', hint: 'Keep config, reinstall packages' },
      { value: 'cancel', label: 'Cancel', hint: 'Exit without changes' },
    ],
  });

  if (p.isCancel(action)) {
    return 'cancel';
  }

  return action as ExistingConfigAction;
}

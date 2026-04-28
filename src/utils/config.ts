/**
 * Configuration Management
 *
 * PURPOSE: Load, save, and manage kigumi.config.json configuration files.
 *
 * EXPORTS:
 * - loadConfig() - Load configuration from project
 * - saveConfig() - Save configuration to project
 * - getConfig() - Get resolved configuration with defaults
 *
 * @internal - Utility module for internal CLI use
 */

import { cosmiconfigSync } from 'cosmiconfig';
import fs from 'fs-extra';
import path from 'path';
import { DEFAULT_CONFIG, mergeWithDefaults } from '../schemas/config.js';
import type { KigumiConfig } from '../schemas/config.js';

// Re-export type and defaults from the canonical source (schemas/config.ts)
export type { KigumiConfig };
export { DEFAULT_CONFIG };

/**
 * Load kigumi configuration from the user's project
 * @internal
 */
export function loadConfig(cwd: string = process.cwd()): KigumiConfig | null {
  const explorer = cosmiconfigSync('kigumi', {
    searchPlaces: [
      'kigumi.config.json', // NEW: Preferred name
      'kigumi-components.json', // OLD: For backward compatibility
      'kigumi.json',
      '.kigumirc',
      '.kigumirc.json',
      'package.json',
    ],
  });

  const result = explorer.search(cwd);
  return result?.config ?? null;
}

/**
 * Save kigumi configuration to the user's project
 * @internal
 */
export async function saveConfig(
  config: KigumiConfig,
  cwd: string = process.cwd()
): Promise<void> {
  const configPath = path.join(cwd, 'kigumi.config.json');
  await fs.writeJson(configPath, config, { spaces: 2 });
}

/**
 * Get the resolved configuration with defaults
 * @internal
 */
export function getConfig(cwd: string = process.cwd()): KigumiConfig {
  const userConfig = loadConfig(cwd);
  return userConfig ? mergeWithDefaults(userConfig) : DEFAULT_CONFIG;
}

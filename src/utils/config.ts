/**
 * Configuration Management
 *
 * PURPOSE: Load, save, and manage kigumi.config.json configuration files.
 *
 * EXPORTS:
 * - loadConfig() - Load configuration from project
 * - saveConfig() - Save configuration to project
 * - getConfig() - Get cached configuration
 *
 * @internal - Utility module for internal CLI use
 */

import { cosmiconfigSync } from 'cosmiconfig';
import fs from 'fs-extra';
import path from 'path';

/**
 * Configuration interface for kigumi projects
 * @public - Used by command handlers
 */
export interface KigumiConfig {
  framework: 'react' | 'vue' | 'svelte' | 'angular';
  typescript: boolean;
  componentsDir: string;
  utilsDir?: string;
  stylesDir?: string;
  theme: {
    selected: string; // Which theme to use (default, awesome, shoelace, none, or pro themes)
    palette: string; // Color palette (default, bright, shoelace, etc.)
    brandColor: string; // Brand color mapping (blue, purple, green, etc.)
  };
  aliases?: Record<string, string>;
  webAwesome?: {
    version?: string;
    cdnUrl?: string; // Optional CDN URL override
  };
}

export const DEFAULT_CONFIG: KigumiConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: {
    selected: 'default',
    palette: 'default',
    brandColor: 'blue',
  },
  aliases: {
    '@/components': './src/components',
    '@/lib': './src/lib',
    '@/styles': './src/styles',
  },
  webAwesome: {
    version: '^3.2.1',
  },
};

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
  return userConfig ? { ...DEFAULT_CONFIG, ...userConfig } : DEFAULT_CONFIG;
}

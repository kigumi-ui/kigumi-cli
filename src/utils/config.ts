import { cosmiconfigSync } from 'cosmiconfig';
import fs from 'fs-extra';
import path from 'path';

export interface KigumiConfig {
  framework: 'react' | 'vue' | 'svelte' | 'angular';
  typescript: boolean;
  componentsDir: string;
  utilsDir?: string;
  theme: {
    cssVars: boolean;
    selected: 'default' | 'awesome' | 'shoelace' | 'none';  // Which theme to use
    palette: string;                         // Color palette (default, or Pro palettes)
    brandColor: string;                      // Brand color mapping (blue, purple, green, etc.)
  };
  aliases?: Record<string, string>;
  webAwesome?: {
    tier: 'free' | 'pro';                    // NEW: Free or Pro
    version?: string;
    tokenEnvVar?: string;                    // Only for Pro
    cdnUrl?: string;                         // Only for Pro (optional)
  };
}

export const DEFAULT_CONFIG: KigumiConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  utilsDir: 'src/lib',
  theme: {
    cssVars: true,
    selected: 'default',
    palette: 'default',
    brandColor: 'blue',
  },
  aliases: {
    '@/components': './src/components',
    '@/lib': './src/lib',
  },
  webAwesome: {
    tier: 'free',
    version: '^3.1.0',
  },
};

/**
 * Load kigumi configuration from the user's project
 */
export function loadConfig(cwd: string = process.cwd()): KigumiConfig | null {
  const explorer = cosmiconfigSync('kigumi', {
    searchPlaces: [
      'kigumi.json',
      'kigumi-components.json',
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
 */
export async function saveConfig(
  config: KigumiConfig,
  cwd: string = process.cwd()
): Promise<void> {
  const configPath = path.join(cwd, 'kigumi-components.json');
  await fs.writeJson(configPath, config, { spaces: 2 });
}

/**
 * Get the resolved configuration with defaults
 */
export function getConfig(cwd: string = process.cwd()): KigumiConfig {
  const userConfig = loadConfig(cwd);
  return userConfig ? { ...DEFAULT_CONFIG, ...userConfig } : DEFAULT_CONFIG;
}

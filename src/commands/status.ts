/**
 * Status Command
 *
 * PURPOSE: Displays current project status including tier, theme, components, and token info.
 *
 * Shows:
 * - Current tier (Free/Pro)
 * - Framework and TypeScript status
 * - Theme configuration
 * - Token status
 * - Installed components
 * - Warnings for tier mismatches or duplicate packages
 *
 * @public
 */

import fs from 'fs-extra';
import path from 'path';
import {
  ENV_FILE_NAME,
  ENV_TOKEN_REGEX,
  MIN_TOKEN_LENGTH,
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../constants.js';
import { getOutput } from '../output/index.js';
import { loadConfig } from '../utils/config.js';
import { detectTier } from '../utils/tier.js';
import type { Tier } from '../utils/tier.js';
import { handleError, ConfigNotFoundError } from '../errors/index.js';

interface StatusOptions {
  cwd?: string;
}

/**
 * Get list of installed components from components directory
 */
async function getInstalledComponents(
  componentsDir: string
): Promise<string[]> {
  try {
    if (!(await fs.pathExists(componentsDir))) {
      return [];
    }

    const entries = await fs.readdir(componentsDir, { withFileTypes: true });
    const components = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    return components;
  } catch {
    return [];
  }
}

/**
 * Get installed Web Awesome package info
 * @internal
 */
async function getPackageInfo(
  cwd: string
): Promise<{ package: string; version: string } | null> {
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      return null;
    }

    const packageJson = await fs.readJSON(packageJsonPath);
    const dependencies = packageJson.dependencies || {};

    // Check for Pro package first
    if (dependencies[WEB_AWESOME_PRO_PACKAGE]) {
      return {
        package: WEB_AWESOME_PRO_PACKAGE,
        version: dependencies[WEB_AWESOME_PRO_PACKAGE],
      };
    }

    // Check for Free package
    if (dependencies[WEB_AWESOME_FREE_PACKAGE]) {
      return {
        package: WEB_AWESOME_FREE_PACKAGE,
        version: dependencies[WEB_AWESOME_FREE_PACKAGE],
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if token exists in .env
 * @internal
 */
async function checkTokenStatus(cwd: string): Promise<boolean> {
  try {
    const envPath = path.join(cwd, ENV_FILE_NAME);
    if (!(await fs.pathExists(envPath))) {
      return false;
    }

    const content = await fs.readFile(envPath, 'utf-8');
    const tokenMatch = content.match(ENV_TOKEN_REGEX);

    return !!(
      tokenMatch &&
      tokenMatch[1] &&
      tokenMatch[1].length >= MIN_TOKEN_LENGTH
    );
  } catch {
    return false;
  }
}

/**
 * Status command - displays current project status
 */
export async function statusCommand(
  options: StatusOptions = {}
): Promise<void> {
  const cwd = options.cwd || process.cwd();
  const output = getOutput();

  try {
    output.intro('kigumi status');

    // 1. Load config
    const config = await loadConfig(cwd);
    if (!config) {
      throw new ConfigNotFoundError(cwd);
    }

    // 2. Detect tier
    const tier: Tier = await detectTier(cwd);

    // 3. Check token status
    const hasToken = await checkTokenStatus(cwd);

    // 4. Get package info
    const packageInfo = await getPackageInfo(cwd);

    // 5. Get installed components
    const componentsPath = path.join(cwd, config.componentsDir);
    const components = await getInstalledComponents(componentsPath);

    // 6. Display info
    output.info(`Tier: ${tier}${tier === 'pro' ? ' 🌟' : ''}`);
    output.info(`Framework: ${config.framework}`);
    output.info(`TypeScript: ${config.typescript ? 'Yes' : 'No'}`);
    output.info(`Components Directory: ${config.componentsDir}`);
    output.info('');
    output.info('Theme Configuration:');
    output.info(`  Theme: ${config.theme.selected}`);
    output.info(`  Palette: ${config.theme.palette}`);
    output.info(`  Brand Color: ${config.theme.brandColor}`);
    output.info('');

    // 7. Token status
    if (hasToken) {
      output.info('Token: Present ✓');
    } else {
      output.info('Token: Not found');
      if (tier === 'free') {
        output.info('  (Pro token not required for Free tier)');
      }
    }

    // 8. Package info
    if (packageInfo) {
      output.info('');
      output.info('Installed Package:');
      output.info(`  ${packageInfo.package}@${packageInfo.version}`);
    }

    // 9. Components
    output.info('');
    output.info(`Installed Components: ${components.length}`);
    if (components.length > 0) {
      output.note('Components', components.map((c) => `  • ${c}`).join('\n'));
    }

    // 10. Warnings
    const warnings: string[] = [];

    // Check for tier mismatch
    if (tier === 'free' && packageInfo?.package === WEB_AWESOME_PRO_PACKAGE) {
      warnings.push(
        '⚠️  Pro package installed but no token found - may cause installation issues'
      );
    }

    if (tier === 'pro' && packageInfo?.package === WEB_AWESOME_FREE_PACKAGE) {
      warnings.push(
        '⚠️  Free package installed but Pro token present - consider upgrading package'
      );
    }

    // Check for duplicate packages
    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      const packageJson = await fs.readJSON(packageJsonPath);
      const hasFree = !!packageJson.dependencies?.[WEB_AWESOME_FREE_PACKAGE];
      const hasPro = !!packageJson.dependencies?.[WEB_AWESOME_PRO_PACKAGE];

      if (hasFree && hasPro) {
        warnings.push(
          '⚠️  Both webawesome and webawesome-pro are installed - consider removing Free package'
        );
      }
    } catch {
      // Ignore
    }

    if (warnings.length > 0) {
      output.info('');
      output.warning('Warnings:\n' + warnings.join('\n'));
    }

    output.outro('✓ Status check complete');
  } catch (error) {
    handleError(error, output);
  }
}

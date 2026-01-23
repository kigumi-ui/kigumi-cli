/**
 * Theme Command
 *
 * PURPOSE: Changes the Web Awesome theme.
 *
 * @public
 */

import type { KigumiConfig } from '../schemas/config.js';

import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../checks/index.js';
import {
  handleError,
  UserCancelledError,
  PreFlightCheckError,
} from '../errors/index.js';
import { TierRestrictionError } from '../errors/tier.js';
import { loadConfig, saveConfig, getConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';
import {
  getAvailableThemes,
  isThemeAvailable,
} from '../utils/tier-restrictions.js';

async function themeAction(themeName?: string) {
  const output = getOutput();
  const cwd = process.cwd();

  try {
    // 1. Load configuration (needed for checks)
    let config: KigumiConfig | undefined;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch {
      // Config loading failed - will be caught by checks
    }

    // 2. Pre-flight checks
    const checker = new CheckRunner()
      .add(new ConfigExistsCheck())
      .add(new ConfigValidCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      throw new PreFlightCheckError(checkResults);
    }

    // Config must be loaded at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    // Detect tier from .env
    const { detectTier } = await import('../utils/tier.js');
    const tier = await detectTier(cwd);

    const availableThemes = getAvailableThemes(tier).filter(
      (t) => t !== 'custom'
    );

    // 3. Interactive selection if no theme provided
    const selectedTheme =
      themeName ||
      (await p.select({
        message: 'Select a theme:',
        options: availableThemes.map((theme) => ({
          value: theme,
          label: theme.charAt(0).toUpperCase() + theme.slice(1),
        })),
        initialValue: availableThemes.includes(config.theme.selected)
          ? config.theme.selected
          : availableThemes[0],
      }));

    if (p.isCancel(selectedTheme)) {
      throw new UserCancelledError();
    }

    // 4. Validate theme availability
    if (!isThemeAvailable(selectedTheme, tier)) {
      throw new TierRestrictionError(`theme:${selectedTheme}`, 'pro', tier);
    }

    // 5. Update theme
    const spinner = output.spinner('Updating theme...');

    config.theme.selected = selectedTheme;
    await saveConfig(config, cwd);

    const utilsDir = config.utilsDir || 'src/lib';
    await regenerateWebAwesomeSetup(cwd, config, utilsDir);

    spinner.stop('Theme updated');

    output.outro(
      `${pc.green('✓')} Theme set to ${pc.cyan(selectedTheme)}\n` +
        pc.dim('Reload your browser to see changes')
    );
  } catch (error) {
    handleError(error, output);
  }
}

export const themeCommand = new Command('theme')
  .description('Change the Web Awesome theme')
  .argument('[name]', 'Theme name (omit to see options)')
  .action(themeAction);

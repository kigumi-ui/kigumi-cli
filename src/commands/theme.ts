/**
 * Theme Command
 *
 * PURPOSE: Changes the Web Awesome theme.
 *
 * @public
 */

import type { KigumiConfig } from '../schemas/config.js';

import { Command } from 'commander';
import * as p from '../prompts/index.js';
import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import { CheckRunner, ConfigExistsCheck } from '../checks/index.js';
import {
  handleError,
  UserCancelledError,
  PreFlightCheckError,
  ConfigNotFoundError,
} from '../errors/index.js';
import { TierRestrictionError } from '../errors/tier.js';
import { saveConfig, getConfig } from '../utils/config.js';
import { regenerateKigumiSetup } from '../utils/regenerate.js';
import { detectTier } from '../utils/tier.js';
import {
  getAvailableThemes,
  isThemeAvailable,
} from '../utils/tier-restrictions.js';
import { listCommand } from './theme/list.js';
import { showCommand } from './theme/show.js';

async function themeAction(themeName?: string) {
  const output = getOutput();
  const cwd = process.cwd();

  try {
    // 1. Load configuration (needed for checks).
    // getConfig() internally calls loadConfig() and deep-merges with defaults,
    // so a single call is sufficient. ConfigNotFoundError is swallowed because
    // ConfigExistsCheck below shows a friendlier "run kigumi init" message;
    // ConfigInvalidError must surface so users see schema issues directly.
    let config: KigumiConfig | undefined;
    try {
      config = getConfig(cwd);
    } catch (err) {
      if (!(err instanceof ConfigNotFoundError)) throw err;
    }

    // 2. Pre-flight checks
    const checker = new CheckRunner().add(new ConfigExistsCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      throw new PreFlightCheckError(checkResults);
    }

    // Config must be loaded at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    // Detect tier from .env
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
    await saveConfig({ theme: { selected: selectedTheme } }, cwd);

    const utilsDir = config.utilsDir;
    await regenerateKigumiSetup(cwd, config, utilsDir);

    spinner.stop('Theme updated');

    output.outro(
      `${pc.green('✓')} Theme set to ${pc.cyan(selectedTheme)}\n` +
        pc.dim('Reload your browser to see changes')
    );
  } catch (error) {
    handleError(error, output);
  }
}

export const themeCommand = new Command('theme').description(
  'Manage Web Awesome themes'
);

// Default action: select/set a built-in theme
themeCommand
  .command('set', { isDefault: true })
  .description('Set a built-in theme')
  .argument('[name]', 'Theme name (omit to see options)')
  .action(themeAction);

// Install a community theme from a remote registry
themeCommand
  .command('install')
  .description('Install a theme from a community registry')
  .argument('<name>', 'Theme name in the registry')
  .requiredOption('--from <source>', 'Registry URL or connected name')
  .action(async (name: string, options: { from: string }) => {
    const { themeInstallAction } = await import('./theme/install.js');
    await themeInstallAction(name, options);
  });

themeCommand.addCommand(listCommand);
themeCommand.addCommand(showCommand);

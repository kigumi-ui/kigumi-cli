/**
 * Theme Command
 *
 * Changes the Web Awesome theme
 */

import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import { CheckRunner, ConfigExistsCheck, ConfigValidCheck } from '../checks/index.js';
import { handleError, UserCancelledError } from '../errors/index.js';
import { TierRestrictionError } from '../errors/tier.js';
import { loadConfig, saveConfig, getConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';
import {
  getAvailableThemes,
  isThemeAvailable,
} from '../utils/tier-restrictions.js';

async function themeAction(themeName?: string) {
  const output = getOutput();
  output.intro('kigumi theme');

  const cwd = process.cwd();

  try {
    // 1. Load configuration (needed for checks)
    let config: any;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch (error) {
      // Config loading failed - will be caught by checks
    }

    // 2. Pre-flight checks
    const checker = new CheckRunner()
      .add(new ConfigExistsCheck())
      .add(new ConfigValidCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      output.error('Pre-flight checks failed');
      output.note('Issues found', checker.formatResults(checkResults));
      process.exit(1);
    }

    // 3. Config is valid at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    const tier = config.webAwesome?.tier || 'free';
    let selectedTheme = themeName;

    // 3. Interactive selection if no theme provided
    if (!selectedTheme) {
      const availableThemes = getAvailableThemes(tier);

      const options = availableThemes
        .filter((t) => t !== 'custom')
        .map((theme) => ({
          value: theme,
          label: theme.charAt(0).toUpperCase() + theme.slice(1),
          hint: theme === config.theme.selected ? 'Current' : '',
        }));

      const selected = await p.select({
        message: 'Select a theme:',
        options,
        initialValue: config.theme.selected,
      });

      if (p.isCancel(selected)) {
        throw new UserCancelledError();
      }

      selectedTheme = selected as string;
    }

    // 4. Validate theme availability
    if (!isThemeAvailable(selectedTheme, tier)) {
      const availableThemes = getAvailableThemes(tier).filter((t) => t !== 'custom');

      throw new TierRestrictionError('theme', selectedTheme, [
        {
          title: 'Available free themes',
          steps: availableThemes.map(t => `- ${t}`),
        },
        {
          title: 'Upgrade to Pro',
          steps: [
            'Run: kigumi init',
            'Select "Pro" tier',
            'Enter your Web Awesome Pro token',
          ],
        },
      ]);
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

/**
 * Theme Set Command
 *
 * Switches to a different theme.
 */

import type { KigumiConfig } from '../../schemas/config.js';
import { Command } from 'commander';
import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { saveConfig, getConfig } from '../../utils/config.js';
import { regenerateKigumiSetup } from '../../utils/regenerate.js';
import { detectTier } from '../../utils/tier.js';
import {
  getAvailableThemes,
  isThemeAvailable,
} from '../../utils/tier-restrictions.js';
import { CheckRunner, ConfigExistsCheck } from '../../checks/index.js';
import {
  handleError,
  PreFlightCheckError,
  ConfigNotFoundError,
} from '../../errors/index.js';
import { ProThemeRequiredError } from '../../errors/tier.js';

export const setCommand = new Command('set')
  .description('Switch to a different theme')
  .argument('<theme>', 'Theme name (default, dark, or none)')
  .action(async (themeName: string) => {
    const cwd = process.cwd();
    const output = getOutput();

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

      // 4. Validate theme name
      if (!isThemeAvailable(themeName, tier)) {
        const freeThemes = getAvailableThemes('free');
        throw new ProThemeRequiredError(themeName, freeThemes);
      }

      // 5. Update theme
      output.intro(`Switching to theme: ${themeName}`);

      // Update config
      config.theme.selected = themeName;

      // Save config
      const spinner = output.spinner('Updating configuration...');
      await saveConfig({ theme: { selected: themeName } }, cwd);
      spinner.stop('Updated kigumi.config.json');

      // Regenerate kigumi.ts
      const utilsDir = config.utilsDir;
      spinner.start('Regenerating setup file...');
      await regenerateKigumiSetup(cwd, config, utilsDir);
      spinner.stop(`Regenerated ${utilsDir}/kigumi.ts`);

      output.note(
        'Theme Updated! 🎨',
        `Theme: ${pc.cyan(themeName)}\n\n` +
          `HTML classes updated:\n` +
          `  ${pc.green('wa-theme-' + config.theme.selected)}\n` +
          `  ${pc.green('wa-palette-' + config.theme.palette)}\n` +
          `  ${pc.green('wa-brand-' + config.theme.brandColor)}`
      );

      output.outro(pc.green('Reload your browser to see changes'));
    } catch (error) {
      handleError(error, output);
    }
  });

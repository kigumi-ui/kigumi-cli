/**
 * Theme Set Command
 *
 * Switches to a different theme.
 */

import type { KigumiConfig } from '../../schemas/config.js';
import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig, getConfig } from '../../utils/config.js';
import { regenerateKigumiSetup } from '../../utils/regenerate.js';
import {
  getAvailableThemes,
  isThemeAvailable,
} from '../../utils/tier-restrictions.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../../checks/index.js';
import { handleError, PreFlightCheckError } from '../../errors/index.js';
import { ProThemeRequiredError } from '../../errors/tier.js';

export const setCommand = new Command('set')
  .description('Switch to a different theme')
  .argument('<theme>', 'Theme name (default, dark, or none)')
  .action(async (themeName: string) => {
    const cwd = process.cwd();

    try {
      // 1. Load configuration (needed for checks)
      let config: KigumiConfig | undefined;
      try {
        loadConfig(cwd);
        config = getConfig(cwd);
      } catch (_error) {
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
      const { detectTier } = await import('../../utils/tier.js');
      const tier = await detectTier(cwd);

      // 4. Validate theme name
      if (!isThemeAvailable(themeName, tier)) {
        const freeThemes = getAvailableThemes('free');
        throw new ProThemeRequiredError(themeName, freeThemes);
      }

      // 5. Update theme
      p.intro(pc.bgCyan(pc.black(` Switching to theme: ${themeName} `)));

      const spinner = p.spinner();

      // Update config
      config.theme.selected = themeName;

      // Save config
      spinner.start('Updating configuration...');
      await saveConfig(config, cwd);
      spinner.stop('Updated kigumi-components.json');

      // Regenerate kigumi.ts
      const utilsDir = config.utilsDir || 'src/lib';
      spinner.start('Regenerating setup file...');
      await regenerateKigumiSetup(cwd, config, utilsDir);
      spinner.stop(`Regenerated ${utilsDir}/kigumi.ts`);

      p.note(
        `Theme: ${pc.cyan(themeName)}\n\n` +
          `HTML classes updated:\n` +
          `  ${pc.green('wa-theme-' + config.theme.selected)}\n` +
          `  ${pc.green('wa-palette-' + config.theme.palette)}\n` +
          `  ${pc.green('wa-brand-' + config.theme.brandColor)}`,
        'Theme Updated! 🎨'
      );

      p.outro(pc.green('Reload your browser to see changes'));
    } catch (error) {
      handleError(error);
    }
  });

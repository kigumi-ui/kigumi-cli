import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig, getConfig } from '../../utils/config.js';
import { regenerateWebAwesomeSetup } from '../../utils/regenerate.js';
import {
  getAvailableThemes,
  isThemeAvailable,
} from '../../utils/tier-restrictions.js';
import { CheckRunner, ConfigExistsCheck, ConfigValidCheck } from '../../checks/index.js';
import { handleError } from '../../errors/index.js';

export const setCommand = new Command('set')
  .description('Switch to a different theme')
  .argument('<theme>', 'Theme name (default, dark, or none)')
  .action(async (themeName: string) => {
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
        p.log.error('Pre-flight checks failed');
        const formatted = checker.formatResults(checkResults);
        p.note(formatted, 'Issues found');
        process.exit(1);
      }

      // 3. Config is valid at this point (checks passed)
      if (!config) {
        throw new Error('Configuration not loaded despite passing checks');
      }

      const tier = config.webAwesome?.tier || 'free';

      // 4. Validate theme name
      if (!isThemeAvailable(themeName, tier)) {
        const availableThemes = getAvailableThemes(tier);

        p.log.error(`Invalid theme: ${themeName}`);
        p.log.info(
          `Available themes for ${tier} tier: ${availableThemes.join(', ')}`
        );

        if (tier === 'free') {
          p.note(
            'More themes available with Web Awesome Pro:\n' +
              '• brutalist, glossy, matter, mellow\n' +
              '• playful, premium, tailspin, active\n\n' +
              'Upgrade: Run "kigumi init" and select Pro tier',
            'Upgrade to Pro'
          );
        }

        if (themeName === 'custom') {
          p.note(
            'To create a custom theme:\n' +
              '1. Create a CSS file in src/styles/\n' +
              '2. Define theme CSS variables (--wa-color-*, --wa-font-*, etc.)\n' +
              '3. Import it in your main entry file\n' +
              '4. See: https://webawesome.com/docs/customizing',
            'Custom Theme Guide'
          );
        }

        process.exit(1);
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

      // Regenerate webawesome.ts
      const utilsDir = config.utilsDir || 'src/lib';
      spinner.start('Regenerating setup file...');
      await regenerateWebAwesomeSetup(cwd, config, utilsDir);
      spinner.stop(`Regenerated ${utilsDir}/webawesome.ts`);

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

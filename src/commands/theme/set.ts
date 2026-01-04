import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig } from '../../utils/config.js';
import { regenerateWebAwesomeSetup } from '../../utils/regenerate.js';

const VALID_THEMES = ['default', 'awesome', 'shoelace', 'none'];

export const setCommand = new Command('set')
  .description('Switch to a different theme')
  .argument('<theme>', 'Theme name (default, dark, or none)')
  .action(async (themeName: string) => {
    const cwd = process.cwd();
    const config = await loadConfig(cwd);

    if (!config) {
      p.log.error('No kigumi-components.json found. Run "kigumi init" first.');
      process.exit(1);
    }

    // Validate theme name
    if (!VALID_THEMES.includes(themeName)) {
      p.log.error(`Invalid theme: ${themeName}`);
      p.log.info(`Valid themes: ${VALID_THEMES.join(', ')}`);
      process.exit(1);
    }

    p.intro(pc.bgCyan(pc.black(` Switching to theme: ${themeName} `)));

    const spinner = p.spinner();

    // Update config
    config.theme.selected = themeName as 'default' | 'dark' | 'none';

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
  });

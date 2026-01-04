import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';

const VALID_COLORS = [
  'blue', 'purple', 'green', 'red', 'orange',
  'yellow', 'cyan', 'indigo', 'pink', 'gray'
];

export const brandCommand = new Command('brand')
  .description('Change the brand color')
  .argument('<color>', 'Brand color (blue, purple, green, etc.)')
  .action(async (color: string) => {
    const cwd = process.cwd();
    const config = await loadConfig(cwd);

    if (!config) {
      p.log.error('No kigumi-components.json found. Run "kigumi init" first.');
      process.exit(1);
    }

    if (!VALID_COLORS.includes(color)) {
      p.log.error(`Invalid brand color: ${color}`);
      p.log.info(`Valid colors: ${VALID_COLORS.join(', ')}`);
      process.exit(1);
    }

    p.intro(pc.bgCyan(pc.black(` Changing brand color to: ${color} `)));

    const spinner = p.spinner();

    // Update config
    config.theme.brandColor = color;

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
      `Brand Color: ${pc.cyan(color)}\n\n` +
      `HTML class updated: ${pc.green('wa-brand-' + color)}`,
      'Brand Color Updated! 🎨'
    );

    p.outro(pc.green('Reload your browser to see changes'));
  });

import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';

const VALID_PALETTES = {
  free: ['default'],
  pro: ['default'], // TODO: Add Pro palettes when available
};

export const paletteCommand = new Command('palette')
  .description('Change the color palette')
  .argument('<name>', 'Palette name')
  .action(async (paletteName: string) => {
    const cwd = process.cwd();
    const config = await loadConfig(cwd);

    if (!config) {
      p.log.error('No kigumi-components.json found. Run "kigumi init" first.');
      process.exit(1);
    }

    const tier = config.webAwesome?.tier || 'free';
    const validPalettes = VALID_PALETTES[tier];

    if (!validPalettes.includes(paletteName)) {
      p.log.error(`Invalid palette: ${paletteName}`);
      p.log.info(`Valid palettes for ${tier}: ${validPalettes.join(', ')}`);

      if (tier === 'free') {
        p.log.info('More palettes available with Web Awesome Pro');
      }

      process.exit(1);
    }

    p.intro(pc.bgCyan(pc.black(` Changing palette to: ${paletteName} `)));

    const spinner = p.spinner();

    // Update config
    config.theme.palette = paletteName;

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
      `Palette: ${pc.cyan(paletteName)}\n\n` +
      `HTML class updated: ${pc.green('wa-palette-' + paletteName)}`,
      'Palette Updated! 🎨'
    );

    p.outro(pc.green('Reload your browser to see changes'));
  });

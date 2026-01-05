import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';
import { getAvailablePalettes } from '../utils/tier-restrictions.js';

async function paletteAction(paletteName?: string) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  if (!config) {
    p.log.error('No kigumi-components.json found. Run "kigumi init" first.');
    process.exit(1);
  }

  const tier = config.webAwesome?.tier || 'free';
  let selectedPalette = paletteName;

  // If no palette provided, show interactive selection
  if (!selectedPalette) {
    const availablePalettes = getAvailablePalettes(tier);

    const options = availablePalettes
      .filter((pal) => pal !== 'custom')
      .map((palette) => ({
        value: palette,
        label: palette.charAt(0).toUpperCase() + palette.slice(1),
        hint: palette === config.theme.palette ? 'Current' : '',
      }));

    const selected = await p.select({
      message: 'Select a color palette:',
      options,
      initialValue: config.theme.palette,
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    selectedPalette = selected as string;
  }

  // Validate palette (all palettes available to all tiers)
  const availablePalettes = getAvailablePalettes(tier).filter((p) => p !== 'custom');
  if (!availablePalettes.includes(selectedPalette)) {
    p.log.error(`Unknown palette: ${selectedPalette}`);
    p.log.info(`Available palettes: ${availablePalettes.join(', ')}`);
    process.exit(1);
  }

  // Update palette
  const spinner = p.spinner();

  config.theme.palette = selectedPalette;

  spinner.start('Updating palette...');
  await saveConfig(config, cwd);

  const utilsDir = config.utilsDir || 'src/lib';
  await regenerateWebAwesomeSetup(cwd, config, utilsDir);
  spinner.stop('Palette updated');

  p.outro(
    `${pc.green('✓')} Palette set to ${pc.cyan(selectedPalette)}\n` +
    pc.dim('Reload your browser to see changes')
  );
}

export const paletteCommand = new Command('palette')
  .description('Change the color palette')
  .argument('[name]', 'Palette name (omit to see options)')
  .action(paletteAction);

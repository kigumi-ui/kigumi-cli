import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';

const BRAND_COLORS = [
  'blue',
  'purple',
  'green',
  'red',
  'orange',
  'yellow',
  'cyan',
  'indigo',
  'pink',
  'gray',
];

async function brandAction(colorName?: string) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  if (!config) {
    p.log.error('No kigumi-components.json found. Run "kigumi init" first.');
    process.exit(1);
  }

  let selectedColor = colorName;

  // If no color provided, show interactive selection
  if (!selectedColor) {
    const options = BRAND_COLORS.map((color) => ({
      value: color,
      label: color.charAt(0).toUpperCase() + color.slice(1),
      hint: color === config.theme.brandColor ? 'Current' : '',
    }));

    const selected = await p.select({
      message: 'Select a brand color:',
      options,
      initialValue: config.theme.brandColor,
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    selectedColor = selected as string;
  }

  // Validate brand color
  if (!BRAND_COLORS.includes(selectedColor)) {
    p.log.error(`Unknown brand color: ${selectedColor}`);
    p.log.info(`Available brand colors: ${BRAND_COLORS.join(', ')}`);
    process.exit(1);
  }

  // Update brand color
  const spinner = p.spinner();

  config.theme.brandColor = selectedColor;

  spinner.start('Updating brand color...');
  await saveConfig(config, cwd);

  const utilsDir = config.utilsDir || 'src/lib';
  await regenerateWebAwesomeSetup(cwd, config, utilsDir);
  spinner.stop('Brand color updated');

  p.outro(
    `${pc.green('✓')} Brand color set to ${pc.cyan(selectedColor)}\n` +
    pc.dim('Reload your browser to see changes')
  );
}

export const brandCommand = new Command('brand')
  .description('Change the brand color')
  .argument('[color]', 'Brand color (omit to see options)')
  .action(brandAction);

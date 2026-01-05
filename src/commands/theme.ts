import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig, saveConfig } from '../utils/config.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';
import {
  getAvailableThemes,
  isThemeAvailable,
} from '../utils/tier-restrictions.js';

async function themeAction(themeName?: string) {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  if (!config) {
    p.log.error('No kigumi-components.json found. Run "kigumi init" first.');
    process.exit(1);
  }

  const tier = config.webAwesome?.tier || 'free';
  let selectedTheme = themeName;

  // If no theme provided, show interactive selection
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
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    selectedTheme = selected as string;
  }

  // Validate theme
  if (!isThemeAvailable(selectedTheme, tier)) {
    const availableThemes = getAvailableThemes(tier).filter((t) => t !== 'custom');

    p.log.error(`Theme "${selectedTheme}" is not available for ${tier} tier.`);

    if (tier === 'free') {
      p.note(
        `${pc.yellow('This theme requires Web Awesome Pro.')}\n\n` +
        `Available themes for free tier:\n` +
        `  ${availableThemes.map(t => pc.cyan(t)).join(', ')}\n\n` +
        `Pro-only themes:\n` +
        `  ${pc.dim('brutalist, glossy, matter, mellow,')}\n` +
        `  ${pc.dim('playful, premium, tailspin, active')}\n\n` +
        `Upgrade: Run ${pc.cyan('kigumi init')} and select Pro tier`,
        'Upgrade to Pro'
      );
    } else {
      p.log.info(`Available themes: ${availableThemes.join(', ')}`);
    }

    process.exit(1);
  }

  // Update theme
  const spinner = p.spinner();

  config.theme.selected = selectedTheme;

  spinner.start('Updating theme...');
  await saveConfig(config, cwd);

  const utilsDir = config.utilsDir || 'src/lib';
  await regenerateWebAwesomeSetup(cwd, config, utilsDir);
  spinner.stop('Theme updated');

  p.outro(
    `${pc.green('✓')} Theme set to ${pc.cyan(selectedTheme)}\n` +
    pc.dim('Reload your browser to see changes')
  );
}

export const themeCommand = new Command('theme')
  .description('Change the Web Awesome theme')
  .argument('[name]', 'Theme name (omit to see options)')
  .action(themeAction);

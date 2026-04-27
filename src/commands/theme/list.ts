import { Command } from 'commander';
import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { detectTier } from '../../utils/tier.js';

export const listCommand = new Command('list')
  .description('List available themes, palettes, and brand colors')
  .action(async () => {
    const cwd = process.cwd();
    const output = getOutput();

    output.intro('Available Themes');

    const tier = await detectTier(cwd);

    // Themes
    output.note(
      'Themes',
      `${pc.cyan('Free:')}\n` +
        `  - default (Recommended)\n` +
        `  - awesome\n` +
        `  - shoelace\n` +
        `  - none (No theme, just base styles)\n` +
        (tier === 'pro'
          ? `\n${pc.cyan('Pro:')}\n  - Additional themes available (check webawesome.com)`
          : '')
    );

    // Palettes
    output.note(
      'Color Palettes',
      `${pc.cyan('Free:')}\n` +
        `  - default\n` +
        (tier === 'pro'
          ? `\n${pc.cyan('Pro:')}\n  - Additional palettes available (check webawesome.com)`
          : '')
    );

    // Brand Colors
    output.note(
      'Brand Colors',
      `${pc.cyan('Available for all tiers:')}\n` +
        `  - blue (Recommended)\n` +
        `  - purple\n` +
        `  - green\n` +
        `  - red\n` +
        `  - orange\n` +
        `  - yellow\n` +
        `  - cyan\n` +
        `  - indigo\n` +
        `  - pink\n` +
        `  - gray`
    );

    output.outro(`Run ${pc.cyan('kigumi theme set <name>')} to switch themes`);
  });

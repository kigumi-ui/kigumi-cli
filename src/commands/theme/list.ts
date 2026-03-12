import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';

export const listCommand = new Command('list')
  .description('List available themes, palettes, and brand colors')
  .action(async () => {
    p.intro(pc.bgCyan(pc.black(' Available Themes ')));

    const cwd = process.cwd();
    const { detectTier } = await import('../../utils/tier.js');
    const tier = await detectTier(cwd);

    // Themes
    p.note(
      `${pc.cyan('Free:')}\n` +
        `  - default (Recommended)\n` +
        `  - awesome\n` +
        `  - shoelace\n` +
        `  - none (No theme, just base styles)\n` +
        (tier === 'pro'
          ? `\n${pc.cyan('Pro:')}\n  - Additional themes available (check webawesome.com)`
          : ''),
      'Themes'
    );

    // Palettes
    p.note(
      `${pc.cyan('Free:')}\n` +
        `  - default\n` +
        (tier === 'pro'
          ? `\n${pc.cyan('Pro:')}\n  - Additional palettes available (check webawesome.com)`
          : ''),
      'Color Palettes'
    );

    // Brand Colors
    p.note(
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
        `  - gray`,
      'Brand Colors'
    );

    p.outro(`Run ${pc.cyan('kigumi theme set <name>')} to switch themes`);
  });

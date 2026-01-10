import { Command } from 'commander';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { loadConfig } from '../../utils/config.js';

export const showCommand = new Command('show')
  .description('Show current theme configuration')
  .action(async () => {
    const cwd = process.cwd();
    const config = await loadConfig(cwd);

    if (!config) {
      p.log.error('No kigumi-components.json found. Run "kigumi init" first.');
      process.exit(1);
    }

    const { detectTier } = await import('../../utils/tier.js');
    const tier = await detectTier(cwd);

    p.intro(pc.bgCyan(pc.black(' Current Theme Configuration ')));

    p.note(
      `Theme: ${pc.cyan(config.theme.selected)}\n` +
        `Palette: ${pc.cyan(config.theme.palette)}\n` +
        `Brand Color: ${pc.cyan(config.theme.brandColor)}\n` +
        `Tier: ${pc.cyan(tier)}`,
      'Settings'
    );

    p.note(
      `wa-theme-${config.theme.selected}\n` +
        `wa-palette-${config.theme.palette}\n` +
        `wa-brand-${config.theme.brandColor}`,
      'HTML Classes'
    );

    const packageName =
      tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';

    if (config.theme.selected !== 'none') {
      p.note(
        `${packageName}/dist/styles/themes/${config.theme.selected}.css`,
        'Theme Import'
      );
    }

    p.outro(`Run ${pc.cyan('kigumi theme set <name>')} to change theme`);
  });

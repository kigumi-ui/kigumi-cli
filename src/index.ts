#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { statusCommand } from './commands/status.js';
import { themeCommand } from './commands/theme.js';
import { brandCommand } from './commands/brand.js';
import { paletteCommand } from './commands/palette.js';

const program = new Command();

program
  .name('kigumi')
  .description('CLI tool to add Web Awesome components to your project')
  .version('0.2.0');

program
  .command('init')
  .description('Initialize kigumi in your project')
  .option(
    '--framework <framework>',
    'Framework (only react supported currently)'
  )
  .option('--typescript', 'Use TypeScript')
  .option('--no-typescript', 'Use JavaScript')
  .option('--tier <tier>', 'Web Awesome tier (free|pro)')
  .option('--theme <theme>', 'Theme name')
  .option('--palette <palette>', 'Color palette')
  .option('--brand <color>', 'Brand color')
  .option('--token <token>', 'Pro tier authentication token')
  .option('--components-dir <dir>', 'Components directory')
  .option('--utils-dir <dir>', 'Utils directory')
  .option('--styles-dir <dir>', 'Styles directory (for theme.css)')
  .option('-y, --yes', 'Skip all prompts (non-interactive mode)')
  .option('--no-install', 'Skip dependency installation')
  .action(initCommand);

program
  .command('add')
  .description('Add a component to your project')
  .argument('[components...]', 'Components to add')
  .option('--all', 'Add all available components')
  .option('--overwrite', 'Overwrite existing components')
  .option('--no-types', 'Skip TypeScript type definitions')
  .option('-y, --yes', 'Skip all prompts (non-interactive mode)')
  .action(addCommand);

program
  .command('list')
  .description('List all available components')
  .action(listCommand);

program
  .command('status')
  .description('Show project status (tier, theme, components, token)')
  .action(statusCommand);

// Theme management commands
program.addCommand(themeCommand);
program.addCommand(brandCommand);
program.addCommand(paletteCommand);

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error(pc.red('\n✗ Unexpected error:'), error.message);
  if (process.env.DEBUG) {
    console.error(pc.gray(error.stack || ''));
  }
  console.error(
    pc.dim(
      '\nIf this persists, please report at: https://github.com/kigumi/cli/issues'
    )
  );
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(pc.red('\n✗ Unhandled promise rejection:'), message);
  if (process.env.DEBUG && reason instanceof Error) {
    console.error(pc.gray(reason.stack || ''));
  }
  process.exit(1);
});

program.parse();

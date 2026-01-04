#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { themeCommand } from './commands/theme.js';
import { brandCommand } from './commands/brand.js';
import { paletteCommand } from './commands/palette.js';

const program = new Command();

program
  .name('kigumi')
  .description('CLI tool to add Web Awesome components to your project')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize kigumi in your project')
  .action(initCommand);

program
  .command('add')
  .description('Add a component to your project')
  .argument('[components...]', 'Components to add')
  .option('--all', 'Add all available components')
  .option('--overwrite', 'Overwrite existing components')
  .option('--no-types', 'Skip TypeScript type definitions')
  .action(addCommand);

program
  .command('list')
  .description('List all available components')
  .action(listCommand);

// Theme management commands
program.addCommand(themeCommand);
program.addCommand(brandCommand);
program.addCommand(paletteCommand);

program.parse();

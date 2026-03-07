#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { statusCommand } from './commands/status.js';
import { themeCommand } from './commands/theme.js';
import { brandCommand } from './commands/brand.js';
import { paletteCommand } from './commands/palette.js';
import { doctorCommand } from './commands/doctor.js';
import { registryCommand } from './commands/registry.js';
import { upgradeCommand } from './commands/upgrade.js';
import { diffCommand } from './commands/diff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('kigumi')
  .description('CLI tool to add Web Awesome components to your project')
  .version(packageJson.version);

program
  .command('init')
  .description('Initialize kigumi in your project')
  .option('--framework <framework>', 'Framework (react, vue)')
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
  .option('--from <source>', 'Registry URL or connected registry name')
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

// Community registry commands
program.addCommand(registryCommand);

// Diagnostic command
program
  .command('doctor')
  .description('Diagnose and fix common issues in your project')
  .option('--dry-run', 'Only report issues without fixing them')
  .action(doctorCommand);

// Version management commands
program
  .command('upgrade')
  .description('Show upgrade guide and update project version')
  .option('--dry-run', 'Show changes without updating')
  .option('-y, --yes', 'Skip prompts')
  .action(upgradeCommand);

program
  .command('diff')
  .description('Compare installed components against current templates')
  .argument('[components...]', 'Specific components to diff')
  .option('--verbose', 'Show line-by-line differences')
  .action(diffCommand);

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

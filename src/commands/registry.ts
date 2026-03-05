/**
 * Registry Command Group
 *
 * Manages community component and theme registries.
 */

import { Command } from 'commander';
import { registryInitAction } from './registry/init.js';
import { registryValidateAction } from './registry/validate.js';
import { registryConnectAction } from './registry/add-source.js';
import { registryListSourcesAction } from './registry/list-sources.js';
import { registryRemoveSourceAction } from './registry/remove-source.js';
import { registryAddComponentAction } from './registry/add-component.js';
import { registryAddThemeAction } from './registry/add-theme.js';

export const registryCommand = new Command('registry').description(
  'Manage community component registries'
);

registryCommand
  .command('init')
  .description('Scaffold a new community registry')
  .option('--name <name>', 'Registry name')
  .option('-y, --yes', 'Skip prompts (non-interactive mode)')
  .action((options) => registryInitAction(options));

registryCommand
  .command('validate')
  .description('Validate registry structure and metadata')
  .action((options) => registryValidateAction(options));

registryCommand
  .command('connect')
  .description('Connect a community registry to your project')
  .argument('<url>', 'GitHub URL of the registry')
  .action((url, options) => registryConnectAction(url, options));

registryCommand
  .command('list')
  .description('List configured community registries')
  .action((options) => registryListSourcesAction(options));

registryCommand
  .command('remove')
  .description('Remove a community registry from your project')
  .argument('<url>', 'Registry URL or name to remove')
  .action((url, options) => registryRemoveSourceAction(url, options));

registryCommand
  .command('add-component')
  .description('Add a component entry to registry.json')
  .option('--slug <slug>', 'Component slug (kebab-case)')
  .option('--name <name>', 'Component display name')
  .option('--component <path>', 'Main component file path')
  .option('--css <path>', 'CSS file path')
  .action((options) => registryAddComponentAction(options));

registryCommand
  .command('add-theme')
  .description('Add a theme entry to registry.json')
  .option('--slug <slug>', 'Theme slug (kebab-case)')
  .option('--name <name>', 'Theme display name')
  .option('--css <path>', 'CSS file path')
  .action((options) => registryAddThemeAction(options));

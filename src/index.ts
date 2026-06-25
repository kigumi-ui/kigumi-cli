import { Command } from 'commander';
import pc from 'picocolors';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GITHUB_ISSUES_URL } from './constants.js';
import {
  checkForUpdate,
  formatUpdateNotification,
} from './utils/update-check.js';
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
import { updateCommand } from './commands/update.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

// Fire update check early so it resolves by the time the command finishes
const updateCheckPromise = checkForUpdate();

program
  .name('kigumi')
  .description('CLI tool to add Web Awesome components to your project')
  .version(packageJson.version)
  .option('--verbose', 'Show debug output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    if (opts.verbose) {
      process.env.DEBUG = '1';
    }
    // Start timing
    (thisCommand as unknown as Record<string, number>).__startTime =
      performance.now();
  })
  .hook('postAction', async (thisCommand) => {
    const start = (thisCommand as unknown as Record<string, number>)
      .__startTime;
    if (start && process.env.DEBUG) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(1);
      // Uses console.error directly because getOutput() is not available in Commander hooks
      console.error(pc.dim(`Done in ${elapsed}s`));
    }

    // Show update notification if a newer version is available
    const updateResult = await updateCheckPromise;
    if (updateResult) {
      console.error(pc.yellow(formatUpdateNotification(updateResult)));
    }
  });

program
  .command('init')
  .description('Initialize kigumi in your project')
  .option(
    '--framework <framework>',
    'Framework (react, vue, or angular; Next.js is auto-detected and uses react)'
  )
  .option('--typescript', 'Use TypeScript')
  .option('--no-typescript', 'Use JavaScript')
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
  .option('--force', 'Overwrite existing components without prompting')
  .option('--from <source>', 'Registry URL or connected registry name')
  .option(
    '--cross-framework',
    'Allow installing from a registry that does not target your framework. ' +
      'Source-framework files are staged into .kigumi/foreign/ for an ' +
      'agent-driven conversion via the kigumi-cross-framework skill.'
  )
  .option('--no-types', 'Skip TypeScript type definitions')
  .option('-y, --yes', 'Skip all prompts (non-interactive mode)')
  .action(addCommand);

program
  .command('list')
  .description('List all available components')
  .option('--json', 'Output as JSON')
  .action(listCommand);

program
  .command('status')
  .description('Show project status (tier, theme, components, token)')
  .option('--json', 'Output as JSON')
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
  .description('Upgrade project version and install updated dependencies')
  .option('--dry-run', 'Show changes without updating')
  .option('-y, --yes', 'Skip prompts')
  .option('--no-install', 'Skip dependency installation')
  .action(upgradeCommand);

program
  .command('diff')
  .description('Compare installed components against current templates')
  .argument('[components...]', 'Specific components to diff')
  .action(diffCommand);

program
  .command('update')
  .description('Update installed components with three-way merge')
  .argument('[components...]', 'Specific components to update')
  .option('--dry-run', 'Show what would change without writing')
  .option('--force', 'Overwrite without merge')
  .option('-y, --yes', 'Auto-confirm prompts')
  .action(updateCommand);

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error(pc.red('\n✗ Unexpected error:'), error.message);
  if (process.env.DEBUG) {
    console.error(pc.gray(error.stack || ''));
  }
  console.error(
    pc.dim(`\nIf this persists, please report at: ${GITHUB_ISSUES_URL}`)
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

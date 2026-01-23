/**
 * Init Command - Main Orchestrator
 *
 * Initializes kigumi in a project with framework detection,
 * interactive configuration, and dependency installation.
 */

import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { CheckRunner, PackageJsonExistsCheck } from '../../checks/index.js';
import { handleError } from '../../errors/index.js';
import { validators, type InitOptions } from '../../schemas/index.js';
import { handleExistingConfig } from './existing-config.js';
import {
  buildConfigInteractive,
  buildConfigNonInteractive,
} from './config-builder.js';
import { installDependencies, cleanupOldPackage } from './installer.js';
import { generateProjectFiles } from './file-generator.js';
import { getProjectInfo } from '../../utils/detect-framework.js';
import { saveConfig, loadConfig } from '../../utils/config.js';
import { detectTier, type Tier } from '../../utils/tier.js';
import {
  migratePackageReferences,
  reverseMigratePackageReferences,
} from './migration.js';

/**
 * Detect previous tier from installed packages (not from .env)
 * This allows us to detect Pro→Free downgrades even when token was removed
 */
async function detectPreviousTier(cwd: string): Promise<Tier> {
  const packageJsonPath = path.join(cwd, 'package.json');

  try {
    if (!(await fs.pathExists(packageJsonPath))) {
      return 'free';
    }

    const packageJson = await fs.readJSON(packageJsonPath);

    // If Pro package is installed, previous tier was Pro
    if (packageJson.dependencies?.['@awesome.me/webawesome-pro']) {
      return 'pro';
    }

    return 'free';
  } catch {
    return 'free';
  }
}

/**
 * Check for duplicate packages and warn user
 * Both free and pro packages should not be installed simultaneously
 */
async function checkDuplicatePackages(
  cwd: string,
  output: import('../../output/types.js').OutputInterface
): Promise<void> {
  const packageJsonPath = path.join(cwd, 'package.json');

  try {
    if (!(await fs.pathExists(packageJsonPath))) {
      return;
    }

    const packageJson = await fs.readJSON(packageJsonPath);
    const hasFree = !!packageJson.dependencies?.['@awesome.me/webawesome'];
    const hasPro = !!packageJson.dependencies?.['@awesome.me/webawesome-pro'];

    if (hasFree && hasPro) {
      output.warning(
        'Both webawesome and webawesome-pro are installed.\n' +
          'webawesome-pro includes all Free features.\n' +
          'Consider removing @awesome.me/webawesome to reduce bundle size:\n' +
          '  npm uninstall @awesome.me/webawesome'
      );
    }
  } catch {
    // Ignore errors - this is just a helpful warning
  }
}

/**
 * Init command
 *
 * @param options - Command options
 */
export async function initCommand(options: InitOptions = {}) {
  const output = getOutput();
  output.intro('kigumi init');

  const cwd = options.cwd || process.cwd();

  try {
    // 1. Validate options
    const validatedOptions = validators.init(options);

    // 2. Pre-flight checks
    const checker = new CheckRunner().add(new PackageJsonExistsCheck());

    const checkResults = await checker.run({ cwd });
    if (checker.hasErrors(checkResults)) {
      output.error('Pre-flight checks failed');
      output.note('Issues found', checker.formatResults(checkResults));
      process.exit(1);
    }

    // 3. Detect project info
    const projectInfo = await getProjectInfo(cwd);

    // 4. Determine if running in non-interactive mode
    // --yes flag OR providing both framework and theme triggers non-interactive
    const isNonInteractive =
      validatedOptions.yes ||
      (validatedOptions.framework && validatedOptions.theme);

    // 5. Check for existing config
    const existingConfig = loadConfig(cwd);
    const existingAction = await handleExistingConfig(
      cwd,
      output,
      Boolean(isNonInteractive)
    );
    if (existingAction === 'cancel') {
      output.outro('Cancelled');
      process.exit(0);
    }

    // 6. Detect previous tier from installed packages (not .env)
    // This allows detecting Pro→Free downgrades even when token was removed
    const previousTier = existingConfig
      ? await detectPreviousTier(cwd)
      : 'free';

    // 7. Build configuration (interactive or non-interactive)
    const { config, proToken } = isNonInteractive
      ? await buildConfigNonInteractive(
          validatedOptions,
          projectInfo,
          cwd,
          output
        )
      : await buildConfigInteractive(
          validatedOptions,
          projectInfo,
          cwd,
          output
        );

    // 8. Detect NEW tier from current .env state (token determines tier)
    // proToken from config builder means token was just added via --token flag
    // detectTier() checks actual .env file
    const newTier = proToken ? 'pro' : await detectTier(cwd);

    // 9. Check for tier migration
    let didMigrate = false;

    // 9a. Check for Free → Pro migration
    if (existingConfig && previousTier === 'free' && newTier === 'pro') {
      output.info('Pro token detected - migration available');

      // Non-interactive mode: auto-migrate
      // Interactive mode: ask user
      let shouldMigrate = Boolean(isNonInteractive);

      if (!isNonInteractive) {
        const confirmResult = await p.confirm({
          message: 'Migrate existing components from Free to Pro package?',
          initialValue: true,
        });

        shouldMigrate = p.isCancel(confirmResult)
          ? false
          : Boolean(confirmResult);
      }

      if (shouldMigrate) {
        await migratePackageReferences(cwd, output);
        didMigrate = true;
      }
    }

    // 9b. Check for Pro → Free downgrade (Bug #2 fix)
    if (existingConfig && previousTier === 'pro' && newTier === 'free') {
      output.info('Downgrading from Pro to Free tier');

      // Non-interactive mode: auto-migrate
      // Interactive mode: ask user
      let shouldMigrate = Boolean(isNonInteractive);

      if (!isNonInteractive) {
        const confirmResult = await p.confirm({
          message: 'Migrate existing components from Pro to Free package?',
          initialValue: true,
        });

        shouldMigrate = p.isCancel(confirmResult)
          ? false
          : Boolean(confirmResult);
      }

      if (shouldMigrate) {
        await reverseMigratePackageReferences(cwd, output);
        didMigrate = true;
      }
    }

    // 10. Save configuration
    await saveConfig(config, cwd);
    output.success('Configuration saved');

    // 11. Generate project files
    await generateProjectFiles({
      cwd,
      config,
      tier: newTier,
      proToken,
      output,
    });

    // 12. Ask about installation (non-interactive always installs)
    let shouldInstall = true;

    if (!isNonInteractive) {
      shouldInstall = (await p.confirm({
        message: 'Install dependencies now?',
        initialValue: true,
      })) as boolean;

      if (p.isCancel(shouldInstall)) {
        shouldInstall = false;
      }
    }

    // 13. Install dependencies
    if (shouldInstall) {
      await installDependencies({
        cwd,
        config,
        tier: newTier,
        packageManager: projectInfo.packageManager,
        output,
      });

      // 13a. Clean up old package after migration (Bug #3 fix)
      if (didMigrate) {
        const oldPackage =
          newTier === 'pro'
            ? '@awesome.me/webawesome'
            : '@awesome.me/webawesome-pro';
        await cleanupOldPackage(
          cwd,
          oldPackage,
          projectInfo.packageManager,
          output
        );
      }

      // 13b. Check for duplicate packages and warn
      await checkDuplicatePackages(cwd, output);
    }

    // 14. Success - Show post-install instructions
    output.outro('✓ Kigumi initialized successfully!');

    showPostInstallInstructions(
      output,
      config,
      projectInfo.packageManager,
      shouldInstall
    );
  } catch (error) {
    handleError(error, output);
  }
}

/**
 * Show post-install instructions with manual steps
 */
function showPostInstallInstructions(
  output: import('../../output/types.js').OutputInterface,
  config: import('../../schemas/index.js').KigumiConfig,
  packageManager: string,
  depsInstalled: boolean
): void {
  console.log('\n' + pc.bold(pc.cyan('📝 Next Steps:\n')));

  if (config.typescript && config.framework === 'react') {
    console.log(pc.cyan('1. Add components:\n'));
    console.log(pc.dim('   npx kigumi add button card dialog\n'));

    console.log(pc.cyan('2. Start development:\n'));
    console.log(pc.dim(`   ${packageManager} run dev\n`));
  } else {
    // Non-TypeScript or non-React
    if (!depsInstalled) {
      console.log(pc.cyan('1. Install dependencies:\n'));
      console.log(pc.dim(`   ${packageManager} install\n`));

      console.log(pc.cyan('2. Add components:\n'));
      console.log(pc.dim('   npx kigumi add button card dialog\n'));

      console.log(pc.cyan('3. Add webawesome import:\n'));
      console.log(pc.dim('   import "@/lib/webawesome";\n'));

      console.log(pc.cyan('4. Start development:\n'));
      console.log(pc.dim(`   ${packageManager} run dev\n`));
    } else {
      console.log(pc.cyan('1. Add components:\n'));
      console.log(pc.dim('   npx kigumi add button card dialog\n'));

      console.log(pc.cyan('2. Start development:\n'));
      console.log(pc.dim(`   ${packageManager} run dev\n`));
    }
  }

  console.log(pc.dim('📖 Full setup guide: ./KIGUMI_SETUP.md\n'));
}

/**
 * Init Command - Main Orchestrator
 *
 * PURPOSE: Initializes kigumi in a project with framework detection,
 * interactive configuration, and dependency installation.
 *
 * This is the main entry point for `kigumi init`. It orchestrates:
 * 1. Pre-flight checks
 * 2. Configuration building (interactive or non-interactive)
 * 3. Tier migration (Free ↔ Pro)
 * 4. File generation
 * 5. Dependency installation
 *
 * @see AGENTS.md for tier migration architecture
 */

import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../constants.js';
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
import { PreFlightCheckError, UserCancelledError } from '../../errors/index.js';
import {
  getThemeLabel,
  getPaletteLabel,
  getBrandColorLabel,
} from '../../utils/display-options.js';

/**
 * Detect previous tier from installed packages (not from .env)
 *
 * WHY: This allows detecting Pro→Free downgrades even when token was removed.
 * If we checked .env, downgrades would be impossible because the token would
 * already be gone. We need package.json as source of truth for "what WAS installed".
 *
 * @see AGENTS.md Rule #12 for tier migration architecture
 * @internal
 */
async function detectPreviousTier(cwd: string): Promise<Tier> {
  const packageJsonPath = path.join(cwd, 'package.json');

  try {
    if (!(await fs.pathExists(packageJsonPath))) {
      return 'free';
    }

    const packageJson = await fs.readJSON(packageJsonPath);

    // If Pro package is installed, previous tier was Pro
    if (packageJson.dependencies?.[WEB_AWESOME_PRO_PACKAGE]) {
      return 'pro';
    }

    return 'free';
  } catch {
    return 'free';
  }
}

/**
 * Check for duplicate packages and warn user
 *
 * WHY: Both free and pro packages should not be installed simultaneously.
 * This wastes bundle size since Pro includes all Free features.
 *
 * @internal
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
    const hasFree = !!packageJson.dependencies?.[WEB_AWESOME_FREE_PACKAGE];
    const hasPro = !!packageJson.dependencies?.[WEB_AWESOME_PRO_PACKAGE];

    if (hasFree && hasPro) {
      output.warning(
        'Both webawesome and webawesome-pro are installed.\n' +
          'webawesome-pro includes all Free features.\n' +
          `Consider removing ${WEB_AWESOME_FREE_PACKAGE} to reduce bundle size:\n` +
          `  npm uninstall ${WEB_AWESOME_FREE_PACKAGE}`
      );
    }
  } catch {
    // Ignore errors - this is just a helpful warning
  }
}

// =============================================================================
// Helper Types for Internal State
// =============================================================================

/** Internal context passed between init phases */
interface InitContext {
  cwd: string;
  output: import('../../output/types.js').OutputInterface;
  isNonInteractive: boolean;
  existingConfig: import('../../schemas/index.js').KigumiConfig | null;
  projectInfo: Awaited<ReturnType<typeof getProjectInfo>>;
  previousTier: Tier;
}

/** Result from configuration phase */
interface ConfigResult {
  config: import('../../schemas/index.js').KigumiConfig;
  proToken: string | undefined;
  newTier: Tier;
}

/** Result from migration phase */
interface MigrationResult {
  didMigrate: boolean;
}

// =============================================================================
// Init Command - Entry Point
// =============================================================================

/**
 * Init command
 *
 * Main entry point that orchestrates all initialization phases.
 * Each phase is delegated to a focused helper function.
 *
 * @param options - Command options
 * @public
 */
export async function initCommand(options: InitOptions = {}) {
  const output = getOutput();
  output.intro('kigumi init');

  const cwd = options.cwd || process.cwd();

  try {
    // Phase 1: Validate and prepare
    const context = await validateAndPrepare(options, cwd, output);

    // Phase 2: Build configuration
    const configResult = await buildConfiguration(context, options);

    // Phase 3: Handle tier migration
    const migrationResult = await handleTierMigration(context, configResult);

    // Phase 4: Save config and generate files
    await saveAndGenerate(context, configResult);

    // Phase 5: Handle dependencies
    await handleDependencies(context, configResult, migrationResult);

    // Phase 6: Show success
    output.outro('✓ Kigumi initialized successfully!');
    showPostInstallInstructions(
      output,
      configResult.config,
      context.projectInfo.packageManager,
      true // Always true if we reach here without errors
    );
  } catch (error) {
    handleError(error, output);
  }
}

// =============================================================================
// Phase 1: Validate and Prepare
// =============================================================================

/**
 * Validate options, run pre-flight checks, detect project info
 *
 * @internal
 */
async function validateAndPrepare(
  options: InitOptions,
  cwd: string,
  output: import('../../output/types.js').OutputInterface
): Promise<InitContext> {
  // 1. Validate options
  const validatedOptions = validators.init(options);

  // 2. Pre-flight checks
  const checker = new CheckRunner().add(new PackageJsonExistsCheck());
  const checkResults = await checker.run({ cwd });
  if (checker.hasErrors(checkResults)) {
    throw new PreFlightCheckError(checkResults);
  }

  // 3. Detect project info
  const projectInfo = await getProjectInfo(cwd);

  // 4. Determine if running in non-interactive mode
  const isNonInteractive = Boolean(
    validatedOptions.yes ||
    (validatedOptions.framework && validatedOptions.theme)
  );

  // 5. Check for existing config
  const existingConfig = loadConfig(cwd);
  const existingAction = await handleExistingConfig(
    cwd,
    output,
    isNonInteractive
  );
  if (existingAction === 'cancel') {
    throw new UserCancelledError('Configuration cancelled by user');
  }

  // 6. Detect previous tier from installed packages
  const previousTier = existingConfig ? await detectPreviousTier(cwd) : 'free';

  return {
    cwd,
    output,
    isNonInteractive,
    existingConfig,
    projectInfo,
    previousTier,
  };
}

// =============================================================================
// Phase 2: Build Configuration
// =============================================================================

/**
 * Build configuration (interactive or non-interactive)
 *
 * @internal
 */
async function buildConfiguration(
  context: InitContext,
  options: InitOptions
): Promise<ConfigResult> {
  const { cwd, output, isNonInteractive, projectInfo } = context;
  const validatedOptions = validators.init(options);

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
        output,
        context.existingConfig
      );

  // Detect NEW tier from current .env state
  const newTier = proToken ? 'pro' : await detectTier(cwd);

  return { config, proToken, newTier };
}

// =============================================================================
// Phase 3: Handle Tier Migration
// =============================================================================

/**
 * Handle Free ↔ Pro tier migrations
 *
 * @internal
 */
async function handleTierMigration(
  context: InitContext,
  configResult: ConfigResult
): Promise<MigrationResult> {
  const { cwd, output, isNonInteractive, existingConfig, previousTier } =
    context;
  const { newTier } = configResult;

  let didMigrate = false;

  // Free → Pro migration
  if (existingConfig && previousTier === 'free' && newTier === 'pro') {
    output.info('Pro token detected - migration available');
    const shouldMigrate = await confirmMigration(
      'Migrate existing components from Free to Pro package?',
      isNonInteractive
    );
    if (shouldMigrate) {
      await migratePackageReferences(cwd, output);
      didMigrate = true;
    }
  }

  // Pro → Free downgrade
  if (existingConfig && previousTier === 'pro' && newTier === 'free') {
    output.info('Downgrading from Pro to Free tier');
    const shouldMigrate = await confirmMigration(
      'Migrate existing components from Pro to Free package?',
      isNonInteractive
    );
    if (shouldMigrate) {
      await reverseMigratePackageReferences(cwd, output);
      didMigrate = true;
    }
  }

  return { didMigrate };
}

/**
 * Ask for migration confirmation (or auto-confirm in non-interactive mode)
 *
 * @internal
 */
async function confirmMigration(
  message: string,
  isNonInteractive: boolean
): Promise<boolean> {
  if (isNonInteractive) {
    return true;
  }

  const result = await p.confirm({ message, initialValue: true });
  return p.isCancel(result) ? false : Boolean(result);
}

// =============================================================================
// Phase 4: Save and Generate
// =============================================================================

/**
 * Save configuration and generate project files
 *
 * @internal
 */
async function saveAndGenerate(
  context: InitContext,
  configResult: ConfigResult
): Promise<void> {
  const { cwd, output } = context;
  const { config, proToken, newTier } = configResult;

  await saveConfig(config, cwd);
  output.success('Configuration saved');

  await generateProjectFiles({
    cwd,
    config,
    tier: newTier,
    proToken,
    output,
  });
}

// =============================================================================
// Phase 5: Handle Dependencies
// =============================================================================

/**
 * Install dependencies and clean up old packages
 *
 * @internal
 */
async function handleDependencies(
  context: InitContext,
  configResult: ConfigResult,
  migrationResult: MigrationResult
): Promise<void> {
  const { cwd, output, isNonInteractive, projectInfo } = context;
  const { config, newTier } = configResult;
  const { didMigrate } = migrationResult;

  // Ask about installation
  const shouldInstall = await confirmInstallation(isNonInteractive);
  if (!shouldInstall) {
    return;
  }

  // Install dependencies
  await installDependencies({
    cwd,
    config,
    tier: newTier,
    packageManager: projectInfo.packageManager,
    output,
  });

  // Clean up old package after migration
  if (didMigrate) {
    const oldPackage =
      newTier === 'pro' ? WEB_AWESOME_FREE_PACKAGE : WEB_AWESOME_PRO_PACKAGE;
    await cleanupOldPackage(
      cwd,
      oldPackage,
      projectInfo.packageManager,
      output
    );
  }

  // Check for duplicate packages
  await checkDuplicatePackages(cwd, output);
}

/**
 * Ask for installation confirmation (or auto-confirm in non-interactive mode)
 *
 * @internal
 */
async function confirmInstallation(
  isNonInteractive: boolean
): Promise<boolean> {
  if (isNonInteractive) {
    return true;
  }

  const result = await p.confirm({
    message: 'Install dependencies now?',
    initialValue: true,
  });
  return p.isCancel(result) ? false : Boolean(result);
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

  let stepNum = 1;

  // Step: Install dependencies (if not installed)
  if (!depsInstalled) {
    console.log(pc.bold(pc.cyan(`${stepNum}. Install dependencies:\n`)));
    console.log(pc.dim(`\t${packageManager} install\n`));
    stepNum++;
  }

  // Step: Import webawesome setup
  console.log(
    pc.bold(
      pc.cyan(`${stepNum}. Import Web Awesome in your main entry file:\n`)
    )
  );
  console.log(pc.dim('\tAdd this import to src/main.tsx (or src/main.jsx):'));
  console.log(pc.green('\timport "@/lib/webawesome";\n'));
  stepNum++;

  // Step: Add components
  console.log(pc.bold(pc.cyan(`${stepNum}. Add UI components:\n`)));
  console.log(pc.dim('\tnpx kigumi add button card dialog input\n'));
  stepNum++;

  // Step: Start development
  console.log(pc.bold(pc.cyan(`${stepNum}. Start development server:\n`)));
  console.log(pc.dim(`\t${packageManager} run dev\n`));

  // Info box with project structure
  console.log(pc.bold(pc.cyan('ℹ️  Generated Files:\n')));
  console.log(pc.dim(`\tComponents:\t${config.componentsDir}/`));
  console.log(
    pc.dim(`\tStyles:\t\t${config.stylesDir || 'src/styles'}/theme.css`)
  );
  console.log(
    pc.dim(`\tSetup:\t\t${config.utilsDir || 'src/lib'}/webawesome.ts\n`)
  );

  // Info box with theme details (using display labels for proper capitalization)
  console.log(pc.bold(pc.cyan('🎨 Theme Configuration:\n')));
  console.log(pc.dim(`\tTheme:\t\t${getThemeLabel(config.theme.selected)}`));
  console.log(pc.dim(`\tPalette:\t${getPaletteLabel(config.theme.palette)}`));
  console.log(
    pc.dim(`\tBrand Color:\t${getBrandColorLabel(config.theme.brandColor)}`)
  );
  console.log(
    pc.dim(
      '\tEdit theme.css to customize: https://www.npmjs.com/package/kigumi#customization\n'
    )
  );

  // Additional resources
  console.log(pc.bold(pc.cyan('📚 Useful Web Awesome resources:\n')));
  console.log(
    pc.dim('\t• Components: https://webawesome.com/docs/components/')
  );
  console.log(pc.dim('\t• Design Tokens: https://webawesome.com/docs/tokens/'));
  console.log(
    pc.dim('\t• Style Utilities: https://webawesome.com/docs/utilities/')
  );
  console.log(pc.dim('\t• Layout: https://webawesome.com/docs/layout/'));
  console.log(pc.dim('\t• Themes: https://webawesome.com/docs/themes'));
  console.log(
    pc.dim('\t• Color Palettes: https://webawesome.com/docs/color-palettes\n')
  );
}

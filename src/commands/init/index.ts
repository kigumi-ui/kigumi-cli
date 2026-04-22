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
  CLI_VERSION,
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
import { toKigumiAlias } from '../../utils/project-config.js';
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
  } catch (_error) {
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
  } catch (_error) {
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
  existingAction: import('./existing-config.js').ExistingConfigAction | null;
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

    // Reinstall: skip config wizard, just reinstall deps with existing config
    if (context.existingAction === 'reinstall' && context.existingConfig) {
      const newTier = await detectTier(cwd);
      const skipInstall = options.install === false;
      await handleDependencies(
        context,
        { config: context.existingConfig, proToken: undefined, newTier },
        { didMigrate: false },
        skipInstall
      );
      output.outro('✓ Dependencies reinstalled!');
      return;
    }

    // Phase 2: Build configuration
    const configResult = await buildConfiguration(context, options);

    // Phase 3: Handle tier migration
    const migrationResult = await handleTierMigration(context, configResult);

    // Phase 4: Save config and generate files
    await saveAndGenerate(context, configResult);

    // Phase 5: Handle dependencies (skip if --no-install)
    const skipInstall = options.install === false;
    await handleDependencies(
      context,
      configResult,
      migrationResult,
      skipInstall
    );

    // Phase 6: Show success
    output.outro('✓ Kigumi initialized successfully!');
    showPostInstallInstructions(
      output,
      configResult.config,
      context.projectInfo.packageManager,
      true, // Always true if we reach here without errors
      configResult.newTier,
      context.projectInfo.isNext,
      context.projectInfo.nextRouter
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
    existingAction,
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
        output,
        context.existingConfig
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
      await migratePackageReferences(cwd, existingConfig, output);
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
      await reverseMigratePackageReferences(cwd, existingConfig, output);
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
  const { cwd, output, projectInfo } = context;
  const { config, proToken, newTier } = configResult;

  // Pin the current CLI version
  config.kigumiVersion = CLI_VERSION;

  await saveConfig(config, cwd);
  output.success('Configuration saved');

  await generateProjectFiles({
    cwd,
    config,
    tier: newTier,
    proToken,
    output,
    projectInfo,
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
  migrationResult: MigrationResult,
  skipInstall = false
): Promise<void> {
  const { cwd, output, isNonInteractive, projectInfo } = context;
  const { config, newTier } = configResult;
  const { didMigrate } = migrationResult;

  // Skip installation if --no-install flag was passed
  if (skipInstall) {
    output.info('Skipping dependency installation (--no-install)');
    return;
  }

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
  depsInstalled: boolean,
  tier: Tier,
  isNext: boolean = false,
  nextRouter?: import('../../utils/detect-framework.js').NextRouter
): void {
  output.info('\n' + pc.bold(pc.cyan('📝 Next Steps:\n')));

  let stepNum = 1;

  // Step: Configure Pro token globally (if Pro tier and token not already global)
  // Only show this if user might need to set up global token for npm install
  if (tier === 'pro' && !depsInstalled) {
    output.info(
      pc.bold(pc.cyan(`${stepNum}. Ensure Pro token is configured globally:\n`))
    );
    output.info(pc.dim('\tFor npm install to work, run once per machine:\n'));
    output.info(
      pc.green(
        '\tnpm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken YOUR_TOKEN\n'
      )
    );
    output.info(pc.dim('\tGet token: https://webawesome.com/login\n'));
    stepNum++;
  }

  // Step: Install dependencies (if not installed)
  if (!depsInstalled) {
    output.info(pc.bold(pc.cyan(`${stepNum}. Install dependencies:\n`)));
    output.info(pc.dim(`\t${packageManager} install\n`));
    stepNum++;
  }

  // Step: Wire up Kigumi — Next App Router uses a Client Module provider;
  // Pages Router users edit `_app.tsx` directly; Vite projects import from
  // main.ts(x). The provider was generated in the file-generator step for
  // App Router only; Pages Router users wire the import themselves.
  if (isNext && nextRouter === 'pages') {
    // Derive `@/` aliases from the user's configured directories so the
    // emitted import specifiers match whatever kigumi.config.json says,
    // not a hardcoded assumption about default `src/styles` / `src/lib`.
    const stylesAlias = toKigumiAlias(config.stylesDir || 'src/styles');
    const utilsAlias = toKigumiAlias(config.utilsDir || 'src/lib');

    output.info(
      pc.bold(
        pc.cyan(`${stepNum}. Wire Kigumi into your Pages Router entry:\n`)
      )
    );
    output.info(pc.dim('\tEdit pages/_app.tsx:'));
    output.info(pc.green(`\timport '${stylesAlias}/layers.css';`));
    output.info(pc.green(`\timport '${stylesAlias}/theme.css';`));
    output.info(pc.green(`\timport '${utilsAlias}/kigumi';`));
    output.info(pc.green("\timport type { AppProps } from 'next/app';\n"));
    output.info(
      pc.green(
        '\texport default function App({ Component, pageProps }: AppProps) {'
      )
    );
    output.info(pc.green('\t  return <Component {...pageProps} />;'));
    output.info(pc.green('\t}\n'));
    output.info(
      pc.dim(
        "\tNext's Pages Router only accepts global CSS imports from _app.tsx,\n" +
          '\tso layers.css and theme.css must be imported here directly (not\n' +
          `\ttransitively via ${utilsAlias}/kigumi). ${utilsAlias}/kigumi then registers the\n` +
          '\tWeb Awesome components and applies your theme classes.\n'
      )
    );
    stepNum++;
  } else if (isNext) {
    // App Router (or 'unknown' layout → App Router default)
    output.info(
      pc.bold(
        pc.cyan(`${stepNum}. Wrap your root layout with KigumiProvider:\n`)
      )
    );
    output.info(pc.dim('\tEdit app/layout.tsx:'));
    output.info(
      pc.green("\timport { KigumiProvider } from '@/app/providers';")
    );
    output.info(
      pc.green(
        '\n\texport default function RootLayout({ children }: { children: React.ReactNode }) {'
      )
    );
    output.info(pc.green('\t  return ('));
    output.info(pc.green('\t    <html>'));
    output.info(
      pc.green(
        '\t      <body><KigumiProvider>{children}</KigumiProvider></body>'
      )
    );
    output.info(pc.green('\t    </html>'));
    output.info(pc.green('\t  );'));
    output.info(pc.green('\t}\n'));
    stepNum++;
  } else {
    output.info(
      pc.bold(pc.cyan(`${stepNum}. Import Kigumi in your main entry file:\n`))
    );
    const mainFile =
      config.framework === 'vue'
        ? 'src/main.ts'
        : 'src/main.tsx (or src/main.jsx)';
    output.info(pc.dim(`\tAdd this import to ${mainFile}:`));
    output.info(pc.green('\timport "@/lib/kigumi";\n'));
    stepNum++;
  }

  // Vue-specific: remove conflicting default styles
  if (config.framework === 'vue') {
    output.info(
      pc.bold(
        pc.cyan(`${stepNum}. Remove default styles (if using create-vue):\n`)
      )
    );
    output.info(
      pc.dim(
        '\tDelete or empty src/style.css to avoid conflicts with Web Awesome tokens.\n'
      )
    );
    stepNum++;
  }

  // Step: Add components
  output.info(pc.bold(pc.cyan(`${stepNum}. Add UI components:\n`)));
  output.info(pc.dim('\tnpx kigumi add button card dialog input\n'));
  stepNum++;

  // Step: Start development
  output.info(pc.bold(pc.cyan(`${stepNum}. Start development server:\n`)));
  output.info(pc.dim(`\t${packageManager} run dev\n`));

  // Info box with project structure
  output.log(pc.bold(pc.cyan('ℹ️  Generated Files:\n')));
  output.log(pc.dim(`\tComponents:\t${config.componentsDir}/`));
  output.log(
    pc.dim(`\tStyles:\t\t${config.stylesDir || 'src/styles'}/theme.css`)
  );
  output.log(pc.dim(`\tSetup:\t\t${config.utilsDir || 'src/lib'}/kigumi.ts\n`));

  // Info box with theme details (using display labels for proper capitalization)
  output.log(pc.bold(pc.cyan('🎨 Theme Configuration:\n')));
  output.log(pc.dim(`\tTheme:\t\t${getThemeLabel(config.theme.selected)}`));
  output.log(pc.dim(`\tPalette:\t${getPaletteLabel(config.theme.palette)}`));
  output.log(
    pc.dim(`\tBrand Color:\t${getBrandColorLabel(config.theme.brandColor)}`)
  );
  output.log(
    pc.dim(
      '\tEdit theme.css to customize: https://www.npmjs.com/package/kigumi#customization\n'
    )
  );

  // Additional resources
  output.log(pc.bold(pc.cyan('📚 Useful Web Awesome resources:\n')));
  output.log(pc.dim('\t• Components: https://webawesome.com/docs/components/'));
  output.log(pc.dim('\t• Design Tokens: https://webawesome.com/docs/tokens/'));
  output.log(
    pc.dim('\t• Style Utilities: https://webawesome.com/docs/utilities/')
  );
  output.log(pc.dim('\t• Layout: https://webawesome.com/docs/layout/'));
  output.log(pc.dim('\t• Themes: https://webawesome.com/docs/themes'));
  output.log(
    pc.dim('\t• Color Palettes: https://webawesome.com/docs/color-palettes\n')
  );
}

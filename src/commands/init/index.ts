/**
 * Init Command - Main Orchestrator
 *
 * Initializes kigumi in a project with framework detection,
 * interactive configuration, and dependency installation.
 */

import * as p from '@clack/prompts';
import { getOutput } from '../../output/index.js';
import { CheckRunner, PackageJsonExistsCheck } from '../../checks/index.js';
import { handleError } from '../../errors/index.js';
import { validators, type InitOptions } from '../../schemas/index.js';
import { handleExistingConfig } from './existing-config.js';
import { buildConfigInteractive, buildConfigNonInteractive } from './config-builder.js';
import { installDependencies } from './installer.js';
import { generateProjectFiles } from './file-generator.js';
import { getProjectInfo } from '../../utils/detect-framework.js';
import { saveConfig, loadConfig } from '../../utils/config.js';
import { detectTier } from '../../utils/tier.js';
import { migratePackageReferences } from './migration.js';

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
    const checker = new CheckRunner()
      .add(new PackageJsonExistsCheck());

    const checkResults = await checker.run({ cwd });
    if (checker.hasErrors(checkResults)) {
      output.error('Pre-flight checks failed');
      output.note('Issues found', checker.formatResults(checkResults));
      process.exit(1);
    }

    // 3. Detect project info
    const projectInfo = await getProjectInfo(cwd);

    // 4. Determine if running in non-interactive mode
    const isNonInteractive =
      validatedOptions.framework &&
      validatedOptions.theme;

    // 5. Check for existing config
    const existingConfig = loadConfig(cwd);
    const existingAction = await handleExistingConfig(cwd, output, isNonInteractive);
    if (existingAction === 'cancel') {
      output.outro('Cancelled');
      process.exit(0);
    }

    // 6. Detect tier BEFORE building config (from .env)
    const previousTier = existingConfig ? await detectTier(cwd) : 'free';
    
    // 7. Build configuration (interactive or non-interactive)
    const { config, proToken } = isNonInteractive
      ? await buildConfigNonInteractive(validatedOptions, projectInfo, cwd, output)
      : await buildConfigInteractive(validatedOptions, projectInfo, cwd, output);

    // 8. Detect NEW tier (after potential token was added)
    const newTier = proToken ? 'pro' : await detectTier(cwd);

    // 9. Check for Free → Pro migration
    if (existingConfig && previousTier === 'free' && newTier === 'pro') {
      output.info('Pro token detected - migration available');
      
      // Non-interactive mode: auto-migrate
      // Interactive mode: ask user
      let shouldMigrate = isNonInteractive;
      
      if (!isNonInteractive) {
        shouldMigrate = (await p.confirm({
          message: 'Migrate existing components from Free to Pro package?',
          initialValue: true,
        })) as boolean;

        if (p.isCancel(shouldMigrate)) {
          shouldMigrate = false;
        }
      }

      if (shouldMigrate) {
        await migratePackageReferences(cwd, output);
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
    }

    // 14. Success
    output.outro('✓ Initialization complete!');
    
    if (!shouldInstall) {
      output.note(
        'Next steps',
        `1. Run: ${projectInfo.packageManager} install\n` +
        `2. Configure path aliases (see README.md)\n` +
        `3. Add import '@/lib/webawesome' to your main file\n` +
        `4. Run: kigumi add button`
      );
    } else {
      output.note(
        'Next steps',
        `1. Configure path aliases (see README.md)\n` +
        `2. Add import '@/lib/webawesome' to your main file\n` +
        `3. Run: kigumi add button`
      );
    }

  } catch (error) {
    handleError(error, output);
  }
}

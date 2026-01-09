/**
 * Init Command - Main Orchestrator
 *
 * Initializes kigumi in a project with framework detection,
 * interactive configuration, and dependency installation.
 */

import { getOutput } from '../../output/index.js';
import { CheckRunner, PackageJsonExistsCheck } from '../../checks/index.js';
import { handleError } from '../../errors/index.js';
import { validators, type InitOptions } from '../../schemas/index.js';
import { handleExistingConfig } from './existing-config.js';
import { buildConfigInteractive, buildConfigNonInteractive } from './config-builder.js';
import { installDependencies } from './installer.js';
import { generateProjectFiles } from './file-generator.js';
import { getProjectInfo } from '../../utils/detect-framework.js';
import { saveConfig } from '../../utils/config.js';

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
      validatedOptions.tier &&
      validatedOptions.theme;

    // 5. Check for existing config (skip prompt in non-interactive mode)
    const existingAction = await handleExistingConfig(cwd, output, isNonInteractive);
    if (existingAction === 'cancel') {
      output.outro('Cancelled');
      process.exit(0);
    }

    // 6. Build configuration (interactive or non-interactive)
    const config = isNonInteractive
      ? await buildConfigNonInteractive(validatedOptions, projectInfo, output)
      : await buildConfigInteractive(validatedOptions, projectInfo, output);

    // 7. Save configuration
    await saveConfig(config, cwd);
    output.success('Configuration saved');

    // 8. Generate project files
    await generateProjectFiles(cwd, config, output);

    // 9. Install dependencies
    await installDependencies(cwd, config, projectInfo.packageManager, output);

    // 10. Success
    output.outro('✓ Initialization complete!');

  } catch (error) {
    handleError(error, output);
  }
}

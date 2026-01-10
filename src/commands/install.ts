/**
 * Install Command (DEPRECATED)
 *
 * This command is deprecated. Use `kigumi init` instead.
 * The init command now handles installation automatically.
 *
 * @deprecated Use `kigumi init` instead
 */

import { getOutput } from '../output/index.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../checks/index.js';
import { handleError } from '../errors/index.js';
import { loadConfig } from '../utils/config.js';
import { getProjectInfo } from '../utils/detect-framework.js';
import { installDependencies } from './init/installer.js';
import { detectTier } from '../utils/tier.js';

/**
 * Install command (DEPRECATED)
 *
 * @deprecated Use `kigumi init` instead
 */
export async function installCommand() {
  const output = getOutput();
  output.intro('kigumi install (DEPRECATED)');

  output.warning('⚠️  This command is deprecated!');
  output.info(
    'Use `kigumi init` instead - it now handles installation automatically.'
  );

  const cwd = process.cwd();

  try {
    // 1. Pre-flight check: Config exists
    const checker = new CheckRunner().add(new ConfigExistsCheck());

    const checkResults = await checker.run({ cwd });
    if (checker.hasErrors(checkResults)) {
      output.error('Pre-flight checks failed');
      output.note('Issues found', checker.formatResults(checkResults));
      process.exit(1);
    }

    // 2. Load configuration
    const config = loadConfig(cwd);
    if (!config) {
      output.error('Configuration not found');
      output.note('Run kigumi init first', 'kigumi init');
      process.exit(1);
    }

    // 3. Validate configuration
    const validationChecker = new CheckRunner().add(new ConfigValidCheck());
    const validationResults = await validationChecker.run({ cwd, config });
    if (validationChecker.hasErrors(validationResults)) {
      output.error('Configuration validation failed');
      output.note(
        'Issues found',
        validationChecker.formatResults(validationResults)
      );
      process.exit(1);
    }

    // 4. Detect tier
    const tier = await detectTier(cwd);

    // 5. Get project info
    const projectInfo = await getProjectInfo(cwd);

    // 6. Reuse installer from init command
    await installDependencies({
      cwd,
      config,
      tier,
      packageManager: projectInfo.packageManager,
      output,
    });

    // 7. Success
    output.outro('✓ Installation complete!');
    output.note(
      'Recommendation',
      'This command is deprecated. Next time, use `kigumi init` which handles installation automatically.'
    );
  } catch (error) {
    handleError(error, output);
  }
}

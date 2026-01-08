/**
 * Install Command
 *
 * Installs Web Awesome package and framework-specific dependencies
 * Reuses installer logic from init command
 */

import { getOutput } from '../output/index.js';
import { CheckRunner, ConfigExistsCheck, ConfigValidCheck } from '../checks/index.js';
import { handleError } from '../errors/index.js';
import { loadConfig } from '../utils/config.js';
import { getProjectInfo } from '../utils/detect-framework.js';
import { installDependencies } from './init/installer.js';

/**
 * Install command
 *
 * Installs Web Awesome and framework-specific dependencies
 */
export async function installCommand() {
  const output = getOutput();
  output.intro('kigumi install');

  const cwd = process.cwd();

  try {
    // 1. Pre-flight checks
    const checker = new CheckRunner()
      .add(new ConfigExistsCheck())
      .add(new ConfigValidCheck());

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

    // 3. Get project info
    const projectInfo = await getProjectInfo(cwd);

    // 4. Reuse installer from init command
    await installDependencies(cwd, config, projectInfo.packageManager, output);

    // 5. Success
    output.outro('✓ Installation complete!');
    output.note(
      'Next steps',
      '1. Configure path aliases (see INSTALLATION.md)\n' +
        "2. Add import '@/lib/webawesome' to your main file\n" +
        '3. Run kigumi add button to add components'
    );
  } catch (error) {
    handleError(error, output);
  }
}

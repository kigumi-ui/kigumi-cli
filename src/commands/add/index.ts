/**
 * Add Command - Main Orchestrator
 *
 * Adds Web Awesome components to the project
 */

import { getOutput } from '../../output/index.js';
import { CheckRunner, ConfigExistsCheck, ConfigValidCheck } from '../../checks/index.js';
import { handleError } from '../../errors/index.js';
import { validators, type AddOptions } from '../../schemas/index.js';
import { loadConfig, getConfig } from '../../utils/config.js';
import { selectComponents } from './component-selector.js';
import { validateComponents } from './validator.js';
import { ComponentInstaller } from './installer.js';

/**
 * Add command
 *
 * @param components - Component names to add
 * @param options - Command options
 */
export async function addCommand(components: string[], options: AddOptions = {}) {
  const output = getOutput();
  output.intro('kigumi add');

  const cwd = options.cwd || process.cwd();

  try {
    // 1. Validate options
    const validatedOptions = validators.add(options);

    // 2. Load configuration (needed for checks)
    let config: any;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch (error) {
      // Config loading failed - will be caught by checks
    }

    // 3. Pre-flight checks
    const checker = new CheckRunner()
      .add(new ConfigExistsCheck())
      .add(new ConfigValidCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      output.error('Pre-flight checks failed');
      output.note('Issues found', checker.formatResults(checkResults));
      process.exit(1);
    }

    // 4. Config is valid at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }
    const tier = config.webAwesome?.tier || 'free';

    // 4. Determine components to add
    const componentsToAdd = await selectComponents(
      components,
      validatedOptions,
      tier,
      output
    );

    // 5. Validate components
    await validateComponents(componentsToAdd, tier, output);

    // 6. Install components
    const installer = new ComponentInstaller(cwd, config, output);
    const results = await installer.installComponents(componentsToAdd, validatedOptions);

    // 7. Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      output.success(`Added ${successful.length} component(s)`);
      const componentNames = successful
        .map(r => r.name)
        .join(', ');
      output.note(
        'Import them',
        `import { ${componentNames} } from '${config.aliases?.['@/components'] || config.componentsDir}';`
      );
    }

    if (failed.length > 0) {
      output.warning(`Failed to add ${failed.length} component(s)`);
      failed.forEach(r => {
        output.error(`${r.name}: ${r.error}`);
      });
    }

    output.outro(successful.length > 0 ? '✓ Done' : 'No components added');

  } catch (error) {
    handleError(error, output);
  }
}

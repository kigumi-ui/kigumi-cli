import type { KigumiConfig } from '../../schemas/config.js';
/**
 * Add Command - Main Orchestrator
 *
 * PURPOSE: Adds Web Awesome components to the project.
 * Handles component selection, validation, and installation.
 *
 * @public
 */

import { getOutput } from '../../output/index.js';
import {
  CheckRunner,
  ConfigExistsCheck,
  ConfigValidCheck,
} from '../../checks/index.js';
import { handleError, PreFlightCheckError } from '../../errors/index.js';
import { validators, type AddOptions } from '../../schemas/index.js';
import { loadConfig, getConfig } from '../../utils/config.js';
import { selectComponents } from './component-selector.js';
import { validateComponents } from './validator.js';
import { ComponentInstaller } from './installer.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * Add command
 *
 * @param components - Component names to add
 * @param options - Command options
 */
export async function addCommand(components: string[], options?: AddOptions) {
  const output = getOutput();
  output.intro('kigumi add');

  const cwd = options?.cwd || process.cwd();

  try {
    // 1. Validate options with defaults
    const validatedOptions = validators.add({
      overwrite: options?.overwrite ?? false,
      all: options?.all ?? false,
      tests: options?.tests ?? true,
      typescript: options?.typescript,
      cwd: options?.cwd,
    });

    // 2. Load configuration (needed for checks)
    let config: KigumiConfig | undefined;
    try {
      loadConfig(cwd);
      config = getConfig(cwd);
    } catch {
      // Config loading failed - will be caught by checks
    }

    // 3. Pre-flight checks
    const checker = new CheckRunner()
      .add(new ConfigExistsCheck())
      .add(new ConfigValidCheck());

    const checkResults = await checker.run({ cwd, config });
    if (checker.hasErrors(checkResults)) {
      throw new PreFlightCheckError(checkResults);
    }

    // Config must be loaded at this point (checks passed)
    if (!config) {
      throw new Error('Configuration not loaded despite passing checks');
    }

    // 4. Detect tier from .env
    const { detectTier } = await import('../../utils/tier.js');
    const tier = await detectTier(cwd);

    // 5. Determine components to add
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
    const results = await installer.installComponents(
      componentsToAdd,
      validatedOptions
    );

    // 6.5. Update vite-env.d.ts with new component types (React + TypeScript only)
    if (config.typescript && config.framework === 'react') {
      const addedComponents = results
        .filter((r) => r.success && !r.skipped)
        .map((r) => r.name);

      if (addedComponents.length > 0) {
        await updateViteEnvTypes(cwd, addedComponents, output);
      }
    }

    // 7. Summary
    const added = results.filter((r) => r.success && !r.skipped);
    const skipped = results.filter((r) => r.success && r.skipped);
    const failed = results.filter((r) => !r.success);

    if (added.length > 0) {
      output.success(`Added ${added.length} component(s)`);
      const componentNames = added.map((r) => r.name).join(', ');
      output.note(
        'Import them',
        `import { ${componentNames} } from '${config.aliases?.['@/components'] || config.componentsDir}';`
      );
    }

    if (skipped.length > 0) {
      output.info(`Skipped ${skipped.length} existing component(s)`);
    }

    if (failed.length > 0) {
      output.warning(`Failed to add ${failed.length} component(s)`);
      failed.forEach((r) => {
        output.error(`${r.name}: ${r.error}`);
      });
    }

    output.outro(added.length > 0 ? '✓ Done' : 'No new components added');
  } catch (error) {
    handleError(error, output);
  }
}

/**
 * Update vite-env.d.ts with new component type declarations
 */
async function updateViteEnvTypes(
  cwd: string,
  components: string[],
  output: import('../../output/types.js').OutputInterface
): Promise<void> {
  const viteEnvPath = path.join(cwd, 'src/vite-env.d.ts');

  if (!(await fs.pathExists(viteEnvPath))) {
    // File doesn't exist, skip update
    return;
  }

  try {
    let content = await fs.readFile(viteEnvPath, 'utf-8');

    // Check if this is our managed file (has the "auto-managed" comment)
    if (!content.includes('auto-managed')) {
      // Not our file, don't modify it
      return;
    }

    let modified = false;

    for (const component of components) {
      const tagName = `wa-${component.toLowerCase()}`;

      // Check if type declaration already exists
      if (content.includes(`'${tagName}':`)) {
        continue; // Already exists
      }

      // Add new type declaration before the closing braces
      const typeDeclaration = `      '${tagName}': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;\n`;

      // Find the IntrinsicElements interface and add before its closing brace
      // Works with both "declare global { namespace JSX {" and "declare module 'react' {"
      const match = content.match(
        /(interface IntrinsicElements \{[\s\S]*?)( {4}\}\s*\}\s*\}\s*(?:export \{\};)?)/
      );

      if (match) {
        content = content.replace(
          match[0],
          `${match[1]}${typeDeclaration}${match[2]}`
        );
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(viteEnvPath, content);
      output.info('Updated vite-env.d.ts with new component types');
    }
  } catch (error) {
    // Silently fail - this is not critical
    if (error instanceof Error) {
      output.warn(`Could not update vite-env.d.ts: ${error.message}`);
    }
  }
}

/**
 * Component Installer
 *
 * PURPOSE: Handles installation of Web Awesome components.
 * Generates component files, CSS, tests, and updates imports.
 * Detects local modifications before overwriting and prompts the user.
 *
 * EXPORTS:
 * - ComponentInstaller - Class that handles component installation
 * - InstallResult - Result type for installation operations
 *
 * @see AGENTS.md Rule #2 for templates-first development
 * @see AGENTS.md Rule #14 for conditional test file generation
 */

import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import * as p from '@clack/prompts';
import {
  getComponent,
  type ComponentDefinition,
} from '../../utils/registry.js';
import {
  generateComponent,
  generateComponentCSSContent,
  generateComponentTestContent,
  getComponentCSSPath,
  getComponentTestPath,
  updateTypeDeclarations,
  updateComponentIndex,
} from '../../utils/template.js';
import {
  checkFileModification,
  getModifiedFiles,
  type FileModificationCheck,
} from '../../utils/file-diff.js';
import type { OutputInterface, OutputSpinner } from '../../output/types.js';
import type { AddOptions } from '../../schemas/index.js';
import type { KigumiConfig } from '../../utils/config.js';

export interface InstallResult {
  name: string;
  success: boolean;
  skipped?: boolean;
  error?: string;
  /** Names of files that had local modifications when overwritten */
  modifiedFiles?: string[];
}

/**
 * Component installer class
 */
export class ComponentInstaller {
  constructor(
    private cwd: string,
    private config: KigumiConfig,
    private output: OutputInterface
  ) {}

  /**
   * Install multiple components
   */
  async installComponents(
    componentNames: string[],
    options: AddOptions
  ): Promise<InstallResult[]> {
    const results: InstallResult[] = [];

    for (const componentName of componentNames) {
      const spinner = this.output.spinner(
        `Adding ${pc.cyan(componentName)}...`
      );

      try {
        const component = getComponent(componentName);
        if (!component) {
          throw new Error(`Component ${componentName} not found`);
        }

        const result = await this.installComponent(component, options, spinner);

        if (result.skipped) {
          spinner.stop(
            `${pc.yellow('○')} Skipped ${pc.cyan(componentName)} (already exists)`
          );
        } else {
          spinner.stop(`${pc.green('✓')} Added ${pc.cyan(componentName)}`);
        }
        results.push(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        spinner.error(`${pc.red('✗')} Failed to add ${pc.cyan(componentName)}`);
        results.push({
          name: componentName,
          success: false,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  /**
   * Install a single component
   * @returns InstallResult with success/skipped/modifiedFiles info
   */
  private async installComponent(
    component: ComponentDefinition,
    options: AddOptions,
    spinner: OutputSpinner
  ): Promise<InstallResult> {
    // Generate all content as strings first (no disk writes yet)
    const componentContent = await generateComponent(
      component,
      this.config,
      this.config.typescript
    );

    const ext =
      this.config.framework === 'vue'
        ? this.config.typescript
          ? 'vue'
          : 'js.vue'
        : this.config.typescript
          ? 'tsx'
          : 'jsx';
    const componentDir = path.join(
      this.cwd,
      this.config.componentsDir,
      component.name
    );
    const componentPath = path.join(componentDir, `${component.name}.${ext}`);
    const cssPath = getComponentCSSPath(component, this.config, this.cwd);

    const hasTestSetup = await this.checkTestSetup();
    const cssContent = await generateComponentCSSContent(
      component,
      this.config
    );
    const testContent = hasTestSetup
      ? await generateComponentTestContent(component, this.config)
      : null;
    const testPath = hasTestSetup
      ? getComponentTestPath(component, this.config, this.cwd)
      : null;

    // Check if component already exists
    const componentExists = await fs.pathExists(componentPath);

    if (componentExists && !options.overwrite) {
      if (options.all) {
        return { name: component.name, success: true, skipped: true };
      }
      throw new Error('Component already exists. Use --overwrite to replace.');
    }

    // When overwriting, check for local modifications
    let modifiedFileNames: string[] | undefined;
    if (componentExists && options.overwrite) {
      const checks = await Promise.all(
        [
          checkFileModification(componentPath, componentContent),
          checkFileModification(cssPath, cssContent),
          testContent && testPath
            ? checkFileModification(testPath, testContent)
            : null,
        ].filter((c): c is Promise<FileModificationCheck> => c !== null)
      );

      const modified = getModifiedFiles(checks);

      if (modified.length > 0) {
        modifiedFileNames = modified.map((m) => m.fileName);

        // Stop spinner before prompting
        spinner.stop(
          `${pc.yellow('!')} ${pc.cyan(component.name)} has local modifications`
        );

        // Show which files are modified vs unchanged
        for (const check of checks) {
          if (check.modified) {
            this.output.warn(`  Modified:  ${pc.yellow(check.fileName)}`);
          } else if (check.exists) {
            this.output.info(`  Unchanged: ${pc.dim(check.fileName)}`);
          }
        }

        // Auto-confirm with --yes, otherwise prompt
        if (!options.yes) {
          const confirmed = await p.confirm({
            message: `Overwrite all files for ${component.name}?`,
            initialValue: false,
          });

          if (p.isCancel(confirmed) || !confirmed) {
            return { name: component.name, success: true, skipped: true };
          }
        }

        // Restart spinner for the write phase
        spinner.start(`Overwriting ${pc.cyan(component.name)}...`);
      }
    }

    // Create component directory (required before writing files to it)
    await fs.ensureDir(componentDir);

    // PARALLELIZED FILE OPERATIONS
    const parallelOps: Promise<void>[] = [
      fs.writeFile(componentPath, componentContent),
      fs.writeFile(cssPath, cssContent),
    ];

    if (testContent && testPath) {
      parallelOps.push(fs.writeFile(testPath, testContent));
    }

    await Promise.all(parallelOps);

    // SEQUENTIAL OPERATIONS
    // WHY: These operations modify shared files (index.ts, webawesome.ts, type declarations)
    // and must be sequential to avoid race conditions
    if (this.config.typescript) {
      await updateTypeDeclarations(component, this.config, this.cwd);
    }
    await updateComponentIndex(component, this.config, this.cwd);
    await this.updateWebAwesomeImports(component);

    return {
      name: component.name,
      success: true,
      modifiedFiles: modifiedFileNames,
    };
  }

  /**
   * Check if project has test setup (Vitest or Jest)
   */
  private async checkTestSetup(): Promise<boolean> {
    try {
      const packageJsonPath = path.join(this.cwd, 'package.json');
      if (!(await fs.pathExists(packageJsonPath))) {
        return false;
      }

      const packageJson = await fs.readJSON(packageJsonPath);

      // Check for Vitest or Jest
      const hasVitest = !!(
        packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest
      );

      const hasJest = !!(
        packageJson.devDependencies?.jest || packageJson.dependencies?.jest
      );

      // Check for testing-library
      const hasTestingLibrary = !!(
        packageJson.devDependencies?.['@testing-library/react'] ||
        packageJson.dependencies?.['@testing-library/react'] ||
        packageJson.devDependencies?.['@testing-library/vue'] ||
        packageJson.dependencies?.['@testing-library/vue']
      );

      return (hasVitest || hasJest) && hasTestingLibrary;
    } catch {
      return false;
    }
  }

  /**
   * Update webawesome.ts to include component JS imports
   *
   * WHY: Web Awesome components need to be imported to register their
   * custom elements. This method ensures the component JS file is imported
   * in webawesome.ts so the component can be used.
   *
   * @internal
   */
  private async updateWebAwesomeImports(
    component: ComponentDefinition
  ): Promise<void> {
    const { detectTier, getWebAwesomePackage } =
      await import('../../utils/tier.js');
    const tier = await detectTier(this.cwd);
    const packageName = getWebAwesomePackage(tier);

    const webawesomePath = path.join(
      this.cwd,
      this.config.utilsDir || 'src/lib',
      'webawesome.ts'
    );

    // Check if file exists
    if (!(await fs.pathExists(webawesomePath))) {
      return; // Skip if webawesome.ts doesn't exist
    }

    const content = await fs.readFile(webawesomePath, 'utf-8');
    const componentImport = `import '${packageName}/dist/components/${component.tagName.replace('wa-', '')}/${component.tagName.replace('wa-', '')}.js';`;

    // Check if import already exists
    if (content.includes(componentImport)) {
      return; // Already imported
    }

    // Find the section with component imports
    const importMarker =
      '// Import Web Awesome components (registers web components)';
    if (!content.includes(importMarker)) {
      return; // Can't find marker, skip
    }

    // Insert the new import after the marker
    const lines = content.split('\n');
    const markerIndex = lines.findIndex((line) => line.includes(importMarker));

    if (markerIndex !== -1) {
      // Find the last import line after the marker
      let insertIndex = markerIndex + 1;
      while (
        insertIndex < lines.length &&
        lines[insertIndex].trim().startsWith('import ')
      ) {
        insertIndex++;
      }

      // Insert the new import
      lines.splice(insertIndex, 0, componentImport);

      // Write back
      await fs.writeFile(webawesomePath, lines.join('\n'));
    }
  }
}

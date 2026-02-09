/**
 * Component Installer
 *
 * PURPOSE: Handles installation of Web Awesome components.
 * Generates component files, CSS, tests, and updates imports.
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
import {
  getComponent,
  type ComponentDefinition,
} from '../../utils/registry.js';
import {
  generateComponent,
  generateComponentCSS,
  generateComponentTest,
  updateTypeDeclarations,
  updateComponentIndex,
} from '../../utils/template.js';
import type { OutputInterface } from '../../output/types.js';
import type { AddOptions } from '../../schemas/index.js';
import type { KigumiConfig } from '../../utils/config.js';

export interface InstallResult {
  name: string;
  success: boolean;
  skipped?: boolean;
  error?: string;
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

        const wasSkipped = await this.installComponent(component, options);

        if (wasSkipped) {
          spinner.stop(
            `${pc.yellow('○')} Skipped ${pc.cyan(componentName)} (already exists)`
          );
          results.push({ name: componentName, success: true, skipped: true });
        } else {
          spinner.stop(`${pc.green('✓')} Added ${pc.cyan(componentName)}`);
          results.push({ name: componentName, success: true });
        }
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
   * @returns true if skipped, false if installed
   */
  private async installComponent(
    component: ComponentDefinition,
    options: AddOptions
  ): Promise<boolean> {
    // Generate component file
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

    // Check if file exists
    if ((await fs.pathExists(componentPath)) && !options.overwrite) {
      // When using --all flag, skip silently instead of throwing
      if (options.all) {
        return true; // Skip this component
      }
      throw new Error('Component already exists. Use --overwrite to replace.');
    }

    // Create component directory (required before writing files to it)
    await fs.ensureDir(componentDir);

    // Check test setup BEFORE parallel operations (needed to decide what to generate)
    const hasTestSetup = await this.checkTestSetup();

    // PARALLELIZED FILE OPERATIONS
    // WHY: These operations are independent - component file, CSS, and test file
    // can all be written simultaneously. This gives ~2x speedup when adding components.
    const parallelOps: Promise<void>[] = [
      // Write component file
      fs.writeFile(componentPath, componentContent),
      // Generate CSS file
      generateComponentCSS(component, this.config, this.cwd),
    ];

    // Generate unit test ONLY if test setup exists
    if (hasTestSetup) {
      parallelOps.push(generateComponentTest(component, this.config, this.cwd));
    }

    // Wait for all file writes to complete
    await Promise.all(parallelOps);

    // SEQUENTIAL OPERATIONS
    // WHY: These operations modify shared files (index.ts, webawesome.ts, type declarations)
    // and must be sequential to avoid race conditions
    if (this.config.typescript) {
      await updateTypeDeclarations(component, this.config, this.cwd);
    }
    await updateComponentIndex(component, this.config, this.cwd);
    await this.updateWebAwesomeImports(component);

    return false; // Not skipped
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

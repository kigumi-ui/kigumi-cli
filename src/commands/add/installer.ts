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
  getComponentExtension,
  getTestExtension,
  getFileBaseName,
  updateTypeDeclarations,
  updateComponentIndex,
} from '../../utils/template.js';
import {
  checkFileModification,
  getModifiedFiles,
  type FileModificationCheck,
} from '../../utils/file-diff.js';
import { saveSnapshot } from '../../utils/snapshot.js';
import { renderDiff } from '../../utils/diff-renderer.js';
import type { OutputInterface, OutputSpinner } from '../../output/types.js';
import type { AddOptions } from '../../schemas/index.js';
import type { KigumiConfig } from '../../schemas/config.js';

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
      this.config.typescript,
      this.cwd
    );

    const ext = getComponentExtension(
      this.config.framework,
      this.config.typescript
    );
    const componentDir = path.join(
      this.cwd,
      this.config.componentsDir,
      component.name
    );
    const fileName = getFileBaseName(this.config.framework, component.name);
    const componentPath = path.join(componentDir, `${fileName}.${ext}`);
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

    // When component exists, show diff + prompt (or auto-overwrite with --force)
    let modifiedFileNames: string[] | undefined;
    if (componentExists) {
      // --all without --force: silently skip existing components
      if (options.all && !options.force) {
        return { name: component.name, success: true, skipped: true };
      }

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

        // Stop spinner before showing diff
        spinner.stop(
          `${pc.yellow('!')} ${pc.cyan(component.name)} has local modifications`
        );

        // Map file paths to generated content for diff rendering
        const contentByPath = new Map<string, string>([
          [componentPath, componentContent],
          [cssPath, cssContent],
        ]);
        if (testContent && testPath) {
          contentByPath.set(testPath, testContent);
        }

        // Show which files are modified vs unchanged, with diffs
        for (const check of checks) {
          if (check.modified) {
            this.output.warn(`  Modified:  ${pc.yellow(check.fileName)}`);
            const newContent = contentByPath.get(check.filePath);
            if (newContent) {
              const existingContent = await fs.readFile(
                check.filePath,
                'utf-8'
              );
              const diff = renderDiff(
                existingContent,
                newContent,
                check.fileName
              );
              if (diff) {
                this.output.info(diff);
              }
            }
          } else if (check.exists) {
            this.output.info(`  Unchanged: ${pc.dim(check.fileName)}`);
          }
        }

        // --force or --yes: skip prompt
        if (!options.force && !options.yes) {
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
      } else if (!options.force && !options.yes) {
        // Files exist but are identical to template -- skip silently
        return { name: component.name, success: true, skipped: true };
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

    // Save snapshot for three-way merge support (kigumi update)
    // Only for builtin template-generated components, not community --from installs
    if (!options.from) {
      const testExt = getTestExtension(
        this.config.framework,
        this.config.typescript
      );

      const snapshotFileName = getFileBaseName(
        this.config.framework,
        component.name
      );
      const snapshotCSSName =
        this.config.framework === 'angular'
          ? `${snapshotFileName}.component.css`
          : `${component.name}.css`;

      await saveSnapshot(this.cwd, component.name, {
        [`${snapshotFileName}.${ext}`]: componentContent,
        [snapshotCSSName]: cssContent,
        ...(testContent
          ? { [`${snapshotFileName}.${testExt}`]: testContent }
          : {}),
      });
    }

    // SEQUENTIAL OPERATIONS
    // WHY: These operations modify shared files (index.ts, kigumi.ts, type declarations)
    // and must be sequential to avoid race conditions
    if (this.config.typescript) {
      await updateTypeDeclarations(component, this.config, this.cwd);
    }
    await updateComponentIndex(component, this.config, this.cwd);
    await this.updateKigumiImports(component);

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
    // Angular CLI always includes test infrastructure (Karma + Jasmine)
    if (this.config.framework === 'angular') {
      return true;
    }

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
    } catch (_error) {
      return false;
    }
  }

  /**
   * Update kigumi.ts to include component JS imports
   *
   * WHY: Web Awesome components need to be imported to register their
   * custom elements. This method ensures the component JS file is imported
   * in kigumi.ts so the component can be used.
   *
   * @internal
   */
  private async updateKigumiImports(
    component: ComponentDefinition
  ): Promise<void> {
    const { detectTier, getWebAwesomePackage } =
      await import('../../utils/tier.js');
    const tier = await detectTier(this.cwd);
    const packageName = getWebAwesomePackage(tier);

    const kigumiPath = path.join(
      this.cwd,
      this.config.utilsDir || 'src/lib',
      'kigumi.ts'
    );

    // Check if file exists
    if (!(await fs.pathExists(kigumiPath))) {
      return; // Skip if kigumi.ts doesn't exist
    }

    const content = await fs.readFile(kigumiPath, 'utf-8');
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
      await fs.writeFile(kigumiPath, lines.join('\n'));
    }
  }
}

/**
 * Component Installer
 *
 * Handles installation of Web Awesome components
 */

import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { getComponent, type ComponentDefinition } from '../../utils/registry.js';
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
      const spinner = this.output.spinner(`Adding ${pc.cyan(componentName)}...`);

      try {
        const component = getComponent(componentName);
        if (!component) {
          throw new Error(`Component ${componentName} not found`);
        }

        await this.installComponent(component, options);

        spinner.stop(`${pc.green('✓')} Added ${pc.cyan(componentName)}`);
        results.push({ name: componentName, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        spinner.error(`${pc.red('✗')} Failed to add ${pc.cyan(componentName)}`);
        results.push({ name: componentName, success: false, error: errorMessage });
      }
    }

    return results;
  }

  /**
   * Install a single component
   */
  private async installComponent(
    component: ComponentDefinition,
    options: AddOptions
  ): Promise<void> {
    // Generate component file
    const componentContent = await generateComponent(component, this.config);

    const ext = this.config.typescript ? 'tsx' : 'jsx';
    const componentDir = path.join(this.cwd, this.config.componentsDir, component.name);
    const componentPath = path.join(componentDir, `${component.name}.${ext}`);

    // Check if file exists
    if ((await fs.pathExists(componentPath)) && !options.overwrite) {
      throw new Error('Component already exists. Use --overwrite to replace.');
    }

    // Create component directory
    await fs.ensureDir(componentDir);

    // Write component file
    await fs.writeFile(componentPath, componentContent);

    // Generate CSS file
    await generateComponentCSS(component, this.config, this.cwd);

    // Generate unit test
    await generateComponentTest(component, this.config, this.cwd);

    // Update TypeScript declarations
    if (this.config.typescript && options.types !== false) {
      await updateTypeDeclarations(component, this.config, this.cwd);
    }

    // Update component index
    await updateComponentIndex(component, this.config, this.cwd);

    // Update webawesome.ts to include component JS import
    await this.updateWebAwesomeImports(component);
  }

  /**
   * Update webawesome.ts to include component JS imports
   */
  private async updateWebAwesomeImports(component: ComponentDefinition): Promise<void> {
    const tier = this.config.webAwesome?.tier || 'free';
    const packageName =
      tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';

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
    const importMarker = '// Import Web Awesome components (registers web components)';
    if (!content.includes(importMarker)) {
      return; // Can't find marker, skip
    }

    // Insert the new import after the marker
    const lines = content.split('\n');
    const markerIndex = lines.findIndex(line => line.includes(importMarker));

    if (markerIndex !== -1) {
      // Find the last import line after the marker
      let insertIndex = markerIndex + 1;
      while (insertIndex < lines.length && lines[insertIndex].trim().startsWith('import ')) {
        insertIndex++;
      }

      // Insert the new import
      lines.splice(insertIndex, 0, componentImport);

      // Write back
      await fs.writeFile(webawesomePath, lines.join('\n'));
    }
  }
}

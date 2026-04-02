/**
 * Angular Framework Plugin
 *
 * Implements the FrameworkPlugin interface for Angular 17+ projects.
 * Supports standalone components with CUSTOM_ELEMENTS_SCHEMA.
 */
import type { KigumiConfig } from '../../schemas/config.js';

import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import type {
  FrameworkPlugin,
  DetectionResult,
  GeneratedFile,
  GenerateOptions,
  ValidationResult,
  ComponentDefinition,
} from '../types.js';
import type { ComponentDefinition as RegistryComponentDefinition } from '../../utils/registry.js';
import { toKebabCase } from '../../utils/naming.js';

export class AngularPlugin implements FrameworkPlugin {
  readonly name = 'angular' as const;

  async detect(cwd: string): Promise<DetectionResult> {
    const packageJsonPath = path.join(cwd, 'package.json');

    if (!(await fs.pathExists(packageJsonPath))) {
      return { detected: false, confidence: 'low' };
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const hasAngular = !!deps['@angular/core'];

    if (!hasAngular) {
      return { detected: false, confidence: 'low' };
    }

    const hasAngularCli = !!deps['@angular/cli'];
    const hasAngularCommon = !!deps['@angular/common'];

    const confidence =
      hasAngular && hasAngularCli && hasAngularCommon
        ? 'high'
        : hasAngular && hasAngularCommon
          ? 'medium'
          : 'low';

    return {
      detected: true,
      confidence,
      version: deps['@angular/core']?.replace(/^[\^~]/, ''),
      details: {
        packageJsonDeps: ['@angular/core', '@angular/common'],
        configFiles: ['angular.json', 'tsconfig.json'],
      },
    };
  }

  async generateComponent(
    cwd: string,
    config: KigumiConfig,
    component: ComponentDefinition,
    options: GenerateOptions
  ): Promise<GeneratedFile[]> {
    const {
      generateComponent,
      generateComponentCSSContent,
      generateComponentTestContent,
    } = await import('../../utils/template.js');

    const files: GeneratedFile[] = [];
    const kebabName = toKebabCase(component.name);
    const componentDir = path.join(cwd, config.componentsDir, component.name);

    // Generate main component file
    const componentContent = await generateComponent(
      component as unknown as RegistryComponentDefinition,
      config,
      true, // Angular is always TypeScript
      cwd
    );

    files.push({
      path: path.join(componentDir, `${kebabName}.component.ts`),
      content: componentContent,
      overwrite: options.overwrite,
    });

    // Generate CSS file
    const cssContent = await generateComponentCSSContent(
      component as unknown as RegistryComponentDefinition,
      config
    );

    files.push({
      path: path.join(componentDir, `${kebabName}.component.css`),
      content: cssContent,
      overwrite: options.overwrite,
    });

    // Generate test file
    if (options.tests) {
      const testContent = await generateComponentTestContent(
        component as unknown as RegistryComponentDefinition,
        config
      );

      files.push({
        path: path.join(componentDir, `${kebabName}.component.spec.ts`),
        content: testContent,
        overwrite: options.overwrite,
      });
    }

    return files;
  }

  async generateSetupFiles(
    cwd: string,
    config: KigumiConfig
  ): Promise<GeneratedFile[]> {
    // Angular uses the same kigumi.ts setup as React/Vue
    // for CSS imports and theme registration
    const { regenerateKigumiSetup } = await import('../../utils/regenerate.js');
    const utilsDir = config.utilsDir || 'src/lib';
    await regenerateKigumiSetup(cwd, config, utilsDir);

    // No vite-env.d.ts needed (Angular uses angular.json, not Vite)
    // No web-awesome.d.ts needed (Angular uses CUSTOM_ELEMENTS_SCHEMA)
    return [];
  }

  async installDependencies(
    cwd: string,
    packageManager: string,
    additionalDeps: string[] = []
  ): Promise<void> {
    // Angular does not need clsx or other extra dependencies
    const deps = [...additionalDeps];
    if (deps.length === 0) return;

    const installArgs =
      packageManager === 'npm' ? ['install', ...deps] : ['add', ...deps];

    await execa(packageManager, installArgs, { cwd, stdio: 'inherit' });
  }

  validateConfig(config: Partial<KigumiConfig>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Angular requires TypeScript
    if (config.typescript === false) {
      errors.push(
        'Angular projects require TypeScript. Set typescript: true in kigumi.config.json.'
      );
    }

    if (config.componentsDir && !config.componentsDir.includes('components')) {
      warnings.push(
        `componentsDir "${config.componentsDir}" doesn't contain "components". Is this intentional?`
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  getTypeScriptConfig(): Partial<Record<string, unknown>> {
    // Angular 17+ CLI handles decorators via esbuild natively.
    // No experimentalDecorators needed.
    return {
      compilerOptions: {
        target: 'ES2022',
        useDefineForClassFields: false,
      },
    };
  }
}

/**
 * Angular Framework Plugin (Stub)
 *
 * Minimal implementation for Angular support.
 * Will be fully implemented when Angular templates are ready.
 */

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
    config: any,
    component: ComponentDefinition,
    options: GenerateOptions
  ): Promise<GeneratedFile[]> {
    // TODO: Implement Angular component generation
    throw new Error('Angular component generation is not yet implemented. Coming soon!');
  }

  async generateSetupFiles(cwd: string, config: any): Promise<GeneratedFile[]> {
    // TODO: Implement Angular setup files
    throw new Error('Angular setup files are not yet implemented. Coming soon!');
  }

  async installDependencies(
    cwd: string,
    packageManager: string,
    additionalDeps: string[] = []
  ): Promise<void> {
    const deps = [...additionalDeps];

    const installArgs =
      packageManager === 'npm'
        ? ['install', ...deps]
        : ['add', ...deps];

    await execa(packageManager, installArgs, { cwd, stdio: 'inherit' });
  }

  validateConfig(config: Partial<any>): ValidationResult {
    return {
      valid: true,
    };
  }

  getTypeScriptConfig(): Partial<Record<string, any>> {
    return {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    };
  }
}

/**
 * Svelte Framework Plugin (Stub)
 *
 * Minimal implementation for Svelte support.
 * Will be fully implemented when Svelte templates are ready.
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

export class SveltePlugin implements FrameworkPlugin {
  readonly name = 'svelte' as const;

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

    const hasSvelte = !!deps.svelte;

    if (!hasSvelte) {
      return { detected: false, confidence: 'low' };
    }

    const hasSvelteKit = !!deps['@sveltejs/kit'];
    const hasVite = !!deps.vite && !!deps['@sveltejs/vite-plugin-svelte'];

    const confidence =
      hasSvelte && (hasSvelteKit || hasVite)
        ? 'high'
        : hasSvelte
          ? 'medium'
          : 'low';

    return {
      detected: true,
      confidence,
      version: deps.svelte?.replace(/^[\^~]/, ''),
      details: {
        packageJsonDeps: ['svelte'],
        configFiles: hasSvelteKit
          ? ['svelte.config.js']
          : hasVite
            ? ['vite.config.ts']
            : [],
      },
    };
  }

  async generateComponent(
    _cwd: string,
    _config: KigumiConfig,
    _component: ComponentDefinition,
    _options: GenerateOptions
  ): Promise<GeneratedFile[]> {
    // TODO: Implement Svelte component generation
    throw new Error(
      'Svelte component generation is not yet implemented. Coming soon!'
    );
  }

  async generateSetupFiles(
    _cwd: string,
    _config: KigumiConfig
  ): Promise<GeneratedFile[]> {
    // TODO: Implement Svelte setup files
    throw new Error('Svelte setup files are not yet implemented. Coming soon!');
  }

  async installDependencies(
    cwd: string,
    packageManager: string,
    additionalDeps: string[] = []
  ): Promise<void> {
    const deps = [...additionalDeps];

    const installArgs =
      packageManager === 'npm' ? ['install', ...deps] : ['add', ...deps];

    await execa(packageManager, installArgs, { cwd, stdio: 'inherit' });
  }

  validateConfig(_config: Partial<KigumiConfig>): ValidationResult {
    return {
      valid: true,
    };
  }

  getTypeScriptConfig(): Partial<Record<string, unknown>> {
    return {
      extends: './.svelte-kit/tsconfig.json',
    };
  }
}

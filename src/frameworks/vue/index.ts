/**
 * Vue Framework Plugin (Stub)
 *
 * Minimal implementation for Vue support.
 * Will be fully implemented when Vue templates are ready.
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

export class VuePlugin implements FrameworkPlugin {
  readonly name = 'vue' as const;

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

    const hasVue = !!deps.vue;

    if (!hasVue) {
      return { detected: false, confidence: 'low' };
    }

    const _hasVueRouter = !!deps['vue-router'];
    const hasVite = !!deps.vite && !!deps['@vitejs/plugin-vue'];

    const confidence = hasVue && hasVite ? 'high' : hasVue ? 'medium' : 'low';

    return {
      detected: true,
      confidence,
      version: deps.vue?.replace(/^[\^~]/, ''),
      details: {
        packageJsonDeps: ['vue'],
        configFiles: hasVite ? ['vite.config.ts'] : [],
      },
    };
  }

  async generateComponent(
    _cwd: string,
    _config: KigumiConfig,
    _component: ComponentDefinition,
    _options: GenerateOptions
  ): Promise<GeneratedFile[]> {
    // TODO: Implement Vue component generation
    throw new Error(
      'Vue component generation is not yet implemented. Coming soon!'
    );
  }

  async generateSetupFiles(
    _cwd: string,
    _config: KigumiConfig
  ): Promise<GeneratedFile[]> {
    // TODO: Implement Vue setup files
    throw new Error('Vue setup files are not yet implemented. Coming soon!');
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
      compilerOptions: {
        jsx: 'preserve',
      },
    };
  }
}

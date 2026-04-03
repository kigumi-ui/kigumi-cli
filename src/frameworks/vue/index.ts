/**
 * Vue Framework Plugin
 *
 * Implements the FrameworkPlugin interface for Vue 3 projects.
 */
import type { KigumiConfig } from '../../schemas/config.js';

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import type {
  FrameworkPlugin,
  DetectionResult,
  GeneratedFile,
  GenerateOptions,
  ValidationResult,
  ComponentDefinition,
} from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find package root by looking for package.json
function findPackageRoot(startDir: string): string {
  let currentDir = startDir;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error('Could not find package.json');
}

const PACKAGE_ROOT = findPackageRoot(__dirname);
const TEMPLATES_DIR = path.join(PACKAGE_ROOT, 'templates');

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

  /**
   * Generate Vue component files
   */
  async generateComponent(
    cwd: string,
    config: KigumiConfig,
    component: ComponentDefinition,
    options: GenerateOptions
  ): Promise<GeneratedFile[]> {
    const { generateComponent } = await import('../../utils/template.js');
    const files: GeneratedFile[] = [];

    const componentDir = path.join(cwd, config.componentsDir, component.name);
    const fileExtension = options.typescript ? 'vue' : 'js.vue';

    // Generate main component file
    const componentContent = await generateComponent(
      component,
      config,
      options.typescript,
      cwd
    );

    files.push({
      path: path.join(componentDir, `${component.name}.${fileExtension}`),
      content: componentContent,
      overwrite: options.overwrite,
    });

    // Generate CSS file
    const cssContent = await this.generateStylesFile(component);
    if (cssContent) {
      files.push({
        path: path.join(componentDir, `${component.name}.css`),
        content: cssContent,
        overwrite: options.overwrite,
      });
    }

    // Generate test file if requested
    if (options.tests) {
      const testExt = options.typescript ? 'test.ts' : 'test.js';
      const testContent = await this.generateTestFile(component, options);
      if (testContent) {
        files.push({
          path: path.join(componentDir, `${component.name}.${testExt}`),
          content: testContent,
          overwrite: options.overwrite,
        });
      }
    }

    return files;
  }

  /**
   * Generate Vue-specific setup files
   */
  async generateSetupFiles(
    cwd: string,
    config: KigumiConfig
  ): Promise<GeneratedFile[]> {
    const { regenerateKigumiSetup } = await import('../../utils/regenerate.js');

    // Generate kigumi.ts (shared across frameworks)
    await regenerateKigumiSetup(cwd, config, config.utilsDir || 'src/lib');

    // No vite-env.d.ts needed for Vue - Vue handles custom element types differently
    // Vue users configure isCustomElement in vite.config.ts instead

    return [];
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

  /**
   * Validate Vue-specific configuration
   */
  validateConfig(config: Partial<KigumiConfig>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate componentsDir follows Vue conventions
    if (config.componentsDir && !config.componentsDir.includes('components')) {
      warnings.push(
        'Vue projects typically use a "components" directory. Consider using "src/components" or "src/components/ui".'
      );
    }

    // Validate utilsDir for Vue
    if (
      config.utilsDir &&
      !['src/lib', 'src/utils', 'src/composables'].includes(config.utilsDir)
    ) {
      warnings.push(
        'Vue projects typically use "src/lib", "src/utils", or "src/composables" for utilities.'
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get Vue-specific TypeScript configuration
   */
  getTypeScriptConfig(): Partial<Record<string, unknown>> {
    return {
      compilerOptions: {
        jsx: 'preserve',
        moduleResolution: 'bundler',
        verbatimModuleSyntax: true,
      },
    };
  }

  /**
   * Generate styles file for component
   */
  private async generateStylesFile(
    component: ComponentDefinition
  ): Promise<string> {
    const templatePath = path.join(
      TEMPLATES_DIR,
      'vue',
      component.name,
      `${component.name}.css.hbs`
    );

    if (await fs.pathExists(templatePath)) {
      return fs.readFile(templatePath, 'utf-8');
    }

    // Fallback to basic CSS structure
    return `/* ${component.name} Component Styles */

.${component.name} {
  /* Add your styles here */
}
`;
  }

  /**
   * Generate test file for component
   */
  private async generateTestFile(
    component: ComponentDefinition,
    options: GenerateOptions
  ): Promise<string> {
    const fileExtension = options.typescript ? 'test.ts' : 'test.js';
    const templatePath = path.join(
      TEMPLATES_DIR,
      'vue',
      component.name,
      `${component.name}.${fileExtension}.hbs`
    );

    if (await fs.pathExists(templatePath)) {
      return fs.readFile(templatePath, 'utf-8');
    }

    // Fallback to basic test structure
    const vueExt = options.typescript ? '.vue' : '.js.vue';
    return `import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import ${component.name} from './${component.name}${vueExt}';

describe('${component.name}', () => {
  it('renders without crashing', () => {
    const { container } = mount(${component.name});
    expect(container.querySelector('${component.tagName}')).toBeTruthy();
  });
});
`;
  }
}

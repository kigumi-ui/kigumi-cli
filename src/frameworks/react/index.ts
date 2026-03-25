/**
 * React Framework Plugin
 *
 * Implements the FrameworkPlugin interface for React projects.
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
import type { ComponentDefinition as RegistryComponentDefinition } from '../../utils/registry.js';

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

export class ReactPlugin implements FrameworkPlugin {
  readonly name = 'react' as const;

  /**
   * Detect if this is a React project
   */
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

    // Check for React
    const hasReact = !!deps.react || !!deps['@types/react'];

    if (!hasReact) {
      return { detected: false, confidence: 'low' };
    }

    // Determine confidence based on additional indicators
    const hasReactDom = !!deps['react-dom'];
    const hasReactScripts = !!deps['react-scripts'];
    const hasVite = !!deps.vite && !!deps['@vitejs/plugin-react'];

    const confidence =
      hasReactDom && (hasReactScripts || hasVite)
        ? 'high'
        : hasReactDom
          ? 'medium'
          : 'low';

    return {
      detected: true,
      confidence,
      version: deps.react?.replace(/^[\^~]/, ''),
      details: {
        packageJsonDeps: ['react', 'react-dom'],
        configFiles: hasVite ? ['vite.config.ts'] : ['tsconfig.json'],
      },
    };
  }

  /**
   * Generate React component files
   */
  async generateComponent(
    cwd: string,
    config: KigumiConfig,
    component: ComponentDefinition,
    options: GenerateOptions
  ): Promise<GeneratedFile[]> {
    // Import the existing component generation logic
    const { generateComponent } = await import('../../utils/template.js');

    // Use existing template generation system
    const files: GeneratedFile[] = [];

    const componentDir = path.join(cwd, config.componentsDir, component.name);
    const fileExtension = options.typescript ? 'tsx' : 'jsx';

    // Generate main component file
    const componentContent = await generateComponent(
      component as unknown as RegistryComponentDefinition,
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
      const testContent = await this.generateTestFile(component, options);
      if (testContent) {
        files.push({
          path: path.join(
            componentDir,
            `${component.name}.test.${fileExtension}`
          ),
          content: testContent,
          overwrite: options.overwrite,
        });
      }
    }

    return files;
  }

  /**
   * Generate React-specific setup files
   */
  async generateSetupFiles(
    cwd: string,
    config: KigumiConfig
  ): Promise<GeneratedFile[]> {
    // These files are now generated directly by regenerate functions
    // This method is kept for compatibility but delegates to regenerate.ts
    const { regenerateKigumiSetup, generateViteEnvDts } =
      await import('../../utils/regenerate.js');

    // Trigger file generation (they write directly to disk)
    await regenerateKigumiSetup(cwd, config, config.utilsDir || 'src/lib');

    if (config.typescript) {
      // Detect tier from .env or default to free
      const { detectTier } = await import('../../utils/tier.js');
      const tier = await detectTier(cwd);
      const waPackage =
        tier === 'pro'
          ? '@awesome.me/webawesome-pro'
          : '@awesome.me/webawesome';
      await generateViteEnvDts(cwd, 'src', waPackage);
    }

    // Return empty array since files are written directly
    return [];
  }

  /**
   * Install React-specific dependencies
   */
  async installDependencies(
    cwd: string,
    packageManager: string,
    additionalDeps: string[] = []
  ): Promise<void> {
    // React projects need clsx for className management
    const deps = ['clsx', ...additionalDeps];

    const installArgs =
      packageManager === 'npm' ? ['install', ...deps] : ['add', ...deps];

    await execa(packageManager, installArgs, { cwd, stdio: 'inherit' });
  }

  /**
   * Validate React-specific configuration
   */
  validateConfig(config: Partial<KigumiConfig>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate componentsDir follows React conventions
    if (config.componentsDir && !config.componentsDir.includes('components')) {
      warnings.push(
        'React projects typically use a "components" directory. Consider using "src/components" or "src/components/ui".'
      );
    }

    // Validate utilsDir for React
    if (
      config.utilsDir &&
      !['src/lib', 'src/utils'].includes(config.utilsDir)
    ) {
      warnings.push(
        'React projects typically use "src/lib" or "src/utils" for utilities.'
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get React-specific TypeScript configuration
   */
  getTypeScriptConfig(): Partial<Record<string, unknown>> {
    return {
      compilerOptions: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    };
  }

  /**
   * Generate styles file for component
   */
  private async generateStylesFile(
    component: ComponentDefinition
  ): Promise<string> {
    // Use existing template system
    const templatePath = path.join(
      TEMPLATES_DIR,
      'react',
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
    const fileExtension = options.typescript ? 'tsx' : 'jsx';
    const templatePath = path.join(
      TEMPLATES_DIR,
      'react',
      component.name,
      `${component.name}.test.${fileExtension}.hbs`
    );

    if (await fs.pathExists(templatePath)) {
      return fs.readFile(templatePath, 'utf-8');
    }

    // Fallback to basic test structure
    return `import React from 'react';
import { render, screen } from '@testing-library/react';
import { ${component.name} } from './${component.name}';

describe('${component.name}', () => {
  it('renders without crashing', () => {
    render(<${component.name} />);
  });
});
`;
  }
}

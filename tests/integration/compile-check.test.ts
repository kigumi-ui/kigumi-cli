/**
 * TypeScript Compile-Check Integration Tests
 *
 * PURPOSE:
 * - Verify generated components produce valid TypeScript
 * - Catch template syntax errors that result in invalid TS code
 * - Ensure all component variants (TS/JS, React/Vue) compile correctly
 *
 * STRATEGY:
 * - Generate actual components from templates
 * - Run tsc on generated code
 * - Check for compilation errors
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { execa } from 'execa';
import { getAllComponents } from '../../src/utils/registry.js';
import { generateComponent } from '../../src/utils/template.js';
import type { Framework } from '../../src/schemas/config.js';
import { createTestKigumiConfig } from '../unit/_helpers/kigumi-config.js';

// Lane-gating: when KIGUMI_MATRIX_FRAMEWORK is set (CI matrix lanes), only the
// matching framework's describe block runs. Local unset = run everything.
const MATRIX_FRAMEWORK = process.env.KIGUMI_MATRIX_FRAMEWORK;
function describeFor(framework: Framework) {
  if (!MATRIX_FRAMEWORK) return describe;
  return MATRIX_FRAMEWORK === framework ? describe : describe.skip;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _PROJECT_ROOT = path.resolve(__dirname, '../..');

interface CompileResult {
  success: boolean;
  stdout: string;
  stderr: string;
  errors: string[];
}

/**
 * Create a minimal TypeScript config for testing
 */
function createTsConfig(targetDir: string, framework: Framework): object {
  const baseConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      jsx: 'react-jsx',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      allowImportingTsExtensions: true,
      isolatedModules: true,
      noEmit: true,
      strict: false, // Relax strict mode for generated code
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
    exclude: ['node_modules', 'dist'],
  };

  // Vue-specific adjustments
  if (framework === 'vue') {
    baseConfig.compilerOptions.jsx = 'preserve';
  }

  // Angular-specific adjustments: decorators + class field semantics
  if (framework === 'angular') {
    Object.assign(baseConfig.compilerOptions, {
      experimentalDecorators: true,
      useDefineForClassFields: false,
      jsx: undefined,
    });
    baseConfig.include = ['src/**/*.ts', 'src/**/*.component.ts'];
  }

  return baseConfig;
}

/**
 * Create minimal package.json for testing
 */
function createPackageJson(framework: Framework): object {
  const reactVersion = process.env.REACT_VERSION || '18';
  const reactRange = reactVersion === '19' ? '^19.0.0' : '^18.0.0';
  const reactTypesRange = reactVersion === '19' ? '^19.0.0' : '^18.0.0';

  const basePackage = {
    name: 'test-project',
    version: '0.0.0',
    type: 'module',
    dependencies: {
      '@awesome.me/webawesome': '^3.0.0',
      clsx: '^2.0.0',
    },
  };

  if (framework === 'react') {
    return {
      ...basePackage,
      dependencies: {
        ...basePackage.dependencies,
        react: reactRange,
        'react-dom': reactRange,
      },
      devDependencies: {
        '@types/react': reactTypesRange,
        '@types/react-dom': reactTypesRange,
        typescript: '^5.0.0',
      },
    };
  }

  if (framework === 'angular') {
    return {
      ...basePackage,
      dependencies: {
        ...basePackage.dependencies,
        '@angular/common': '^21.0.0',
        '@angular/compiler': '^21.0.0',
        '@angular/core': '^21.0.0',
        '@angular/forms': '^21.0.0',
        rxjs: '^7.8.0',
        tslib: '^2.6.0',
      },
      devDependencies: {
        typescript: '^5.0.0',
      },
    };
  }

  return {
    ...basePackage,
    dependencies: {
      ...basePackage.dependencies,
      vue: '^3.0.0',
    },
    devDependencies: {
      typescript: '^5.0.0',
    },
  };
}

/**
 * Create minimal React types declarations
 */
function createReactTypes(): string {
  return `// React 18 compatibility (global JSX namespace)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

// React 19 compatibility (module-scoped JSX namespace)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

export {};
`;
}

/**
 * Install dependencies in project directory
 */
async function installDependencies(projectDir: string): Promise<void> {
  await execa('pnpm', ['install', '--no-frozen-lockfile'], {
    cwd: projectDir,
    stdio: 'inherit',
  });
}

/**
 * Run TypeScript compiler on directory
 */
async function runTypeScriptCompile(
  projectDir: string
): Promise<CompileResult> {
  try {
    const tscPath = path.join(projectDir, 'node_modules/.bin/tsc');
    const configPath = path.join(projectDir, 'tsconfig.json');

    const result = await execa(tscPath, ['--project', configPath, '--noEmit'], {
      cwd: projectDir,
      reject: false,
      all: true,
    });

    // Parse errors from output
    const errors: string[] = [];
    if (result.exitCode !== 0 && result.all) {
      const lines = result.all.split('\n');
      for (const line of lines) {
        if (line.includes('error TS')) {
          errors.push(line.trim());
        }
      }
    }

    return {
      success: result.exitCode === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      errors,
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: String(error),
      errors: [String(error)],
    };
  }
}

describe('TypeScript Compile-Check', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `kigumi-compile-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    if (testDir && (await fs.pathExists(testDir))) {
      await fs.remove(testDir);
    }
  });

  describeFor('react')('React Components', () => {
    it('should compile TypeScript variants without errors', async () => {
      const srcDir = path.join(testDir, 'src');
      const componentsDir = path.join(srcDir, 'components');
      await fs.ensureDir(componentsDir);

      // Create project structure
      await fs.writeJSON(
        path.join(testDir, 'package.json'),
        createPackageJson('react')
      );
      await fs.writeJSON(
        path.join(testDir, 'tsconfig.json'),
        createTsConfig(testDir, 'react')
      );
      await fs.writeFile(
        path.join(srcDir, 'vite-env.d.ts'),
        createReactTypes()
      );

      // Install dependencies
      await installDependencies(testDir);

      // Generate a sample of components (not all, to keep test fast)
      const components = getAllComponents();
      const sampleComponents = Object.entries(components).slice(0, 5);

      for (const [_key, component] of sampleComponents) {
        const componentDir = path.join(componentsDir, component.name);
        await fs.ensureDir(componentDir);

        // Create minimal config
        const config = createTestKigumiConfig({
          framework: 'react' as Framework,
          componentsDir: 'src/components',
        });

        // Generate TypeScript variant
        const content = await generateComponent(
          component,
          config,
          true,
          testDir
        );

        const filePath = path.join(componentDir, `${component.name}.tsx`);
        await fs.writeFile(filePath, content);
      }

      // Run TypeScript compiler
      const result = await runTypeScriptCompile(testDir);

      if (!result.success) {
        console.error('TypeScript compilation failed:');
        console.error(result.errors.slice(0, 10).join('\n'));
      }

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, 60000);

    it('should compile JavaScript variants without errors', async () => {
      const srcDir = path.join(testDir, 'src');
      const componentsDir = path.join(srcDir, 'components');
      await fs.ensureDir(componentsDir);

      // Create project structure
      await fs.writeJSON(
        path.join(testDir, 'package.json'),
        createPackageJson('react')
      );

      // Create minimal tsconfig for JS syntax check (no type checking)
      const jsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          lib: ['ES2020', 'DOM'],
          jsx: 'react-jsx',
          moduleResolution: 'bundler',
          allowJs: true,
          checkJs: false, // Only check syntax, not types
          noEmit: true,
          skipLibCheck: true,
          esModuleInterop: true,
        },
        include: ['src/**/*.js', 'src/**/*.jsx'],
        exclude: ['node_modules'],
      };

      await fs.writeJSON(path.join(testDir, 'tsconfig.json'), jsConfig);
      await fs.writeFile(
        path.join(srcDir, 'vite-env.d.ts'),
        createReactTypes()
      );

      // Install dependencies
      await installDependencies(testDir);

      // Generate a sample of components
      const components = getAllComponents();
      const sampleComponents = Object.entries(components).slice(0, 5);

      for (const [_key, component] of sampleComponents) {
        const componentDir = path.join(componentsDir, component.name);
        await fs.ensureDir(componentDir);

        // Create minimal config
        const config = createTestKigumiConfig({
          framework: 'react' as Framework,
          typescript: false,
          componentsDir: 'src/components',
        });

        // Generate JavaScript variant
        const content = await generateComponent(
          component,
          config,
          false,
          testDir
        );

        const filePath = path.join(componentDir, `${component.name}.jsx`);
        await fs.writeFile(filePath, content);
      }

      // Run TypeScript compiler (syntax check only)
      const result = await runTypeScriptCompile(testDir);

      if (!result.success) {
        console.error('JavaScript syntax check failed:');
        console.error(result.errors.slice(0, 10).join('\n'));
      }

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, 60000);
  });

  describeFor('vue')('Vue Components', () => {
    it('should compile TypeScript variants without errors', async () => {
      const srcDir = path.join(testDir, 'src');
      const componentsDir = path.join(srcDir, 'components');
      await fs.ensureDir(componentsDir);

      // Create project structure
      await fs.writeJSON(
        path.join(testDir, 'package.json'),
        createPackageJson('vue')
      );
      await fs.writeJSON(
        path.join(testDir, 'tsconfig.json'),
        createTsConfig(testDir, 'vue')
      );

      // Create Vue types
      await fs.writeFile(
        path.join(srcDir, 'vite-env.d.ts'),
        `declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}
export {};
`
      );

      // Install dependencies
      await installDependencies(testDir);

      // Generate a sample of components
      const components = getAllComponents();
      const sampleComponents = Object.entries(components).slice(0, 5);

      for (const [_key, component] of sampleComponents) {
        const componentDir = path.join(componentsDir, component.name);
        await fs.ensureDir(componentDir);

        // Create minimal config
        const config = createTestKigumiConfig({
          framework: 'vue' as Framework,
          componentsDir: 'src/components',
        });

        // Generate TypeScript variant
        const content = await generateComponent(
          component,
          config,
          true,
          testDir
        );

        const filePath = path.join(componentDir, `${component.name}.vue`);
        await fs.writeFile(filePath, content);
      }

      // Run TypeScript compiler
      const result = await runTypeScriptCompile(testDir);

      if (!result.success) {
        console.error('Vue TypeScript compilation failed:');
        console.error(result.errors.slice(0, 10).join('\n'));
      }

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, 60000);
  });

  describeFor('angular')('Angular Components', () => {
    it('should compile angular templates without errors', async () => {
      const srcDir = path.join(testDir, 'src');
      const componentsDir = path.join(srcDir, 'components');
      await fs.ensureDir(componentsDir);

      await fs.writeJSON(
        path.join(testDir, 'package.json'),
        createPackageJson('angular')
      );
      await fs.writeJSON(
        path.join(testDir, 'tsconfig.json'),
        createTsConfig(testDir, 'angular')
      );

      await installDependencies(testDir);

      const components = getAllComponents();
      const sampleComponents = Object.entries(components).slice(0, 5);

      for (const [_key, component] of sampleComponents) {
        const componentDir = path.join(componentsDir, component.name);
        await fs.ensureDir(componentDir);

        const config = createTestKigumiConfig({
          framework: 'angular' as Framework,
          componentsDir: 'src/components',
        });

        const content = await generateComponent(
          component,
          config,
          true,
          testDir
        );

        const kebab = component.name
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
          .toLowerCase();
        const filePath = path.join(componentDir, `${kebab}.component.ts`);
        await fs.writeFile(filePath, content);
      }

      const result = await runTypeScriptCompile(testDir);

      if (!result.success) {
        console.error('Angular TypeScript compilation failed:');
        console.error(result.errors.slice(0, 10).join('\n'));
      }

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, 120000);
  });

  describeFor('react')('Edge Cases', () => {
    it('should handle components with complex props', async () => {
      const srcDir = path.join(testDir, 'src');
      const componentsDir = path.join(srcDir, 'components');
      await fs.ensureDir(componentsDir);

      // Setup project
      await fs.writeJSON(
        path.join(testDir, 'package.json'),
        createPackageJson('react')
      );
      await fs.writeJSON(
        path.join(testDir, 'tsconfig.json'),
        createTsConfig(testDir, 'react')
      );
      await fs.writeFile(
        path.join(srcDir, 'vite-env.d.ts'),
        createReactTypes()
      );

      // Install dependencies
      await installDependencies(testDir);

      // Find components with complex props (multiple props)
      const components = getAllComponents();
      const complexComponent = Object.values(components).find(
        (comp) => comp.props && comp.props.length > 3
      );

      if (complexComponent) {
        const componentDir = path.join(componentsDir, complexComponent.name);
        await fs.ensureDir(componentDir);

        // Create minimal config
        const config = createTestKigumiConfig({
          framework: 'react' as Framework,
          componentsDir: 'src/components',
        });

        const content = await generateComponent(
          complexComponent,
          config,
          true,
          testDir
        );

        const filePath = path.join(
          componentDir,
          `${complexComponent.name}.tsx`
        );
        await fs.writeFile(filePath, content);

        const result = await runTypeScriptCompile(testDir);

        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    }, 60000);
  });
});

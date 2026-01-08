/**
 * React Framework Plugin
 *
 * Implements the FrameworkPlugin interface for React projects.
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
    config: any,
    component: ComponentDefinition,
    options: GenerateOptions
  ): Promise<GeneratedFile[]> {
    // Import the existing component generation logic
    const { generateComponentFromTemplate } = await import('../../utils/regenerate.js');

    // Use existing template generation system
    const files: GeneratedFile[] = [];

    const componentDir = path.join(cwd, config.componentsDir, component.name);
    const fileExtension = options.typescript ? 'tsx' : 'jsx';

    // Generate main component file
    const componentContent = await generateComponentFromTemplate(
      'react',
      component,
      config,
      options
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
          path: path.join(componentDir, `${component.name}.test.${fileExtension}`),
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
  async generateSetupFiles(cwd: string, config: any): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate webawesome.ts
    const { generateWebAwesomeSetup } = await import('../../utils/regenerate.js');
    const webAwesomeContent = await generateWebAwesomeSetup(cwd, config);

    files.push({
      path: path.join(cwd, config.utilsDir || 'src/lib', 'webawesome.ts'),
      content: webAwesomeContent,
    });

    // Generate vite-env.d.ts for TypeScript projects
    if (config.typescript) {
      const { generateViteEnvDts } = await import('../../utils/regenerate.js');
      const viteEnvContent = await generateViteEnvDts(cwd, config);

      files.push({
        path: path.join(cwd, 'src', 'vite-env.d.ts'),
        content: viteEnvContent,
      });
    }

    // Generate theme.css
    const { generateThemeCSS } = await import('../../utils/regenerate.js');
    const themeCssContent = await generateThemeCSS(config);

    files.push({
      path: path.join(cwd, config.utilsDir || 'src/lib', 'theme.css'),
      content: themeCssContent,
    });

    return files;
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
      packageManager === 'npm'
        ? ['install', ...deps]
        : ['add', ...deps];

    await execa(packageManager, installArgs, { cwd, stdio: 'inherit' });
  }

  /**
   * Validate React-specific configuration
   */
  validateConfig(config: Partial<any>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate componentsDir follows React conventions
    if (config.componentsDir && !config.componentsDir.includes('components')) {
      warnings.push(
        'React projects typically use a "components" directory. Consider using "src/components" or "src/components/ui".'
      );
    }

    // Validate utilsDir for React
    if (config.utilsDir && !['src/lib', 'src/utils'].includes(config.utilsDir)) {
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
  getTypeScriptConfig(): Partial<Record<string, any>> {
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
  private async generateStylesFile(component: ComponentDefinition): Promise<string> {
    // Use existing template system
    const templatePath = path.join(
      process.cwd(),
      'templates',
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
      process.cwd(),
      'templates',
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

/**
 * Helper function to generate component from template
 * This will be implemented to use existing template system
 */
async function generateComponentFromTemplate(
  framework: string,
  component: ComponentDefinition,
  config: any,
  options: GenerateOptions
): Promise<string> {
  // Placeholder - will integrate with existing template system
  const templatePath = path.join(
    process.cwd(),
    'templates',
    framework,
    component.name,
    `${component.name}.${options.typescript ? 'tsx' : 'jsx'}.hbs`
  );

  if (await fs.pathExists(templatePath)) {
    const Handlebars = (await import('handlebars')).default;
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);

    return template({
      component,
      config,
      typescript: options.typescript,
    });
  }

  // Fallback
  return `import React from 'react';
import './${component.name}.css';

export interface ${component.name}Props extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const ${component.name} = React.forwardRef<HTMLElement, ${component.name}Props>(
  ({ children, ...props }, ref) => {
    return (
      <${component.tagName} ref={ref} {...props}>
        {children}
      </${component.tagName}>
    );
  }
);

${component.name}.displayName = '${component.name}';
`;
}

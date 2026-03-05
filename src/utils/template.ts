/**
 * Template Utilities
 *
 * PURPOSE: Handles Handlebars template rendering for component generation.
 *
 * EXPORTS:
 * - renderTemplate() - Render a Handlebars template
 * - generateComponent() - Generate component file content
 * - generateTypeDeclaration() - Generate TypeScript declarations
 * - updateTypeDeclarations() - Update web-awesome.d.ts file
 * - updateComponentIndex() - Update barrel export file
 * - generateComponentCSS() - Generate CSS file
 * - generateComponentTest() - Generate test file
 *
 * @see AGENTS.md Rule #2 for templates-first development
 */

import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
// Note: Package name constants not directly used here - tier.ts handles the mapping
import type { ComponentDefinition } from './registry.js';
import type { KigumiConfig } from './config.js';
import { generateCSSTemplate } from './css-metadata.js';

// Register Handlebars helper to quote property names with hyphens
Handlebars.registerHelper('quoteProp', function (propName: string) {
  return propName.includes('-') ? `'${propName}'` : propName;
});

/**
 * TEMPLATE COMPILATION CACHE
 *
 * WHY: Handlebars.compile() is expensive (~2-5ms per template). When adding
 * multiple components or regenerating files, we'd compile the same template
 * repeatedly. Caching compiled templates gives 2-5x performance improvement.
 *
 * Cache key: absolute template path
 * Cache value: compiled Handlebars template function
 */
const templateCache = new Map<string, Handlebars.TemplateDelegate>();

/**
 * Get a compiled template from cache or compile and cache it
 * @internal
 */
async function getCompiledTemplate(
  templatePath: string
): Promise<Handlebars.TemplateDelegate> {
  const cached = templateCache.get(templatePath);
  if (cached) {
    return cached;
  }

  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const compiled = Handlebars.compile(templateContent);
  templateCache.set(templatePath, compiled);
  return compiled;
}

/**
 * Clear the template cache (useful for testing)
 * @internal
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

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

// Template directory is in the package root
const PACKAGE_ROOT = findPackageRoot(__dirname);
const TEMPLATES_DIR = path.join(PACKAGE_ROOT, 'templates');

interface TemplateContext {
  name: string;
  tagName: string;
  description: string;
  importPath: string;
  props: Array<{
    name: string;
    type: string;
    values?: string[];
    default?: string;
    description?: string;
    required?: boolean;
  }>;
}

/**
 * Get the template path for a given framework
 */
export function getTemplatePath(
  framework: string,
  templateName: string
): string {
  return path.join(TEMPLATES_DIR, framework, templateName);
}

/**
 * Render a template with the given context
 *
 * Uses cached compiled templates for performance (2-5x faster on repeated calls)
 */
export async function renderTemplate(
  templatePath: string,
  context: TemplateContext
): Promise<string> {
  const template = await getCompiledTemplate(templatePath);
  return template(context);
}

/**
 * Build template context from component definition
 */
export function buildTemplateContext(
  component: ComponentDefinition
): TemplateContext {
  return {
    name: component.name,
    tagName: component.tagName,
    description: component.description,
    importPath: component.importPath,
    props: component.props,
  };
}

/**
 * Get file extension for component based on framework and typescript setting
 */
function getComponentExtension(framework: string, typescript: boolean): string {
  if (framework === 'vue') {
    return typescript ? 'vue' : 'js.vue';
  }
  return typescript ? 'tsx' : 'jsx';
}

/**
 * Get test file extension based on framework and typescript setting
 */
function getTestExtension(framework: string, typescript: boolean): string {
  if (framework === 'vue') {
    return typescript ? 'test.ts' : 'test.js';
  }
  return typescript ? 'test.tsx' : 'test.jsx';
}

/**
 * Generate component file content
 *
 * @param component - Component definition from registry
 * @param config - Kigumi configuration
 * @param typescript - Whether to generate TypeScript (.tsx) or JavaScript (.jsx)
 * @returns Generated component code
 */
export async function generateComponent(
  component: ComponentDefinition,
  config: KigumiConfig,
  typescript: boolean = true
): Promise<string> {
  // Build context with correct import path based on tier
  const { detectTierSync, getWebAwesomePackage } = await import('./tier.js');
  const tier = detectTierSync(process.cwd());
  const packageName = getWebAwesomePackage(tier);

  // Replace package name in import path
  // WHY: Component definitions use free package by default, but we need to
  // substitute with the correct package based on the user's tier
  const importPath = component.importPath.replace(
    /^@awesome\.me\/(webawesome|webawesome-pro)/,
    packageName
  );

  const context = {
    ...buildTemplateContext(component),
    importPath,
  };

  // Use component-specific template if it exists
  const fileExtension = getComponentExtension(config.framework, typescript);
  const componentTemplatePath = path.join(
    TEMPLATES_DIR,
    config.framework,
    component.name,
    `${component.name}.${fileExtension}.hbs`
  );

  const templatePath = (await fs.pathExists(componentTemplatePath))
    ? componentTemplatePath
    : getTemplatePath(config.framework, `component.${fileExtension}.hbs`);

  return renderTemplate(templatePath, context);
}

/**
 * Generate TypeScript declaration for a component
 */
export function generateTypeDeclaration(
  component: ComponentDefinition
): string {
  const propTypes = component.props
    .map((prop) => {
      let type = prop.type;
      if (prop.values && prop.values.length > 0) {
        type = prop.values.map((v) => `'${v}'`).join(' | ');
      }
      // Quote property names that contain hyphens
      const propName = prop.name.includes('-') ? `'${prop.name}'` : prop.name;
      return `      ${propName}?: ${type};`;
    })
    .join('\n');

  return `      '${component.tagName}': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
      class?: string;
${propTypes}
        },
        HTMLElement
      >;`;
}

/**
 * Update or create TypeScript declarations file
 */
export async function updateTypeDeclarations(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): Promise<void> {
  // For React, we need to update the web-awesome.d.ts file
  if (config.framework !== 'react' || !config.typescript) {
    return;
  }

  const typesDir = path.join(cwd, 'src', 'types');
  const typesFile = path.join(typesDir, 'web-awesome.d.ts');

  await fs.ensureDir(typesDir);

  let content = '';

  if (await fs.pathExists(typesFile)) {
    content = await fs.readFile(typesFile, 'utf-8');
  } else {
    // Create new declarations file
    content = `/**
 * TypeScript declarations for Web Awesome components
 * This file provides type safety for Web Awesome custom elements in React
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
    }
  }
}

export {};
`;
  }

  // Check if component already declared
  if (content.includes(`'${component.tagName}'`)) {
    // Component already declared, skip or update
    return;
  }

  // Insert the new declaration inside IntrinsicElements interface
  const declaration = generateTypeDeclaration(component);

  // Find the IntrinsicElements interface
  const interfaceMatch = content.indexOf('interface IntrinsicElements {');
  if (interfaceMatch === -1) {
    throw new Error(
      'Could not find IntrinsicElements interface in declarations file'
    );
  }

  // BRACE COUNTING ALGORITHM
  // WHY: We need to find the exact closing brace of IntrinsicElements interface,
  // which may contain nested interfaces/types. Simple string search for '}' won't work.
  //
  // HOW: Start with braceCount=1 (we're inside the interface after '{').
  // Increment on '{', decrement on '}'. When braceCount reaches 0, we've found
  // the matching closing brace for the interface.
  //
  // Example structure:
  //   interface IntrinsicElements {  <-- braceCount=1
  //     'wa-button': { ... }         <-- braceCount goes to 2, then back to 1
  //     'wa-input': { ... }
  //   }                              <-- braceCount=0, this is our insertPoint
  const searchStart = interfaceMatch + 'interface IntrinsicElements {'.length;
  let braceCount = 1;
  let insertPoint = searchStart;

  for (let i = searchStart; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        insertPoint = i;
        break;
      }
    }
  }

  // Insert the declaration before the closing brace with proper indentation
  content =
    content.slice(0, insertPoint) +
    '\n' +
    declaration +
    '\n' +
    content.slice(insertPoint);

  await fs.writeFile(typesFile, content);
}

/**
 * Update component index file (barrel export)
 */
export async function updateComponentIndex(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): Promise<void> {
  const indexExt = config.typescript ? 'ts' : 'js';
  const indexPath = path.join(cwd, config.componentsDir, `index.${indexExt}`);

  let content = '';
  if (await fs.pathExists(indexPath)) {
    content = await fs.readFile(indexPath, 'utf-8');
  }

  // Component is now in its own directory
  // Vue uses default exports from .vue files, React uses named exports
  const ext =
    config.framework === 'vue' ? (config.typescript ? '.vue' : '.js.vue') : '';
  const exportStatement =
    config.framework === 'vue'
      ? `export { default as ${component.name} } from './${component.name}/${component.name}${ext}';\n`
      : `export * from './${component.name}/${component.name}';\n`;

  // Check if already exported
  if (content.includes(exportStatement.trim())) {
    return;
  }

  content += exportStatement;
  await fs.writeFile(indexPath, content);
}

/**
 * Generate CSS file for component
 */
export async function generateComponentCSS(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): Promise<void> {
  const componentDir = path.join(cwd, config.componentsDir, component.name);
  const cssPath = path.join(componentDir, `${component.name}.css`);

  await fs.ensureDir(componentDir);

  // Use component-specific CSS template if it exists
  const componentCSSTemplatePath = path.join(
    TEMPLATES_DIR,
    config.framework,
    component.name,
    `${component.name}.css.hbs`
  );

  let cssContent: string;
  if (await fs.pathExists(componentCSSTemplatePath)) {
    cssContent = await renderTemplate(
      componentCSSTemplatePath,
      buildTemplateContext(component)
    );
  } else {
    cssContent = generateCSSTemplate(component.name);
  }

  await fs.writeFile(cssPath, cssContent);
}

/**
 * Generate unit test for component
 */
export async function generateComponentTest(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): Promise<void> {
  const componentDir = path.join(cwd, config.componentsDir, component.name);
  const ext = getTestExtension(config.framework, config.typescript);
  const testPath = path.join(componentDir, `${component.name}.${ext}`);

  await fs.ensureDir(componentDir);

  // Use component-specific test template if it exists
  const componentTestTemplatePath = path.join(
    TEMPLATES_DIR,
    config.framework,
    component.name,
    `${component.name}.${ext}.hbs`
  );

  let testContent: string;
  if (await fs.pathExists(componentTestTemplatePath)) {
    testContent = await renderTemplate(
      componentTestTemplatePath,
      buildTemplateContext(component)
    );
  } else {
    // Fallback to generic test
    if (config.framework === 'vue') {
      const vueExt = config.typescript ? '.vue' : '.js.vue';
      testContent = `import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import ${component.name} from './${component.name}${vueExt}';

describe('${component.name}', () => {
  it('renders without crashing', () => {
    const { container } = mount(${component.name});
    expect(container.querySelector('${component.tagName}')).toBeTruthy();
  });
});
`;
    } else {
      testContent = `import { render, screen } from '@testing-library/react';
import { ${component.name} } from './${component.name}';

describe('${component.name}', () => {
  it('renders without crashing', () => {
    render(<${component.name}>${component.name}</${component.name}>);
    expect(screen.getByText('${component.name}')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <${component.name} className="custom-class">Test</${component.name}>
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
`;
    }
  }

  await fs.writeFile(testPath, testContent);
}

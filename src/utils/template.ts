import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ComponentDefinition } from './registry.js';
import type { KigumiConfig } from './config.js';
import { generateCSSTemplate } from './css-metadata.js';

// Register Handlebars helper to quote property names with hyphens
Handlebars.registerHelper('quoteProp', function (propName: string) {
  return propName.includes('-') ? `'${propName}'` : propName;
});

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
export function getTemplatePath(framework: string, templateName: string): string {
  return path.join(TEMPLATES_DIR, framework, templateName);
}

/**
 * Render a template with the given context
 */
export async function renderTemplate(
  templatePath: string,
  context: TemplateContext
): Promise<string> {
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);
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
 * Generate component file content
 */
export async function generateComponent(
  component: ComponentDefinition,
  config: KigumiConfig
): Promise<string> {
  // Build context with correct import path based on tier
  const tier = config.webAwesome?.tier || 'free';
  const packageName = tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';

  // Replace package name in import path
  const importPath = component.importPath.replace(
    /^@awesome\.me\/(webawesome|webawesome-pro)/,
    packageName
  );

  const context = {
    ...buildTemplateContext(component),
    importPath,
  };

  // Use component-specific template if it exists
  const componentTemplatePath = path.join(
    TEMPLATES_DIR,
    config.framework,
    component.name,
    `${component.name}.tsx.hbs`
  );

  const templatePath = (await fs.pathExists(componentTemplatePath))
    ? componentTemplatePath
    : getTemplatePath(config.framework, 'component.tsx.hbs');

  return renderTemplate(templatePath, context);
}

/**
 * Generate TypeScript declaration for a component
 */
export function generateTypeDeclaration(component: ComponentDefinition): string {
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

  return `    '${component.tagName}': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
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

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
    }
  }
}
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
    throw new Error('Could not find IntrinsicElements interface in declarations file');
  }

  // Find the closing brace of the IntrinsicElements interface
  // Start searching after the opening brace
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
  const indexPath = path.join(cwd, config.componentsDir, 'index.ts');

  let content = '';
  if (await fs.pathExists(indexPath)) {
    content = await fs.readFile(indexPath, 'utf-8');
  }

  // Component is now in its own directory
  const exportStatement = `export * from './${component.name}/${component.name}';\n`;

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
    cssContent = await renderTemplate(componentCSSTemplatePath, buildTemplateContext(component));
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
  const ext = config.typescript ? 'tsx' : 'jsx';
  const testPath = path.join(componentDir, `${component.name}.test.${ext}`);

  await fs.ensureDir(componentDir);

  // Use component-specific test template if it exists
  const componentTestTemplatePath = path.join(
    TEMPLATES_DIR,
    config.framework,
    component.name,
    `${component.name}.test.${ext}.hbs`
  );

  let testContent: string;
  if (await fs.pathExists(componentTestTemplatePath)) {
    testContent = await renderTemplate(componentTestTemplatePath, buildTemplateContext(component));
  } else {
    // Fallback to generic test
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

  await fs.writeFile(testPath, testContent);
}

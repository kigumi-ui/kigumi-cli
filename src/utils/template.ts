import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ComponentDefinition } from './registry.js';
import type { KigumiConfig } from './config.js';

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
  cssVars: string[];
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
    cssVars: component.cssVars,
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

  const templatePath = getTemplatePath(config.framework, 'component.tsx.hbs');

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

  const exportStatement = `export * from './${component.name}';\n`;

  // Check if already exported
  if (content.includes(exportStatement.trim())) {
    return;
  }

  content += exportStatement;
  await fs.writeFile(indexPath, content);
}

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
 * - generateComponentCSSContent() - Generate CSS content string
 * - generateComponentCSS() - Generate CSS file (content + write)
 * - generateComponentTestContent() - Generate test content string
 * - generateComponentTest() - Generate test file (content + write)
 * - getComponentCSSPath() - Get CSS file path for a component
 * - getComponentTestPath() - Get test file path for a component
 * - getComponentExtension() - Get component file extension for framework
 * - getTestExtension() - Get test file extension for framework
 * - getFileBaseName() - Get file base name (kebab for Angular, PascalCase otherwise)
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
import type { Tier } from './tier.js';
import { generateCSSTemplate } from './css-metadata.js';
import { toKebabCase } from './naming.js';
import { isNextProject, detectNextRouter } from './detect-framework.js';

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
  kebabName: string;
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
    kebabName: toKebabCase(component.name),
    tagName: component.tagName,
    description: component.description,
    importPath: component.importPath,
    props: component.props,
  };
}

/**
 * Get file extension for component based on framework and typescript setting
 */
export function getComponentExtension(
  framework: string,
  typescript: boolean
): string {
  if (framework === 'angular') {
    return 'component.ts';
  }
  if (framework === 'vue') {
    return typescript ? 'vue' : 'js.vue';
  }
  return typescript ? 'tsx' : 'jsx';
}

/**
 * Get test file extension based on framework and typescript setting
 */
export function getTestExtension(
  framework: string,
  typescript: boolean
): string {
  if (framework === 'angular') {
    return 'component.spec.ts';
  }
  if (framework === 'vue') {
    return typescript ? 'test.ts' : 'test.js';
  }
  return typescript ? 'test.tsx' : 'test.jsx';
}

/**
 * Get the base file name for a component (Angular uses kebab-case, others use PascalCase)
 */
export function getFileBaseName(
  framework: string,
  componentName: string
): string {
  return framework === 'angular' ? toKebabCase(componentName) : componentName;
}

/**
 * Generate component file content
 *
 * @param component - Component definition from registry
 * @param config - Kigumi configuration
 * @param typescript - Whether to generate TypeScript (.tsx) or JavaScript (.jsx)
 * @param cwd - Working directory (used for the tier fallback)
 * @param tier - Pre-resolved tier. Callers that already know the tier should
 *   pass it through to avoid redundant disk I/O. Callers without
 *   a tier in context (update/diff commands, framework plugins) may omit it;
 *   detection falls back to `detectTierSync(cwd)`.
 * @returns Generated component code
 */
export async function generateComponent(
  component: ComponentDefinition,
  config: KigumiConfig,
  typescript: boolean = true,
  cwd: string = process.cwd(),
  tier?: Tier
): Promise<string> {
  // Build context with correct import path based on tier
  const { detectTierSync, getWebAwesomePackage } = await import('./tier.js');
  const resolvedTier = tier ?? detectTierSync(cwd);
  const packageName = getWebAwesomePackage(resolvedTier);

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
  // Angular uses kebab-case file names in templates
  const templateFileName =
    config.framework === 'angular'
      ? toKebabCase(component.name)
      : component.name;
  const componentTemplatePath = path.join(
    TEMPLATES_DIR,
    config.framework,
    component.name,
    `${templateFileName}.${fileExtension}.hbs`
  );

  const templatePath = (await fs.pathExists(componentTemplatePath))
    ? componentTemplatePath
    : getTemplatePath(config.framework, `component.${fileExtension}.hbs`);

  const rendered = await renderTemplate(templatePath, context);

  // Next-specific post-render transforms for React wrappers.
  if (config.framework !== 'react' || !(await isNextProject(cwd))) {
    return rendered;
  }

  const router = await detectNextRouter(cwd);
  let output = rendered;

  // Pages Router rejects side-effect global CSS imports from any file other
  // than pages/_app.tsx (including transitively via components/lib). Strip
  // the per-component `import './<Name>.css';` line from the generated .tsx
  // so the build doesn't fail. Users who customize the stub CSS manually
  // import it from pages/_app.tsx — documented in the Upgrading guide.
  if (router === 'pages') {
    const cssImportPattern = new RegExp(
      `^\\s*import\\s+['"]\\./${escapeRegex(component.name)}\\.css['"];\\s*\\n`,
      'm'
    );
    output = output.replace(cssImportPattern, '');
  }

  // Every React wrapper in Next is a Client Module (App Router needs it;
  // Pages Router treats the directive as a harmless top-level string).
  return `'use client';\n\n${output}`;
}

/**
 * Escape a string for safe use inside a RegExp.
 * @internal
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  let content: string;

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
  // Vue uses default exports from .vue files, React uses named exports,
  // Angular uses named class exports with Component suffix
  let exportStatement: string;
  if (config.framework === 'angular') {
    const kebabName = toKebabCase(component.name);
    exportStatement = `export { ${component.name}Component } from './${component.name}/${kebabName}.component';\n`;
  } else if (config.framework === 'vue') {
    const ext = config.typescript ? '.vue' : '.js.vue';
    exportStatement = `export { default as ${component.name} } from './${component.name}/${component.name}${ext}';\n`;
  } else {
    exportStatement = `export * from './${component.name}/${component.name}';\n`;
  }

  // Check if already exported
  if (content.includes(exportStatement.trim())) {
    return;
  }

  const lines = content.split('\n');
  const exportLines = lines.filter((line) => line.startsWith('export '));
  const nonExportLines = lines.filter(
    (line) => line !== '' && !line.startsWith('export ')
  );
  exportLines.push(exportStatement.trimEnd());
  exportLines.sort();

  const sorted = [...nonExportLines, ...exportLines].join('\n') + '\n';
  await fs.writeFile(indexPath, sorted);
}

/**
 * Get the CSS file path for a component
 */
export function getComponentCSSPath(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): string {
  const componentDir = path.join(cwd, config.componentsDir, component.name);
  if (config.framework === 'angular') {
    return path.join(
      componentDir,
      `${toKebabCase(component.name)}.component.css`
    );
  }
  return path.join(componentDir, `${component.name}.css`);
}

/**
 * Generate CSS content string for a component (without writing to disk)
 */
export async function generateComponentCSSContent(
  component: ComponentDefinition,
  config: KigumiConfig
): Promise<string> {
  const cssFileName =
    config.framework === 'angular'
      ? `${toKebabCase(component.name)}.component.css`
      : `${component.name}.css`;
  const componentCSSTemplatePath = path.join(
    TEMPLATES_DIR,
    config.framework,
    component.name,
    `${cssFileName}.hbs`
  );

  if (await fs.pathExists(componentCSSTemplatePath)) {
    return renderTemplate(
      componentCSSTemplatePath,
      buildTemplateContext(component)
    );
  }
  return generateCSSTemplate(component.name);
}

/**
 * Generate CSS file for component (generates content + writes to disk)
 */
export async function generateComponentCSS(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): Promise<void> {
  const cssPath = getComponentCSSPath(component, config, cwd);
  await fs.ensureDir(path.dirname(cssPath));
  const cssContent = await generateComponentCSSContent(component, config);
  await fs.writeFile(cssPath, cssContent);
}

/**
 * Get the test file path for a component
 */
export function getComponentTestPath(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): string {
  const componentDir = path.join(cwd, config.componentsDir, component.name);
  const ext = getTestExtension(config.framework, config.typescript);
  const fileName =
    config.framework === 'angular'
      ? toKebabCase(component.name)
      : component.name;
  return path.join(componentDir, `${fileName}.${ext}`);
}

/**
 * Generate test content string for a component (without writing to disk)
 */
export async function generateComponentTestContent(
  component: ComponentDefinition,
  config: KigumiConfig
): Promise<string> {
  const ext = getTestExtension(config.framework, config.typescript);

  const componentTestTemplatePath = path.join(
    TEMPLATES_DIR,
    config.framework,
    component.name,
    `${component.name}.${ext}.hbs`
  );

  if (await fs.pathExists(componentTestTemplatePath)) {
    return renderTemplate(
      componentTestTemplatePath,
      buildTemplateContext(component)
    );
  }

  // Fallback to generic test
  if (config.framework === 'angular') {
    const kebabName = toKebabCase(component.name);
    return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${component.name}Component } from './${kebabName}.component';

describe('${component.name}Component', () => {
  let component: ${component.name}Component;
  let fixture: ComponentFixture<${component.name}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${component.name}Component],
    }).compileComponents();

    fixture = TestBed.createComponent(${component.name}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('${component.tagName}');
    expect(el).toBeTruthy();
  });
});
`;
  }

  if (config.framework === 'vue') {
    const vueExt = config.typescript ? '.vue' : '.js.vue';
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

  return `import { render, screen } from '@testing-library/react';
import { ${component.name} } from './${component.name}';

describe('${component.name}', () => {
  it('renders without crashing', () => {
    render(<${component.name}>${component.name}</${component.name}>);
    expect(screen.getByText('${component.name}')).toBeInTheDocument();
  });

  it('applies custom class', () => {
    const { container } = render(
      <${component.name} className="custom-class">Test</${component.name}>
    );
    const el = container.querySelector('${component.tagName}');
    expect(el?.className).toContain('custom-class');
  });
});
`;
}

/**
 * Generate unit test for component (generates content + writes to disk)
 */
export async function generateComponentTest(
  component: ComponentDefinition,
  config: KigumiConfig,
  cwd: string
): Promise<void> {
  const testPath = getComponentTestPath(component, config, cwd);
  await fs.ensureDir(path.dirname(testPath));
  const testContent = await generateComponentTestContent(component, config);
  await fs.writeFile(testPath, testContent);
}

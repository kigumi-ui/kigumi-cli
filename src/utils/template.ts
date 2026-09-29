/**
 * Template Utilities
 *
 * PURPOSE: Materializes per-component framework templates into project files.
 *
 * Templates on disk are real `.tsx` / `.jsx` / `.vue` / `.component.ts` /
 * `.css` files. The only runtime substitution is the tier swap from
 * `@awesome.me/webawesome` to `@awesome.me/webawesome-pro`. See
 * `materializeTemplate` for the regex.
 *
 * EXPORTS:
 * - materializeTemplate() - Read a template file and apply tier substitution
 * - generateComponent() - Generate component file content
 * - updateComponentIndex() - Update barrel export file
 * - generateComponentCSSContent() - Generate CSS content string
 * - generateComponentCSS() - Generate CSS file (content + write)
 * - getComponentCSSPath() - Get CSS file path for a component
 * - getComponentExtension() - Get component file extension for framework
 * - getFileBaseName() - Get file base name (kebab for Angular, PascalCase otherwise)
 * - getTemplateFileNames() - The files one committed Template directory holds
 *
 * @see AGENTS.md Rule #1 for templates-first development
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { WEB_AWESOME_FREE_PACKAGE } from '../constants.js';
import type { ComponentDefinition } from './registry.js';
import type { KigumiConfig } from './config.js';
import type { Framework } from '../schemas/config.js';
import { InternalInvariantError } from '../errors/index.js';
import type { Tier } from './tier.js';
import { toKebabCase } from './naming.js';
import {
  isNextProject,
  detectNextRouter,
  type NextRouter,
} from './detect-framework.js';

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
  throw new InternalInvariantError('Could not find package.json');
}

const PACKAGE_ROOT = findPackageRoot(__dirname);
const TEMPLATES_DIR = path.join(PACKAGE_ROOT, 'templates');

/**
 * Non-anchored, global tier-swap regex. Templates ship with the free package
 * baked in as the canonical baseline; this rewrites every occurrence to the
 * Pro package when generating for a Pro-tier project. The negative lookahead
 * keeps `webawesome-pro` from being matched and re-doubled.
 *
 * Why global: Angular `.component.ts` templates contain two import
 * statements per file (one `import type`, one dynamic `import()`); the
 * substitution must hit both.
 */
const TIER_REWRITE_PATTERN = /@awesome\.me\/webawesome(?!-pro)/g;

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
 * Read a template file and apply the tier substitution.
 *
 * For Free-tier projects this is a verbatim file read — `WEB_AWESOME_FREE_PACKAGE`
 * is the canonical baseline. For Pro-tier projects every occurrence of the
 * free package is rewritten to the Pro package name.
 */
export async function materializeTemplate(
  templatePath: string,
  packageName: string
): Promise<string> {
  const content = await fs.readFile(templatePath, 'utf-8');
  if (packageName === WEB_AWESOME_FREE_PACKAGE) {
    return content;
  }
  return content.replaceAll(TIER_REWRITE_PATTERN, packageName);
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
 * Get the base file name for a component (Angular uses kebab-case, others use PascalCase)
 */
export function getFileBaseName(
  framework: string,
  componentName: string
): string {
  return framework === 'angular' ? toKebabCase(componentName) : componentName;
}

/**
 * The files one committed Template directory holds: the component in every
 * language variant the framework ships (Angular is TypeScript-only) plus its
 * CSS. `kigumi add` copies from this set and nothing else. There is no
 * per-Template test: the function harness in this repo is the proof
 * (issue #80), so a user's tests are their own.
 */
export function getTemplateFileNames(
  framework: Framework,
  componentName: string
): string[] {
  const baseName = getFileBaseName(framework, componentName);
  const languages = framework === 'angular' ? [true] : [true, false];
  const css =
    framework === 'angular'
      ? `${baseName}.component.css`
      : `${componentName}.css`;
  return [
    ...languages.map(
      (typescript) =>
        `${baseName}.${getComponentExtension(framework, typescript)}`
    ),
    css,
  ];
}

/**
 * Generate component file content
 *
 * @param component - Component definition from registry
 * @param config - Kigumi configuration
 * @param typescript - Whether to generate TypeScript (.tsx) or JavaScript (.jsx)
 * @param cwd - Working directory (used for the Next fallback)
 * @param tier - The project's tier. Required: commands detect it once,
 *   before generating or writing anything, and pass it down (issue #121).
 * @param isNext - Pre-resolved Next-project flag. Same contract as `tier`:
 *   pass through when known, fall back to `isNextProject(cwd)` otherwise.
 * @param nextRouter - Pre-resolved Next router. Ignored unless `isNext` is
 *   true. Callers that already detected the router at the command entry
 *   should pass it through to avoid repeating the filesystem probe.
 * @returns Generated component code
 */
export async function generateComponent(
  component: ComponentDefinition,
  config: KigumiConfig,
  typescript: boolean,
  cwd: string,
  tier: Tier,
  isNext?: boolean,
  nextRouter?: NextRouter
): Promise<string> {
  const { getWebAwesomePackage } = await import('./tier.js');
  const packageName = getWebAwesomePackage(tier);

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
    `${templateFileName}.${fileExtension}`
  );

  const templatePath = (await fs.pathExists(componentTemplatePath))
    ? componentTemplatePath
    : getTemplatePath(config.framework, `component.${fileExtension}`);

  const rendered = await materializeTemplate(templatePath, packageName);

  // Next-specific post-render transforms for React wrappers.
  // Prefer caller-provided context so a `kigumi add --all` or update sweep
  // does not repeat the project-type probe for every component.
  if (config.framework !== 'react') {
    return rendered;
  }
  const resolvedIsNext = isNext ?? (await isNextProject(cwd));
  if (!resolvedIsNext) {
    return rendered;
  }

  const router = nextRouter ?? (await detectNextRouter(cwd));
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
 * Generate CSS content string for a component (without writing to disk).
 *
 * CSS templates ship as `.css` files with no substitution.
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
    cssFileName
  );

  if (await fs.pathExists(componentCSSTemplatePath)) {
    return fs.readFile(componentCSSTemplatePath, 'utf-8');
  }
  throw new InternalInvariantError(
    `Missing CSS template for ${config.framework}/${component.name} at ${componentCSSTemplatePath}`,
    { framework: config.framework, component: component.name }
  );
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

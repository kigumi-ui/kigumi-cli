/**
 * Project Configuration
 *
 * Automatically configures Vite and TypeScript projects for Kigumi.
 * Only adds necessary path aliases - keeps Vite's defaults intact.
 */

import fs from 'fs-extra';
import path from 'path';
import { readJSONWithComments } from './json.js';
import type { OutputInterface } from '../output/types.js';

/**
 * TSConfig compiler options that we manage
 */
interface TSConfigCompilerOptions {
  baseUrl?: string;
  paths?: Record<string, string[]>;
  [key: string]: unknown;
}

interface TSConfig {
  compilerOptions?: TSConfigCompilerOptions;
  [key: string]: unknown;
}

/**
 * Configure Vite path aliases
 * Modifies vite.config.ts/js to add resolve.alias for '@' → './src'
 */
export async function configureVitePathAliases(
  cwd: string,
  output: OutputInterface
): Promise<boolean> {
  const viteConfigTs = path.join(cwd, 'vite.config.ts');
  const viteConfigJs = path.join(cwd, 'vite.config.js');

  let configPath: string | null = null;
  if (await fs.pathExists(viteConfigTs)) {
    configPath = viteConfigTs;
  } else if (await fs.pathExists(viteConfigJs)) {
    configPath = viteConfigJs;
  }

  if (!configPath) {
    return false;
  }

  let content = await fs.readFile(configPath, 'utf-8');

  // Check if already configured
  if (content.includes('alias:') && content.includes("'@'")) {
    return false;
  }

  // Detect ESM project (type: "module" in package.json)
  const pkgJsonPath = path.join(cwd, 'package.json');
  const isESM =
    (await fs.pathExists(pkgJsonPath)) &&
    (await fs.readJSON(pkgJsonPath)).type === 'module';

  // Add path and fileURLToPath imports if missing
  if (
    !content.includes("import path from 'path'") &&
    !content.includes('import path from "path"')
  ) {
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      if (isESM) {
        lines.splice(
          lastImportIndex + 1,
          0,
          "import path from 'path';",
          "import { fileURLToPath } from 'url';"
        );
      } else {
        lines.splice(lastImportIndex + 1, 0, "import path from 'path';");
      }
      content = lines.join('\n');
    }
  } else if (
    isESM &&
    !content.includes('fileURLToPath') &&
    !content.includes('import.meta.dirname')
  ) {
    // path already imported but fileURLToPath missing in ESM
    const lines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) lastImportIndex = i;
    }
    if (lastImportIndex >= 0) {
      lines.splice(
        lastImportIndex + 1,
        0,
        "import { fileURLToPath } from 'url';"
      );
      content = lines.join('\n');
    }
  }

  // Check if resolve already exists
  if (content.includes('resolve:')) {
    return false;
  }

  // Use ESM-safe dirname derivation
  const dirnameExpr = isESM
    ? 'path.dirname(fileURLToPath(import.meta.url))'
    : '__dirname';

  // Insert resolve config after 'export default defineConfig({'
  const resolveConfig = `
  resolve: {
    alias: {
      '@': path.resolve(${dirnameExpr}, './src'),
    },
  },`;

  const defineConfigMatch = content.match(/export default defineConfig\(\{/);

  if (!defineConfigMatch) {
    output.warn('Could not parse vite.config, skipping path alias config');
    return false;
  }

  content = content.replace(
    /export default defineConfig\(\{/,
    `export default defineConfig({${resolveConfig}`
  );

  await fs.writeFile(configPath, content);
  return true;
}

/**
 * Configure TypeScript path aliases for Vite projects
 *
 * This function only adds path aliases (@/* -> ./src/*).
 * All other tsconfig settings (verbatimModuleSyntax, etc.) are kept as-is.
 *
 * Kigumi uses named React imports which work with Vite 6's defaults.
 */
export async function configureTSConfig(
  cwd: string,
  _output: OutputInterface
): Promise<boolean> {
  const tsconfigAppPath = path.join(cwd, 'tsconfig.app.json');

  if (!(await fs.pathExists(tsconfigAppPath))) {
    return false;
  }

  const tsconfig = (await readJSONWithComments(tsconfigAppPath)) as TSConfig;
  let modified = false;

  // Initialize compilerOptions if missing
  tsconfig.compilerOptions = tsconfig.compilerOptions || {};

  // Add path aliases if not present
  if (!tsconfig.compilerOptions.paths?.['@/*']) {
    tsconfig.compilerOptions.baseUrl = tsconfig.compilerOptions.baseUrl || '.';
    tsconfig.compilerOptions.paths = {
      ...tsconfig.compilerOptions.paths,
      '@/*': ['./src/*'],
    };
    modified = true;
  }

  if (modified) {
    await fs.writeJSON(tsconfigAppPath, tsconfig, { spaces: 2 });
  }

  return modified;
}

/**
 * Configure Vue custom element recognition in vite.config.ts
 *
 * Adds `isCustomElement: tag => tag.startsWith('wa-')` to the vue() plugin
 * so Vue treats `<wa-*>` tags as custom elements instead of Vue components.
 */
export async function configureVueCustomElements(
  cwd: string,
  output: OutputInterface
): Promise<boolean> {
  const viteConfigTs = path.join(cwd, 'vite.config.ts');
  const viteConfigJs = path.join(cwd, 'vite.config.js');

  let configPath: string | null = null;
  if (await fs.pathExists(viteConfigTs)) {
    configPath = viteConfigTs;
  } else if (await fs.pathExists(viteConfigJs)) {
    configPath = viteConfigJs;
  }

  if (!configPath) {
    return false;
  }

  let content = await fs.readFile(configPath, 'utf-8');

  // Already configured
  if (content.includes('isCustomElement')) {
    return false;
  }

  // Replace bare `vue()` with full custom element config
  // Handles: vue(), vue({}), vue({ ... })
  const bareVueMatch = content.match(/vue\(\s*\)/);
  if (bareVueMatch) {
    content = content.replace(
      /vue\(\s*\)/,
      `vue({\n    template: {\n      compilerOptions: {\n        isCustomElement: (tag: string) => tag.startsWith('wa-'),\n      },\n    },\n  })`
    );
    await fs.writeFile(configPath, content);
    return true;
  }

  // vue() with existing options object — inject template config
  const vueWithOptionsMatch = content.match(/vue\(\s*\{/);
  if (vueWithOptionsMatch) {
    content = content.replace(
      /vue\(\s*\{/,
      `vue({\n    template: {\n      compilerOptions: {\n        isCustomElement: (tag: string) => tag.startsWith('wa-'),\n      },\n    },`
    );
    await fs.writeFile(configPath, content);
    return true;
  }

  output.warn(
    'Could not parse vue() plugin in vite.config, skipping isCustomElement config'
  );
  return false;
}

/**
 * Add Web Awesome Vue type definitions to tsconfig
 *
 * Adds the WA Vue types so TypeScript recognizes `<wa-*>` elements
 * in Vue templates with proper prop/event typing.
 */
export async function configureVueTypes(
  cwd: string,
  _output: OutputInterface,
  waPackage: string
): Promise<boolean> {
  const envDtsPath = path.join(cwd, 'src', 'env.d.ts');
  const vueTypePath = `${waPackage}/dist/types/vue`;
  const referenceDirective = `/// <reference types="${vueTypePath}" />`;

  if (await fs.pathExists(envDtsPath)) {
    const content = await fs.readFile(envDtsPath, 'utf-8');
    if (content.includes(vueTypePath)) {
      return false;
    }
    // Remove old WA type references before adding new one
    const cleaned = content
      .split('\n')
      .filter(
        (line) =>
          !line.includes('@awesome.me/') || !line.includes('/dist/types/vue')
      )
      .join('\n');
    await fs.writeFile(envDtsPath, `${referenceDirective}\n${cleaned}`);
  } else {
    await fs.writeFile(
      envDtsPath,
      `/// <reference types="vite/client" />\n${referenceDirective}\n`
    );
  }

  // Clean up stale types entries from tsconfig.app.json if present
  const tsconfigAppPath = path.join(cwd, 'tsconfig.app.json');
  if (await fs.pathExists(tsconfigAppPath)) {
    const tsconfig = (await readJSONWithComments(tsconfigAppPath)) as TSConfig;
    const existingTypes = (tsconfig.compilerOptions as Record<string, unknown>)
      ?.types as string[] | undefined;
    if (
      existingTypes?.some(
        (t) => t.includes('@awesome.me/') && t.includes('/dist/types/vue')
      )
    ) {
      const filtered = existingTypes.filter(
        (t) => !t.includes('@awesome.me/') || !t.includes('/dist/types/vue')
      );
      if (filtered.length === 0) {
        delete (tsconfig.compilerOptions as Record<string, unknown>).types;
      } else {
        (tsconfig.compilerOptions as Record<string, unknown>).types = filtered;
      }
      await fs.writeJSON(tsconfigAppPath, tsconfig, { spaces: 2 });
    }
  }

  return true;
}

// Re-export for backward compatibility
export { configureTSConfig as configureTSConfigPathAliases };

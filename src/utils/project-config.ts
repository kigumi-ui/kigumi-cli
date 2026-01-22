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

  // Add path import if missing
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
      lines.splice(lastImportIndex + 1, 0, "import path from 'path';");
      content = lines.join('\n');
    }
  }

  // Check if resolve already exists
  if (content.includes('resolve:')) {
    return false;
  }

  // Insert resolve config after 'export default defineConfig({'
  const resolveConfig = `
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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

// Re-export for backward compatibility
export { configureTSConfig as configureTSConfigPathAliases };

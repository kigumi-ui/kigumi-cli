/**
 * File Generator
 *
 * PURPOSE: Generates project files during `kigumi init`.
 * Creates kigumi.ts, theme.css, vite-env.d.ts, .npmrc, etc.
 *
 * @see AGENTS.md for list of auto-generated files
 */

import type { OutputInterface } from '../../output/types.js';
import type { KigumiConfig } from '../../schemas/index.js';
import type { Tier } from '../../utils/tier.js';
import {
  ENV_FILE_NAME,
  ENV_TOKEN_KEY,
  ENV_TOKEN_REGEX,
  NPM_PRO_REGISTRY,
  NPM_PUBLIC_REGISTRY,
  WEB_AWESOME_SCOPE,
} from '../../constants.js';
import { getWebAwesomePackage } from '../../utils/tier.js';
import {
  regenerateKigumiSetup,
  generateViteEnvDts,
  generateNextEnvDts,
  generateThemeCSS,
  generateGitIgnore,
} from '../../utils/regenerate.js';
import type { ProjectInfo } from '../../utils/detect-framework.js';
import fs from 'fs-extra';
import path from 'path';

export interface FileGenerationOptions {
  cwd: string;
  config: KigumiConfig;
  tier: Tier;
  proToken?: string;
  output: OutputInterface;
  /**
   * Detected project info. Drives Next branching (router, src vs root layout)
   * without re-reading package.json / filesystem in this module.
   */
  projectInfo: ProjectInfo;
}

/**
 * Generate all project files
 */
export async function generateProjectFiles(
  options: FileGenerationOptions
): Promise<void> {
  const { cwd, config, tier, proToken, output, projectInfo } = options;
  const spinner = output.spinner('Generating project files...');
  const { isNext, nextRouter, sourceLayout } = projectInfo;

  try {
    // 1. Create necessary directories
    output.log(`[DEBUG] Creating directories in ${cwd}`);
    const componentsDir = config.componentsDir || 'src/components/ui';
    const utilsDir = config.utilsDir || 'src/lib';
    const stylesDir = config.stylesDir || 'src/styles';

    output.log(`[DEBUG] Components dir: ${componentsDir}`);
    output.log(`[DEBUG] Utils dir: ${utilsDir}`);
    output.log(`[DEBUG] Styles dir: ${stylesDir}`);

    await fs.ensureDir(path.join(cwd, componentsDir));
    output.log(`[DEBUG] ✓ Created ${componentsDir}`);

    await fs.ensureDir(path.join(cwd, utilsDir));
    output.log(`[DEBUG] ✓ Created ${utilsDir}`);

    await fs.ensureDir(path.join(cwd, stylesDir));
    output.log(`[DEBUG] ✓ Created ${stylesDir}`);

    // 2. Generate kigumi.ts (and layers.css)
    spinner.message('Generating kigumi.ts...');
    output.log(`[DEBUG] Generating kigumi.ts in ${utilsDir}`);
    const { layersPreserved } = await regenerateKigumiSetup(
      cwd,
      config,
      utilsDir,
      tier,
      { preserveLayersCSS: true }
    );
    output.log(`[DEBUG] ✓ kigumi.ts generated`);
    if (layersPreserved) {
      output.log(`[DEBUG] layers.css already exists, skipping generation`);
      output.info(
        'ℹ️  Existing layers.css found - preserving your custom layers'
      );
    } else {
      output.log(`[DEBUG] ✓ layers.css generated`);
    }

    // 3. Generate theme.css (only if it doesn't exist)
    spinner.message('Generating theme.css...');
    output.log(`[DEBUG] Checking for existing theme.css in ${stylesDir}`);

    const themeCssPath = path.join(cwd, stylesDir, 'theme.css');
    const themeCssExists = await fs.pathExists(themeCssPath);

    if (themeCssExists) {
      output.log(`[DEBUG] theme.css already exists, skipping generation`);
      output.info(
        'ℹ️  Existing theme.css found - preserving your custom styles'
      );
    } else {
      const themeCss = await generateThemeCSS();
      await fs.writeFile(themeCssPath, themeCss);
      output.log(`[DEBUG] ✓ theme.css generated`);
    }

    // 4. Generate JSX type declarations (TypeScript + React)
    if (config.typescript && config.framework === 'react') {
      const waPackage = getWebAwesomePackage(tier);
      if (isNext) {
        // Next.js owns next-env.d.ts; we emit a sibling `web-awesome.d.ts`
        // that carries just the JSX/CSSProperties extensions. Location
        // follows the project's layout so it's picked up by tsconfig
        // `include` without config changes.
        spinner.message('Generating web-awesome.d.ts...');
        const srcDir = sourceLayout === 'src' ? 'src' : '';
        await generateNextEnvDts(cwd, srcDir, waPackage);
      } else {
        spinner.message('Generating vite-env.d.ts...');
        await generateViteEnvDts(cwd, 'src', waPackage);
      }
    }

    // 5. Generate/update .gitignore
    spinner.message('Updating .gitignore...');
    output.log(`[DEBUG] Updating .gitignore`);
    await generateGitIgnore(cwd);
    output.log(`[DEBUG] ✓ .gitignore updated`);

    // 6. Update .env file with token (append if exists, create if not)
    if (tier === 'pro' && proToken) {
      spinner.message('Updating .env file...');
      output.log(`[DEBUG] Updating .env file with token`);
      await ensureEnvFile(cwd, proToken, output);
      output.log(`[DEBUG] ✓ .env updated`);
    }

    // 8. Generate .npmrc (both tiers need it to override global config)
    spinner.message('Generating .npmrc...');
    output.log(`[DEBUG] Generating .npmrc`);
    await generateNpmrc(cwd, tier);
    output.log(`[DEBUG] ✓ .npmrc generated`);

    // 9. Configure path aliases and TypeScript compatibility
    if (config.framework === 'react' || config.framework === 'vue') {
      spinner.message('Configuring project...');

      const {
        configureVitePathAliases,
        configureTSConfig,
        configureVueCustomElements,
        configureVueTypes,
      } = await import('../../utils/project-config.js');

      // Next.js projects don't use vite.config; skip the Vite path-aliasing
      // step entirely. The TS path alias goes into tsconfig.json, which
      // configureTSConfig already handles via its new fallback.
      if (!isNext) {
        await configureVitePathAliases(cwd, output);
      }

      if (config.typescript) {
        await configureTSConfig(cwd, output, sourceLayout);
      }

      // Vue-specific: auto-configure isCustomElement and WA types
      if (config.framework === 'vue') {
        await configureVueCustomElements(cwd, output);

        if (config.typescript) {
          const waPackage = getWebAwesomePackage(tier);
          await configureVueTypes(cwd, output, waPackage);
        }
      }
    }

    // 10. Next.js App Router: write a `KigumiProvider` wrapper so users can
    // import `@/lib/kigumi` from a Client Module. This decouples kigumi setup
    // from the (usually server-rendered) root layout.
    //
    // Pages Router projects skip this — users wire the import manually in
    // `pages/_app.tsx`, which is their own file. `nextRouter === 'unknown'`
    // (fresh scaffold, no app/ or pages/ yet) falls through to App Router
    // since that's the modern Next default.
    if (isNext && config.framework === 'react' && nextRouter !== 'pages') {
      spinner.message('Generating providers.tsx...');
      await generateNextProviders(cwd, config, output);
    } else if (isNext && nextRouter === 'pages') {
      output.log(
        '[DEBUG] Pages Router detected — skipping providers.tsx (user wires _app.tsx manually)'
      );
    }

    spinner.stop('Project files generated');
  } catch (error) {
    spinner.error('File generation failed');
    if (error instanceof Error) {
      output.error(`[ERROR] File generation error: ${error.message}`);
      output.log(`[ERROR] Stack: ${error.stack}`);
    }
    throw error;
  }
}

/**
 * Write `app/providers.tsx` for Next.js App Router projects.
 *
 * The provider is a minimal Client Module that imports the Kigumi setup so
 * users can keep their `app/layout.tsx` as a Server Component and wrap only
 * what needs to be client-side.
 *
 * Preserves existing `providers.tsx` (same contract as theme.css / layers.css).
 * @internal
 */
async function generateNextProviders(
  cwd: string,
  config: KigumiConfig,
  output: OutputInterface
): Promise<void> {
  const utilsDir = config.utilsDir || 'src/lib';
  // Convert the on-disk path to the `@/` alias that works in both layouts:
  // - src layout: `src/lib` -> `@/lib/kigumi`
  // - root layout: `lib` -> `@/lib/kigumi`
  // Both map through the alias map in `kigumi.config.json` + `tsconfig.json`
  // paths — the filesystem layer differs, the import specifier does not.
  const withoutSrcPrefix = utilsDir.startsWith('src/')
    ? utilsDir.slice('src/'.length)
    : utilsDir;
  const kigumiAlias = `@/${withoutSrcPrefix}/kigumi`;

  // Write next to app/ — try src/app/ first, then app/
  const srcApp = path.join(cwd, 'src', 'app');
  const rootApp = path.join(cwd, 'app');

  let appDir: string | null = null;
  if (await fs.pathExists(srcApp)) {
    appDir = srcApp;
  } else if (await fs.pathExists(rootApp)) {
    appDir = rootApp;
  }

  if (!appDir) {
    output.log(`[DEBUG] No app/ directory found — skipping providers.tsx`);
    return;
  }

  const providersPath = path.join(appDir, 'providers.tsx');

  if (await fs.pathExists(providersPath)) {
    output.info(
      'ℹ️  Existing providers.tsx found - preserving your customizations'
    );
    return;
  }

  const content = `'use client';

import '${kigumiAlias}';

export function KigumiProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;

  await fs.writeFile(providersPath, content);
  output.log(`[DEBUG] ✓ providers.tsx generated`);
}

/**
 * Ensure .env file has the Pro token (append if exists, create if not)
 * @internal
 */
async function ensureEnvFile(
  cwd: string,
  token: string,
  output: OutputInterface
): Promise<void> {
  const envPath = path.join(cwd, ENV_FILE_NAME);

  // Check if .env already exists
  if (await fs.pathExists(envPath)) {
    output.log(`[DEBUG] .env already exists, checking for token`);

    const content = await fs.readFile(envPath, 'utf-8');

    // Check if WEBAWESOME_NPM_TOKEN already exists
    const match = content.match(ENV_TOKEN_REGEX);

    if (match) {
      // Token exists - don't overwrite
      output.log(`[DEBUG] ${ENV_TOKEN_KEY} already set in .env`);
      return;
    }

    // Append token
    output.log(`[DEBUG] Adding ${ENV_TOKEN_KEY} to .env`);
    const appendContent = `\n# Web Awesome Pro authentication token\n${ENV_TOKEN_KEY}=${token}\n`;
    await fs.appendFile(envPath, appendContent);
    return;
  }

  // Create new .env file
  const envContent = `# Web Awesome Pro authentication token
# Get your token from https://webawesome.com
${ENV_TOKEN_KEY}=${token}
`;

  await fs.writeFile(envPath, envContent);
}

/**
 * Generate .npmrc file
 *
 * WHY: Both tiers need .npmrc to override potential global ~/.npmrc
 *
 * - Pro tier: Points to private Cloudsmith registry (token in global ~/.npmrc)
 * - Free tier: Explicitly use public npm registry (overrides global config)
 *
 * NOTE: Token is NOT stored in project .npmrc - user configures it globally via:
 *   npm config set //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken TOKEN
 *
 * @internal
 */
async function generateNpmrc(cwd: string, tier: Tier): Promise<void> {
  const npmrcPath = path.join(cwd, '.npmrc');

  let npmrcContent: string;

  if (tier === 'pro') {
    // Only registry URL - token is configured globally in ~/.npmrc
    npmrcContent = `${WEB_AWESOME_SCOPE}:registry=${NPM_PRO_REGISTRY}
`;
  } else {
    // Free tier: Explicitly point to public npm registry
    // This overrides any global ~/.npmrc that might point to Pro registry
    npmrcContent = `${WEB_AWESOME_SCOPE}:registry=${NPM_PUBLIC_REGISTRY}
`;
  }

  await fs.writeFile(npmrcPath, npmrcContent);
}

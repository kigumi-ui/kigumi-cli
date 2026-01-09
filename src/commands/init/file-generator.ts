/**
 * File Generator
 *
 * Generates project files (webawesome.ts, theme.css, etc.)
 */

import type { OutputInterface } from '../../output/types.js';
import type { KigumiConfig } from '../../schemas/index.js';
import type { Tier } from '../../utils/tier.js';
import {
  regenerateWebAwesomeSetup,
  generateViteEnvDts,
  generateThemeCSS,
  generateGitIgnore,
} from '../../utils/regenerate.js';
import fs from 'fs-extra';
import path from 'path';

export interface FileGenerationOptions {
  cwd: string;
  config: KigumiConfig;
  tier: Tier;
  proToken?: string;
  output: OutputInterface;
}

/**
 * Generate all project files
 */
export async function generateProjectFiles(
  options: FileGenerationOptions
): Promise<void> {
  const { cwd, config, tier, proToken, output } = options;
  const spinner = output.spinner('Generating project files...');

  try {
    // 1. Create necessary directories
    output.log(`[DEBUG] Creating directories in ${cwd}`);
    const componentsDir = config.componentsDir || 'src/components/ui';
    const utilsDir = config.utilsDir || 'src/lib';
    const stylesDir = 'src/styles';

    output.log(`[DEBUG] Components dir: ${componentsDir}`);
    output.log(`[DEBUG] Utils dir: ${utilsDir}`);
    output.log(`[DEBUG] Styles dir: ${stylesDir}`);

    await fs.ensureDir(path.join(cwd, componentsDir));
    output.log(`[DEBUG] ✓ Created ${componentsDir}`);

    await fs.ensureDir(path.join(cwd, utilsDir));
    output.log(`[DEBUG] ✓ Created ${utilsDir}`);

    await fs.ensureDir(path.join(cwd, stylesDir));
    output.log(`[DEBUG] ✓ Created ${stylesDir}`);

    // 2. Generate webawesome.ts
    spinner.message('Generating webawesome.ts...');
    output.log(`[DEBUG] Generating webawesome.ts in ${utilsDir}`);
    await regenerateWebAwesomeSetup(cwd, config, utilsDir, tier);
    output.log(`[DEBUG] ✓ webawesome.ts generated`);

    // 3. Generate theme.css
    spinner.message('Generating theme.css...');
    output.log(`[DEBUG] Generating theme.css in ${stylesDir}`);
    const themeCss = await generateThemeCSS(config, tier);
    await fs.writeFile(path.join(cwd, stylesDir, 'theme.css'), themeCss);
    output.log(`[DEBUG] ✓ theme.css generated`);

    // 4. Generate vite-env.d.ts (TypeScript + React)
    if (config.typescript && config.framework === 'react') {
      spinner.message('Generating vite-env.d.ts...');
      output.log(`[DEBUG] Generating vite-env.d.ts`);
      await generateViteEnvDts(cwd, 'src');
      output.log(`[DEBUG] ✓ vite-env.d.ts generated`);
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
 * Ensure .env file has the Pro token (append if exists, create if not)
 */
async function ensureEnvFile(
  cwd: string,
  token: string,
  output: OutputInterface
): Promise<void> {
  const envPath = path.join(cwd, '.env');

  // Check if .env already exists
  if (await fs.pathExists(envPath)) {
    output.log(`[DEBUG] .env already exists, checking for token`);
    
    const content = await fs.readFile(envPath, 'utf-8');
    
    // Check if WEBAWESOME_NPM_TOKEN already exists
    const tokenRegex = /^\s*WEBAWESOME_NPM_TOKEN\s*=\s*(.+?)\s*$/m;
    const match = content.match(tokenRegex);
    
    if (match) {
      // Token exists - don't overwrite
      output.log(`[DEBUG] WEBAWESOME_NPM_TOKEN already set in .env`);
      return;
    }

    // Append token
    output.log(`[DEBUG] Adding WEBAWESOME_NPM_TOKEN to .env`);
    const appendContent = `\n# Web Awesome Pro authentication token\nWEBAWESOME_NPM_TOKEN=${token}\n`;
    await fs.appendFile(envPath, appendContent);
    return;
  }

  // Create new .env file
  const envContent = `# Web Awesome Pro authentication token
# Get your token from https://webawesome.com/pro
WEBAWESOME_NPM_TOKEN=${token}
`;

  await fs.writeFile(envPath, envContent);
}

/**
 * Generate .npmrc file
 * 
 * IMPORTANT: Both tiers need .npmrc to override potential global ~/.npmrc
 * 
 * Pro tier: Points to private Cloudsmith registry with auth
 * Free tier: Explicitly use public npm registry (overrides global config)
 */
async function generateNpmrc(cwd: string, tier: Tier): Promise<void> {
  const npmrcPath = path.join(cwd, '.npmrc');
  
  let npmrcContent: string;
  
  if (tier === 'pro') {
    npmrcContent = `@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro
//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=\${WEBAWESOME_NPM_TOKEN}
`;
  } else {
    // Free tier: Explicitly point to public npm registry
    // This overrides any global ~/.npmrc that might point to Pro registry
    npmrcContent = `@awesome.me:registry=https://registry.npmjs.org/
`;
  }

  await fs.writeFile(npmrcPath, npmrcContent);
}

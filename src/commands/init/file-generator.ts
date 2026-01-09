/**
 * File Generator
 *
 * Generates project files (webawesome.ts, theme.css, etc.)
 */

import type { OutputInterface } from '../../output/types.js';
import type { KigumiConfig } from '../../schemas/index.js';
import { regenerateWebAwesomeSetup, generateViteEnvDts, generateThemeCSS, generateGitIgnore } from '../../utils/regenerate.js';
import fs from 'fs-extra';
import path from 'path';

/**
 * Generate all project files
 *
 * @param cwd - Current working directory
 * @param config - Kigumi configuration
 * @param output - Output interface
 */
export async function generateProjectFiles(
  cwd: string,
  config: KigumiConfig,
  output: OutputInterface
): Promise<void> {
  const spinner = output.spinner('Generating project files...');

  try {
    // 1. Create necessary directories first
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
    await regenerateWebAwesomeSetup(cwd, config, utilsDir);
    output.log(`[DEBUG] ✓ webawesome.ts generated`);

    // 3. Generate theme.css
    spinner.message('Generating theme.css...');
    output.log(`[DEBUG] Generating theme.css in ${stylesDir}`);
    const themeCss = await generateThemeCSS(config);
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

    // 6. Generate .env.example for Pro tier
    if (config.webAwesome?.tier === 'pro') {
      spinner.message('Generating .env.example...');
      output.log(`[DEBUG] Generating .env.example`);
      await generateEnvExample(cwd);
      output.log(`[DEBUG] ✓ .env.example generated`);
    }

    // 7. Generate .env file for Pro tier (with actual token if provided)
    if (config.webAwesome?.tier === 'pro') {
      spinner.message('Generating .env file...');
      output.log(`[DEBUG] Generating .env file`);
      await generateEnvFile(cwd, config);
      output.log(`[DEBUG] ✓ .env generated`);
    }

    // 8. Generate .npmrc for Pro tier
    if (config.webAwesome?.tier === 'pro') {
      spinner.message('Generating .npmrc...');
      output.log(`[DEBUG] Generating .npmrc`);
      await generateNpmrc(cwd);
      output.log(`[DEBUG] ✓ .npmrc generated`);
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
 * Generate .env.example file for Pro tier
 */
async function generateEnvExample(cwd: string): Promise<void> {
  const envExamplePath = path.join(cwd, '.env.example');
  const envExampleContent = `# Web Awesome Pro Authentication Token
# Required only if you're using the Pro tier
#
# Get your token from: https://webawesome.com/pro
#
# Steps:
# 1. Sign in to your Web Awesome account
# 2. Navigate to Settings → API Tokens
# 3. Generate a new token
# 4. Copy the token and paste it below
#
# For team members: Ask your team lead for the shared Pro token
#
# Security: Never commit this file with a real token!

WEBAWESOME_NPM_TOKEN=your-token-here
`;

  await fs.writeFile(envExamplePath, envExampleContent);
}

/**
 * Generate .env file for Pro tier with token
 */
async function generateEnvFile(cwd: string, config: KigumiConfig): Promise<void> {
  const envPath = path.join(cwd, '.env');

  // Get token from config (if provided via --token flag)
  const token = config.webAwesome?.token || 'your-token-here';

  const envContent = `# Web Awesome Pro authentication token
# Get your token from https://webawesome.com
WEBAWESOME_NPM_TOKEN=${token}
`;

  await fs.writeFile(envPath, envContent);
}

/**
 * Generate .npmrc file for Pro tier authentication
 */
async function generateNpmrc(cwd: string): Promise<void> {
  const npmrcPath = path.join(cwd, '.npmrc');
  const npmrcContent = `@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro/
//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=\${WEBAWESOME_NPM_TOKEN}
`;

  await fs.writeFile(npmrcPath, npmrcContent);
}

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
    // 1. Generate webawesome.ts
    spinner.message('Generating webawesome.ts...');
    await regenerateWebAwesomeSetup(cwd, config);

    // 2. Generate theme.css
    spinner.message('Generating theme.css...');
    const themeCss = await generateThemeCSS(config);
    const utilsDir = config.utilsDir || 'src/lib';
    await fs.ensureDir(path.join(cwd, utilsDir));
    await fs.writeFile(path.join(cwd, utilsDir, 'theme.css'), themeCss);

    // 3. Generate vite-env.d.ts (TypeScript + React)
    if (config.typescript && config.framework === 'react') {
      spinner.message('Generating vite-env.d.ts...');
      await generateViteEnvDts(cwd, config);
    }

    // 4. Generate/update .gitignore
    spinner.message('Updating .gitignore...');
    await generateGitIgnore(cwd);

    // 5. Generate .env.example for Pro tier
    if (config.webAwesome?.tier === 'pro') {
      spinner.message('Generating .env.example...');
      await generateEnvExample(cwd);
    }

    spinner.stop('Project files generated');
  } catch (error) {
    spinner.error('File generation failed');
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

WA_TOKEN=your-token-here
`;

  await fs.writeFile(envExamplePath, envExampleContent);
}

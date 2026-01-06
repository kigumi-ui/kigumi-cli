import * as p from '@clack/prompts';
import { execa, type ExecaError } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { saveConfig, DEFAULT_CONFIG, type KigumiConfig } from '../utils/config.js';
import { getProjectInfo } from '../utils/detect-framework.js';
import { regenerateWebAwesomeSetup, generateViteEnvDts } from '../utils/regenerate.js';
import {
  getAvailableThemes,
  getAvailablePalettes,
} from '../utils/tier-restrictions.js';
import {
  loadTokenFromEnv,
  saveTokenToEnv,
  isValidTokenFormat as isValidToken,
} from '../utils/token-manager.js';

/**
 * Validate WA_TOKEN format (basic check)
 * Cloudsmith tokens are typically alphanumeric with hyphens
 */
function isValidTokenFormat(token: string | undefined): boolean {
  if (!token) return false;
  // Check if token is not the placeholder
  if (token === 'your-token-here') return false;
  // Check if token has reasonable length (Cloudsmith tokens are usually 40+ chars)
  if (token.length < 20) return false;
  // Check if token contains only valid characters (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) return false;
  return true;
}

export async function initCommand() {
  console.clear();

  p.intro(pc.bgCyan(pc.black(' kigumi init ')));

  const cwd = process.cwd();
  let existingConfig: KigumiConfig | null = null;
  let tokenWarningShown = false;

  // Check if already initialized
  const configExists = await fs.pathExists(path.join(cwd, 'kigumi-components.json'));
  if (configExists) {
    // Read current config
    try {
      existingConfig = await fs.readJson(path.join(cwd, 'kigumi-components.json'));
    } catch {
      existingConfig = null;
    }

    // Check what's missing
    const envExists = await fs.pathExists(path.join(cwd, '.env'));
    const isPro = existingConfig?.webAwesome?.tier === 'pro';
    const missingEnv = isPro && !envExists;

    // Show current setup
    if (existingConfig) {
      p.note(
        `Framework: ${pc.cyan(existingConfig.framework)}\n` +
        `Tier: ${pc.cyan(existingConfig.webAwesome?.tier || 'free')}\n` +
        `Theme: ${pc.cyan(existingConfig.theme.selected)}\n` +
        (missingEnv ? `\n${pc.yellow('⚠ Missing .env file for Pro tier')}` : ''),
        'Current Configuration'
      );
    }

    const action = await p.select({
      message: 'What would you like to do?',
      options: [
        { value: 'update', label: 'Update configuration', hint: 'Modify settings' },
        { value: 'reinstall', label: 'Reinstall dependencies only', hint: 'Skip config prompts' },
        { value: 'cancel', label: 'Cancel' },
      ],
      initialValue: missingEnv ? 'reinstall' : 'cancel',
    });

    if (p.isCancel(action) || action === 'cancel') {
      // Offer helpful tips before exiting
      if (missingEnv) {
        p.note(
          `To set up Pro tier manually:\n\n` +
          `1. Create ${pc.cyan('.env')} in project root\n` +
          `2. Add: ${pc.dim('WA_TOKEN=your-token-here')}\n` +
          `3. Get your token from ${pc.cyan('https://webawesome.com')}\n` +
          `4. Run: ${pc.cyan('npm install @awesome.me/webawesome-pro')}`,
          'Manual Setup'
        );
      }
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    if (action === 'reinstall') {
      // Skip all prompts, just reinstall dependencies
      await reinstallDependencies(cwd, existingConfig!);
      return;
    }

    p.log.info(pc.dim('Existing components will not be affected.'));
  }

  // Detect project info (no longer show as note, just use for defaults)
  const spinner = p.spinner();
  spinner.start('Detecting project setup...');
  const projectInfo = await getProjectInfo(cwd);
  spinner.stop('Project detected');

  // Interactive prompts (use existing config as defaults if available)
  const config = await p.group(
    {
      framework: () =>
        p.select({
          message: 'Which framework are you using?',
          initialValue: existingConfig?.framework ||
                       (projectInfo.framework !== 'unknown' ? projectInfo.framework : 'react'),
          options: [
            { value: 'react', label: 'React' },
            { value: 'vue', label: 'Vue' },
            { value: 'svelte', label: 'Svelte' },
          ],
        }),
      typescript: () =>
        p.confirm({
          message: 'Use TypeScript?',
          initialValue: existingConfig?.typescript ?? projectInfo.typescript,
        }),
      tier: () =>
        p.select({
          message: 'Which version of Web Awesome?',
          options: [
            {
              value: 'free',
              label: 'Free (Open Source)',
              hint: 'All themes and palettes, most components',
            },
            {
              value: 'pro',
              label: 'Pro (Requires Token)',
              hint: 'Additional components: page, charts, data-grid, etc.',
            },
          ],
          initialValue: existingConfig?.webAwesome?.tier || 'free',
        }),
      token: async ({ results }) => {
        if (results.tier !== 'pro') {
          return Promise.resolve(undefined);
        }

        // Check if token already exists in .env
        const existingToken = await loadTokenFromEnv(cwd);
        if (existingToken && isValidToken(existingToken)) {
          const useExisting = await p.confirm({
            message: 'Found existing WA_TOKEN. Use it?',
            initialValue: true,
          });

          if (useExisting) {
            return existingToken;
          }
        }

        // Prompt for new token
        const token = await p.text({
          message: 'Enter your Web Awesome Pro token:',
          placeholder: 'Get from https://webawesome.com → Settings → API Tokens',
          validate: (value) => {
            if (!value) {
              return 'Token is required for Pro tier';
            }
            if (!isValidToken(value)) {
              return 'Invalid token format';
            }
          },
        });

        if (p.isCancel(token)) {
          return Promise.resolve(undefined);
        }

        return token as string;
      },
      theme: ({ results }) => {
        const tier = results.tier as 'free' | 'pro';
        const availableThemes = getAvailableThemes(tier);

        const options = availableThemes
          .filter((t) => t !== 'custom') // Don't show custom in initial setup
          .map((themeName) => ({
            value: themeName,
            label: themeName.charAt(0).toUpperCase() + themeName.slice(1),
            hint: themeName === 'default' ? 'Recommended' : '',
          }));

        return p.select({
          message: 'Which theme would you like to use?',
          options,
          initialValue: existingConfig?.theme?.selected || 'default',
        });
      },
      palette: ({ results }) => {
        // Skip if theme is 'none'
        if (results.theme === 'none') {
          return Promise.resolve('default');
        }

        // CRITICAL FIX: All palettes available to BOTH tiers
        const tier = results.tier as 'free' | 'pro';
        const availablePalettes = getAvailablePalettes(tier);

        const options = availablePalettes
          .filter((p) => p !== 'custom') // Don't show custom in initial setup
          .map((paletteName) => ({
            value: paletteName,
            label: paletteName.charAt(0).toUpperCase() + paletteName.slice(1),
            hint: paletteName === 'default' ? 'Recommended' : '',
          }));

        return p.select({
          message: 'Which color palette?',
          options,
          initialValue: existingConfig?.theme?.palette || 'default',
        });
      },
      brandColor: ({ results }) => {
        // Skip if theme is 'none'
        if (results.theme === 'none') {
          return Promise.resolve('blue');
        }

        return p.select({
          message: 'Which brand color?',
          options: [
            { value: 'blue', label: 'Blue', hint: 'Recommended' },
            { value: 'purple', label: 'Purple' },
            { value: 'green', label: 'Green' },
            { value: 'red', label: 'Red' },
            { value: 'orange', label: 'Orange' },
            { value: 'yellow', label: 'Yellow' },
            { value: 'cyan', label: 'Cyan' },
            { value: 'indigo', label: 'Indigo' },
            { value: 'pink', label: 'Pink' },
            { value: 'gray', label: 'Gray' },
          ],
          initialValue: existingConfig?.theme?.brandColor || 'blue',
        });
      },
      componentsDir: () =>
        p.text({
          message: 'Where should we install components?',
          initialValue: existingConfig?.componentsDir || DEFAULT_CONFIG.componentsDir,
          placeholder: DEFAULT_CONFIG.componentsDir,
        }),
      utilsDir: () =>
        p.text({
          message: 'Where should we install utilities?',
          initialValue: existingConfig?.utilsDir || DEFAULT_CONFIG.utilsDir,
          placeholder: DEFAULT_CONFIG.utilsDir,
        }),
      installWebAwesome: ({ results }) =>
        p.confirm({
          message: `Install ${results.tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome'}?`,
          initialValue: true,
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );

  // Build configuration
  const tier = config.tier as 'free' | 'pro';
  const componentsDir = config.componentsDir as string;
  const utilsDir = config.utilsDir as string;

  const kigumiConfig: KigumiConfig = {
    framework: config.framework as 'react' | 'vue' | 'svelte',
    typescript: config.typescript as boolean,
    componentsDir,
    utilsDir,
    theme: {
      selected: config.theme as string,
      palette: config.palette as string,
      brandColor: config.brandColor as string,
    },
    aliases: {
      '@/components': `./${componentsDir}`,
      '@/lib': `./${utilsDir}`,
      '@/styles': './src/styles',
    },
    webAwesome: {
      tier,
      version: '^3.1.0',
      ...(tier === 'pro' && { tokenEnvVar: 'WA_TOKEN' }),
    },
  };

  // Save configuration
  spinner.start('Creating configuration...');
  await saveConfig(kigumiConfig, cwd);
  spinner.stop('Configuration saved');

  // Save token to .env if provided (Pro tier only)
  if (tier === 'pro' && config.token) {
    spinner.start('Saving token to .env...');
    await saveTokenToEnv(config.token as string, cwd);
    spinner.stop('Token saved to .env');
  }

  // Create directories
  spinner.start('Creating directories...');
  await fs.ensureDir(path.join(cwd, componentsDir));
  await fs.ensureDir(path.join(cwd, utilsDir));
  await fs.ensureDir(path.join(cwd, 'src/styles'));
  spinner.stop('Directories created');

  // Ensure .gitignore includes .env (but NOT .npmrc - that should be committed)
  const gitignorePath = path.join(cwd, '.gitignore');
  const gitignoreExists = await fs.pathExists(gitignorePath);

  if (!gitignoreExists) {
    // Create basic .gitignore if it doesn't exist
    const gitignoreContent =
      '# Dependencies\n' +
      'node_modules/\n' +
      '\n' +
      '# Environment variables (contains secrets!)\n' +
      '# IMPORTANT: .env contains your token and should NEVER be committed\n' +
      '# The .npmrc file is safe to commit (it references the env var)\n' +
      '.env\n' +
      '.env.local\n' +
      '.env.*.local\n' +
      '\n' +
      '# Build outputs\n' +
      'dist/\n' +
      'build/\n' +
      '.next/\n' +
      'out/\n' +
      '\n' +
      '# IDE\n' +
      '.vscode/\n' +
      '.idea/\n' +
      '\n' +
      '# OS\n' +
      '.DS_Store\n' +
      'Thumbs.db\n';

    await fs.writeFile(gitignorePath, gitignoreContent);
  } else {
    // Add .env to existing .gitignore if not present
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    if (!gitignoreContent.includes('.env')) {
      await fs.appendFile(
        gitignorePath,
        '\n# Environment variables (added by kigumi)\n' +
        '# IMPORTANT: .env contains your token and should NEVER be committed\n' +
        '.env\n.env.local\n'
      );
    }
  }

  // Create .env, .env.example, and .npmrc files if Pro tier (SINGLE token warning location)
  if (tier === 'pro') {
    const envPath = path.join(cwd, '.env');
    const envExamplePath = path.join(cwd, '.env.example');
    const npmrcPath = path.join(cwd, '.npmrc');
    const envExists = await fs.pathExists(envPath);
    const hasValidToken = isValidTokenFormat(process.env.WA_TOKEN);

    // Always create/update .env.example (this gets committed to git)
    const envExampleContent =
      '# Web Awesome Pro Authentication Token\n' +
      '# Required only if you\'re using the Pro tier (not needed for free tier)\n' +
      '#\n' +
      '# Get your token from: https://webawesome.com\n' +
      '#\n' +
      '# Steps:\n' +
      '# 1. Sign up or log in at https://webawesome.com\n' +
      '# 2. Go to your team settings\n' +
      '# 3. Generate an API token for your project\n' +
      '# 4. Copy the token and paste it below\n' +
      '#\n' +
      '# For team members: Ask your team lead for the shared Pro token\n' +
      '#\n' +
      '# Security: Never commit this file with a real token!\n' +
      '# The .env file (with your actual token) is gitignored.\n' +
      '\n' +
      'WA_TOKEN=your-token-here\n';

    spinner.start('Creating .env.example...');
    await fs.writeFile(envExamplePath, envExampleContent);
    spinner.stop('.env.example created');

    if (!envExists) {
      spinner.start('Creating .env file...');
      await fs.writeFile(envPath, envExampleContent);
      spinner.stop('.env file created');
    } else {
      // Check if WA_TOKEN exists in .env
      const envContent = await fs.readFile(envPath, 'utf-8');
      if (!envContent.includes('WA_TOKEN')) {
        spinner.start('Adding WA_TOKEN to .env...');
        await fs.appendFile(envPath, '\n' + envExampleContent);
        spinner.stop('WA_TOKEN added to .env');
      }
    }

    // Create .npmrc with registry configuration
    const npmrcContent =
      '# Web Awesome Pro Registry Configuration\n' +
      '# This file configures npm to use the Web Awesome Pro registry\n' +
      '#\n' +
      '# The @awesome.me scope is configured to use the Cloudsmith registry\n' +
      '@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro/\n' +
      '\n' +
      '# Authentication is loaded from the WA_TOKEN environment variable\n' +
      '# Make sure WA_TOKEN is set in your .env file before installing\n' +
      '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${WA_TOKEN}\n';

    const npmrcExists = await fs.pathExists(npmrcPath);
    if (!npmrcExists) {
      spinner.start('Creating .npmrc...');
      await fs.writeFile(npmrcPath, npmrcContent);
      spinner.stop('.npmrc created');
    } else {
      // Check if the configuration already exists
      const existingNpmrc = await fs.readFile(npmrcPath, 'utf-8');
      if (!existingNpmrc.includes('@awesome.me:registry')) {
        spinner.start('Updating .npmrc...');
        await fs.appendFile(npmrcPath, '\n' + npmrcContent);
        spinner.stop('.npmrc updated');
      }
    }

    // Show token warning ONCE if token is not valid
    if (!hasValidToken) {
      const installCommand = projectInfo.packageManager === 'npm'
        ? 'npm install'
        : `${projectInfo.packageManager} install`;

      p.note(
        `${pc.yellow('⚠ Web Awesome Pro requires authentication')}\n\n` +
        `Before you can install and use Pro:\n\n` +
        `1. Get your Pro token from ${pc.cyan('https://webawesome.com')}\n` +
        `2. Add it to ${pc.cyan('.env')}:\n   ${pc.dim('WA_TOKEN=your-actual-token')}\n` +
        `3. Then run:\n   ${pc.cyan(installCommand)}`,
        'Authentication Required'
      );
      tokenWarningShown = true;
    }
  }

  // Create theme customization file
  spinner.start('Creating theme customization file...');
  const themeCustomContent = `/**
 * Web Awesome Theme Customizations
 *
 * Override Web Awesome design tokens here.
 * This file is imported AFTER the theme CSS, so your values take precedence.
 *
 * Documentation: https://webawesome.com/docs/tokens
 */

/* Example: Customize spacing */
/* :root {
  --wa-space-xs: 0.25rem;
  --wa-space-s: 0.5rem;
  --wa-space-m: 1rem;
  --wa-space-l: 2rem;
  --wa-space-xl: 4rem;
} */

/* Example: Customize typography */
/* :root {
  --wa-font-size-s: 0.875rem;
  --wa-font-size-m: 1rem;
  --wa-font-size-l: 1.25rem;
  --wa-font-weight-normal: 400;
  --wa-font-weight-bold: 700;
} */

/* Example: Customize brand color (advanced) */
/* :root {
  --wa-color-brand-fill-loud: #your-custom-color;
  --wa-color-brand-border-loud: #your-custom-color;
} */

/* Add your customizations below */
:root {
  /* Your overrides here */
}
`;
  await fs.writeFile(path.join(cwd, 'src/styles/theme.css'), themeCustomContent);
  spinner.stop('Theme customization file created');

  // Create Web Awesome setup file
  spinner.start('Creating Web Awesome setup file...');
  await regenerateWebAwesomeSetup(cwd, kigumiConfig, utilsDir);
  spinner.stop('Web Awesome setup file created');

  // Create vite-env.d.ts for TypeScript support (React only)
  if (kigumiConfig.framework === 'react') {
    spinner.start('Creating TypeScript definitions for Web Awesome...');
    await generateViteEnvDts(cwd, 'src');
    spinner.stop('TypeScript definitions created');
  }

  // Auto-import webawesome.ts in main entry file
  const possibleEntryFiles = [
    'src/main.tsx',
    'src/main.ts',
    'src/index.tsx',
    'src/index.ts',
    'src/App.tsx',
    'src/App.ts'
  ];

  let entryFile: string | null = null;
  for (const file of possibleEntryFiles) {
    const filePath = path.join(cwd, file);
    if (await fs.pathExists(filePath)) {
      entryFile = filePath;
      break;
    }
  }

  if (entryFile) {
    const entryContent = await fs.readFile(entryFile, 'utf-8');
    const webawesomeImport = `import '@/lib/webawesome';`;

    // Check if import already exists
    if (!entryContent.includes(webawesomeImport) && !entryContent.includes("'@/lib/webawesome'") && !entryContent.includes('"@/lib/webawesome"')) {
      // Add import at the top, after other imports
      const lines = entryContent.split('\n');
      let insertIndex = 0;

      // Find last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        }
      }

      lines.splice(insertIndex, 0, webawesomeImport);
      await fs.writeFile(entryFile, lines.join('\n'));
    }
  }

  // Configure npm registry based on tier
  const npmrcPath = path.join(cwd, '.npmrc');

  if (tier === 'free') {
    // For FREE tier: ensure we use public npm registry
    // This overrides any global .npmrc with Pro registry settings
    const npmrcContent =
      '# Web Awesome Free Tier - use public npm registry\n' +
      '# This overrides any global .npmrc Pro registry settings\n' +
      '@awesome.me:registry=https://registry.npmjs.org/\n';

    await fs.writeFile(npmrcPath, npmrcContent);
  } else if (tier === 'pro') {
    // For PRO tier: check if user has global Pro config
    const hasGlobalProConfig = await (async () => {
      try {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const globalNpmrc = path.join(homeDir, '.npmrc');
        if (await fs.pathExists(globalNpmrc)) {
          const content = await fs.readFile(globalNpmrc, 'utf-8');
          return content.includes('@awesome.me:registry') && content.includes('webawesome-pro');
        }
        return false;
      } catch {
        return false;
      }
    })();

    // Only create .npmrc if user doesn't have global Pro config
    if (!hasGlobalProConfig) {
      const npmrcContent =
        '# Web Awesome Pro - Private Registry\n' +
        '@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro/\n' +
        '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${WEBAWESOME_NPM_TOKEN}\n';

      await fs.writeFile(npmrcPath, npmrcContent);
    }
  }

  // Install dependencies
  const packageName = tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';
  if (config.installWebAwesome) {
    // For Pro tier, check if token is set before attempting installation
    if (tier === 'pro') {
      const hasToken = isValidTokenFormat(process.env.WA_TOKEN);

      if (!hasToken) {
        // Skip installation and show clear instructions
        // Only show additional note if token warning wasn't shown earlier
        if (!tokenWarningShown) {
          const installCommand = projectInfo.packageManager === 'npm'
            ? 'npm install'
            : `${projectInfo.packageManager} install`;

          p.note(
            `${pc.yellow('⚠ Cannot install without authentication')}\n\n` +
            `Set your WA_TOKEN in ${pc.cyan('.env')} first, then run:\n` +
            `${pc.cyan(installCommand)}`,
            'Installation Skipped'
          );
        }
        // Skip the package installation but continue with setup
      } else {
        // Token is set, proceed with installation
        spinner.start(`Installing ${packageName}...`);
        try {
          // Use correct syntax for each package manager
          let installArgs: string[];
          if (projectInfo.packageManager === 'npm') {
            installArgs = ['install', packageName];
          } else if (projectInfo.packageManager === 'pnpm') {
            installArgs = ['add', packageName];
          } else if (projectInfo.packageManager === 'yarn') {
            installArgs = ['add', packageName];
          } else {
            // bun
            installArgs = ['add', packageName];
          }

          await execa(projectInfo.packageManager, installArgs, {
            cwd,
          });
          spinner.stop(`${packageName} installed`);

          // Install clsx for React projects (required for className management)
          if (kigumiConfig.framework === 'react') {
            spinner.start('Installing clsx...');
            try {
              const clsxArgs = projectInfo.packageManager === 'npm'
                ? ['install', 'clsx']
                : projectInfo.packageManager === 'pnpm'
                ? ['add', 'clsx']
                : ['add', 'clsx']; // yarn/bun

              await execa(projectInfo.packageManager, clsxArgs, { cwd });
              spinner.stop('clsx installed');
            } catch (error) {
              spinner.stop('Failed to install clsx (optional)');
              p.log.warn('clsx installation failed, but you can install it manually later');
            }
          }
        } catch (error: any) {
          spinner.stop(`Failed to install ${packageName}`);

          // Provide specific error context
          const isAuthError = error.message?.includes('401') || error.message?.includes('Unauthorized');
          const errorDetails = isAuthError
            ? `${pc.red('❌ Authentication failed (401 Unauthorized)')}\n\n` +
              `This means your WA_TOKEN is either:\n` +
              `${pc.dim('•')} Not set correctly in ${pc.cyan('.env')}\n` +
              `${pc.dim('•')} Invalid or expired\n` +
              `${pc.dim('•')} Not authorized for Web Awesome Pro\n`
            : `${pc.red('❌ Installation failed')}\n\n`;

          const installCommand = projectInfo.packageManager === 'npm'
            ? `npm install`
            : `${projectInfo.packageManager} add ${packageName}`;

          p.note(
            errorDetails +
            `\n${pc.bold('Steps to fix:')}\n\n` +
            `${pc.green('1.')} Get a valid token from ${pc.cyan('https://webawesome.com')}\n` +
            `   ${pc.dim('→')} Sign in to your account\n` +
            `   ${pc.dim('→')} Go to Settings → API Tokens\n` +
            `   ${pc.dim('→')} Generate or copy your token\n\n` +
            `${pc.green('2.')} Update ${pc.cyan('.env')} with the token:\n` +
            `   ${pc.dim('WA_TOKEN=your-actual-token-here')}\n\n` +
            `${pc.green('3.')} Try installing again:\n` +
            `   ${pc.cyan(installCommand)}`,
            'Installation Error'
          );
        }
      }
    } else {
      // Free tier - proceed normally
      spinner.start(`Installing ${packageName}...`);
      try {
        // Use correct syntax for each package manager
        let installArgs: string[];
        if (projectInfo.packageManager === 'npm') {
          installArgs = ['install', packageName];
        } else if (projectInfo.packageManager === 'pnpm') {
          installArgs = ['add', packageName];
        } else if (projectInfo.packageManager === 'yarn') {
          installArgs = ['add', packageName];
        } else {
          // bun
          installArgs = ['add', packageName];
        }

        await execa(projectInfo.packageManager, installArgs, {
          cwd,
        });
        spinner.stop(`${packageName} installed`);

        // Install clsx for React projects (required for className management)
        if (kigumiConfig.framework === 'react') {
          spinner.start('Installing clsx...');
          try {
            const clsxArgs = projectInfo.packageManager === 'npm'
              ? ['install', 'clsx']
              : projectInfo.packageManager === 'pnpm'
              ? ['add', 'clsx']
              : ['add', 'clsx']; // yarn/bun

            await execa(projectInfo.packageManager, clsxArgs, { cwd });
            spinner.stop('clsx installed');
          } catch (error) {
            spinner.stop('Failed to install clsx (optional)');
            p.log.warn('clsx installation failed, but you can install it manually later');
          }
        }
      } catch (error) {
        spinner.stop(`Failed to install ${packageName}`);

        const execaError = error as ExecaError;
        const errorMessage = execaError.message || String(error);
        const stderr = execaError.stderr || '';

        const installCmd = projectInfo.packageManager === 'npm'
          ? `npm install ${packageName}`
          : `${projectInfo.packageManager} add ${packageName}`;

        // Provide detailed diagnostics for free tier installation failures
        let diagnosisMessage = `${pc.red(`Failed to install ${packageName}`)}\n\n`;

        // Try to diagnose the issue
        if (stderr.includes('E401') || stderr.includes('Incorrect or missing password') || stderr.includes('authentication')) {
          diagnosisMessage +=
            `${pc.bold('Issue:')} Authentication error\n\n` +
            `${pc.yellow('Free tier packages should NOT require authentication!')}\n\n` +
            `${pc.bold('Quick fix:')}\n\n` +
            `${pc.green('1.')} ${pc.cyan('npm logout')}\n` +
            `${pc.green('2.')} ${pc.cyan('npm cache clean --force')}\n` +
            `${pc.green('3.')} ${pc.cyan(installCmd)}\n\n` +
            `${pc.dim('Check ~/.npmrc for any @awesome.me registry overrides')}\n\n`;
        } else if (stderr.includes('404') || stderr.includes('Not Found')) {
          diagnosisMessage +=
            `${pc.bold('Issue:')} Package not found\n\n` +
            `${pc.bold('Possible causes:')}\n\n` +
            `${pc.dim('•')} Package name or version incorrect\n` +
            `${pc.dim('•')} Network/registry connection issues\n` +
            `${pc.dim('•')} npm registry is down\n\n`;
        } else if (stderr.includes('ENOTFOUND') || stderr.includes('ETIMEDOUT')) {
          diagnosisMessage +=
            `${pc.bold('Issue:')} Network connectivity problem\n\n` +
            `${pc.bold('Possible causes:')}\n\n` +
            `${pc.dim('•')} No internet connection\n` +
            `${pc.dim('•')} Firewall or VPN blocking npm registry\n` +
            `${pc.dim('•')} DNS resolution issues\n\n`;
        } else if (stderr.includes('EACCES') || stderr.includes('permission denied')) {
          diagnosisMessage +=
            `${pc.bold('Issue:')} Permission error\n\n` +
            `${pc.bold('Try:')}\n` +
            `${pc.cyan('npm cache clean --force')}\n` +
            `${pc.cyan(installCmd)}\n\n`;
        } else {
          diagnosisMessage +=
            `${pc.bold('Common causes:')}\n\n` +
            `${pc.dim('•')} Network connectivity issues\n` +
            `${pc.dim('•')} npm registry timeout\n` +
            `${pc.dim('•')} Package manager cache corruption\n\n`;
        }

        diagnosisMessage +=
          `${pc.bold('Try manually:')}\n` +
          `${pc.cyan(installCmd)}\n\n` +
          `${pc.dim('Error:')} ${pc.dim(errorMessage)}`;

        if (stderr && stderr.length > 0) {
          diagnosisMessage += `\n\n${pc.dim('Details:')}\n${pc.dim(stderr.slice(0, 300))}`;
        }

        p.note(diagnosisMessage, 'Installation Error');
      }
    }
  }

  // Success message (consolidated, no repetition)
  const setupPath = path.join(utilsDir, 'webawesome.ts');
  const nextSteps = [];

  // Only mention token if not already shown
  if (tier === 'pro' && !tokenWarningShown && !process.env.WA_TOKEN) {
    nextSteps.push(`Set your WA_TOKEN in ${pc.cyan('.env')}`);
  }

  nextSteps.push(`Import Web Awesome in your main file:\n   ${pc.cyan(`import './${setupPath.replace(/\\/g, '/')}';`)}`);
  nextSteps.push(`Add your first component:\n   ${pc.cyan('kigumi add button')}`);

  const formattedSteps = nextSteps
    .map((step, i) => `${i + 1}. ${step}`)
    .join('\n');

  p.note(
    `Configuration: ${pc.cyan('kigumi-components.json')}\n` +
      `Package: ${pc.cyan(packageName)}\n` +
      `Components: ${pc.cyan(componentsDir)}\n` +
      `Setup File: ${pc.cyan(setupPath)}\n` +
      `Theme: ${pc.cyan(kigumiConfig.theme.selected)}\n` +
      `Palette: ${pc.cyan(kigumiConfig.theme.palette)}\n` +
      `Brand Color: ${pc.cyan(kigumiConfig.theme.brandColor)}\n` +
      `Customization: ${pc.cyan('src/styles/theme.css')}` +
      `\n\n${pc.yellow('Next steps:')}\n${formattedSteps}`,
    'Setup Complete! 🎉'
  );

  p.outro(pc.green('Happy coding!'));
}

// Helper function for reinstall-only path
async function reinstallDependencies(cwd: string, config: KigumiConfig) {
  const spinner = p.spinner();
  const projectInfo = await getProjectInfo(cwd);

  // Determine the correct install command for the package manager
  const getInstallCommand = (pm: string) => {
    switch (pm) {
      case 'pnpm':
        return 'pnpm install';
      case 'yarn':
        return 'yarn install';
      case 'bun':
        return 'bun install';
      default:
        return 'npm install';
    }
  };

  const installCmd = getInstallCommand(projectInfo.packageManager);

  // Handle registry configuration based on tier
  const npmrcPath = path.join(cwd, '.npmrc');

  if (config.webAwesome?.tier === 'free') {
    // For FREE tier: ensure we use public npm registry, not Pro registry
    // This prevents issues when user has global .npmrc with Pro registry configured
    const npmrcContent =
      '# Web Awesome Free Tier - use public npm registry\n' +
      '# This overrides any global .npmrc Pro registry settings\n' +
      '@awesome.me:registry=https://registry.npmjs.org/\n';

    await fs.writeFile(npmrcPath, npmrcContent);
  } else if (config.webAwesome?.tier === 'pro') {
    // For PRO tier: configure Pro registry with token
    const hasGlobalProConfig = await (async () => {
      try {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const globalNpmrc = path.join(homeDir, '.npmrc');
        if (await fs.pathExists(globalNpmrc)) {
          const content = await fs.readFile(globalNpmrc, 'utf-8');
          return content.includes('@awesome.me:registry') && content.includes('webawesome-pro');
        }
        return false;
      } catch {
        return false;
      }
    })();

    // Only create .npmrc if user doesn't have global Pro config
    if (!hasGlobalProConfig) {
      const npmrcContent =
        '# Web Awesome Pro - Private Registry\n' +
        '@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro/\n' +
        '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${WEBAWESOME_NPM_TOKEN}\n';

      await fs.writeFile(npmrcPath, npmrcContent);
    }
  }

  // For Pro tier, ensure .env exists
  if (config.webAwesome?.tier === 'pro') {
    const envPath = path.join(cwd, '.env');
    const envExists = await fs.pathExists(envPath);
    const envExamplePath = path.join(cwd, '.env.example');

    if (!envExists) {
      // Create .env from .env.example if it exists, otherwise create basic one
      let envTemplate = '';
      const envExampleExists = await fs.pathExists(envExamplePath);

      if (envExampleExists) {
        envTemplate = await fs.readFile(envExamplePath, 'utf-8');
      } else {
        envTemplate =
          '# Web Awesome Pro Authentication Token\n' +
          '# Get your token from: https://webawesome.com\n' +
          '#\n' +
          '# Steps:\n' +
          '# 1. Sign up or log in at https://webawesome.com\n' +
          '# 2. Go to your team settings\n' +
          '# 3. Generate an API token for your project\n' +
          '#\n' +
          '# For team members: Ask your team lead for the shared Pro token\n' +
          '\n' +
          'WA_TOKEN=your-token-here\n';
      }

      spinner.start('Creating .env file...');
      await fs.writeFile(envPath, envTemplate);
      spinner.stop('.env file created');

      p.note(
        `${pc.yellow('🔐 Web Awesome Pro requires authentication')}\n\n` +
        `${pc.bold('This project uses Web Awesome Pro.')}\n\n` +
        `${pc.bold('Next steps:')}\n\n` +
        `${pc.green('1.')} Get your Pro token:\n` +
        `   ${pc.dim('•')} Sign in at ${pc.cyan('https://webawesome.com')}\n` +
        `   ${pc.dim('•')} Go to Settings → API Tokens\n` +
        `   ${pc.dim('•')} Generate a new token\n` +
        `   ${pc.dim('•')} Or ask your team lead for the shared token\n\n` +
        `${pc.green('2.')} Add token to ${pc.cyan('.env')}:\n` +
        `   ${pc.dim('WA_TOKEN=your-actual-token-here')}\n\n` +
        `${pc.green('3.')} Install all dependencies:\n` +
        `   ${pc.cyan(installCmd)}\n\n` +
        `${pc.dim('Note: .env is gitignored for security')}`,
        'Setup Required for Pro Tier'
      );
      p.outro(pc.yellow('⚠ Set your token before continuing'));
      process.exit(0);
    }

    const hasToken = isValidTokenFormat(process.env.WA_TOKEN);
    if (!hasToken) {
      p.note(
        `${pc.yellow('⚠ WA_TOKEN not found or invalid')}\n\n` +
        `Your ${pc.cyan('.env')} file exists but the token is not set.\n\n` +
        `${pc.bold('To fix:')}\n\n` +
        `${pc.green('1.')} Open ${pc.cyan('.env')} in your editor\n` +
        `${pc.green('2.')} Replace ${pc.dim('your-token-here')} with your actual token\n` +
        `${pc.green('3.')} Get token from: ${pc.cyan('https://webawesome.com')}\n` +
        `${pc.green('4.')} Then run: ${pc.cyan(installCmd)}`,
        'Token Required'
      );
      p.outro(pc.yellow('⚠ Set your token first'));
      process.exit(0);
    }
  }

  // Install all dependencies
  spinner.start('Installing dependencies...');
  try {
    await execa(projectInfo.packageManager, ['install'], {
      cwd,
    });
    spinner.stop('Dependencies installed');
    p.outro(pc.green('✓ All dependencies installed successfully!'));
  } catch (error) {
    spinner.stop('Failed to install dependencies');

    // Extract error details for better diagnostics
    const execaError = error as ExecaError;
    const errorMessage = execaError.message || String(error);
    const stderr = execaError.stderr || '';

    if (config.webAwesome?.tier === 'pro') {
      // Check for authentication errors specifically
      if (stderr.includes('E401') || stderr.includes('Incorrect or missing password') || stderr.includes('authentication')) {
        p.note(
          `${pc.red('Authentication Error - Invalid Token!')}\n\n` +
          `${pc.bold('The WA_TOKEN in your .env is incorrect or expired.')}\n\n` +
          `${pc.yellow('This is a Pro tier project that requires a valid Web Awesome Pro token.')}\n\n` +
          `${pc.bold('How to fix:')}\n\n` +
          `${pc.green('1.')} Go to ${pc.cyan('https://webawesome.com')}\n` +
          `   ${pc.dim('→')} Sign in to your Pro account\n` +
          `   ${pc.dim('→')} Navigate to Settings → API Tokens\n` +
          `   ${pc.dim('→')} Copy your valid Pro token\n\n` +
          `${pc.green('2.')} Update your ${pc.cyan('.env')} file:\n` +
          `   ${pc.dim('WA_TOKEN=your-actual-pro-token-here')}\n\n` +
          `${pc.green('3.')} Verify the token is correct (no extra spaces)\n\n` +
          `${pc.green('4.')} Try again: ${pc.cyan(installCmd)}\n\n` +
          `${pc.dim('If you don\'t have a Pro subscription, change to free tier in kigumi-components.json')}`,
          'Authentication Required'
        );
      } else {
        p.note(
          `${pc.red('Installation failed!')}\n\n` +
          `${pc.bold('Common causes:')}\n\n` +
          `${pc.dim('•')} Invalid or expired token in ${pc.cyan('.env')}\n` +
          `${pc.dim('•')} No Pro subscription at https://webawesome.com\n` +
          `${pc.dim('•')} Network/firewall blocking the registry\n\n` +
          `${pc.bold('To fix:')}\n\n` +
          `${pc.green('1.')} Verify your token at ${pc.cyan('https://webawesome.com')}\n` +
          `${pc.green('2.')} Update ${pc.cyan('.env')} with correct token\n` +
          `${pc.green('3.')} Try again: ${pc.cyan(installCmd)}\n\n` +
          `${pc.dim('Error details:')}\n${pc.dim(errorMessage)}`,
          'Installation Error'
        );
      }
    } else {
      // Free tier - provide detailed diagnostics
      let diagnosisMessage = `${pc.red('Installation failed!')}\n\n`;

      // Try to diagnose the issue
      if (stderr.includes('E401') || stderr.includes('Incorrect or missing password') || stderr.includes('authentication')) {
        diagnosisMessage +=
          `${pc.bold('Issue:')} Authentication error (E401)\n\n` +
          `${pc.yellow('This is a FREE tier project - it should NOT require authentication!')}\n\n` +
          `${pc.bold('Possible causes:')}\n\n` +
          `${pc.dim('•')} You have an old/incorrect .npmrc with auth settings\n` +
          `${pc.dim('•')} npm is trying to use cached credentials\n` +
          `${pc.dim('•')} Wrong registry configuration\n\n` +
          `${pc.bold('How to fix:')}\n\n` +
          `${pc.green('1.')} Remove authentication from npm:\n` +
          `   ${pc.cyan('npm logout')}\n\n` +
          `${pc.green('2.')} Clear npm cache:\n` +
          `   ${pc.cyan('npm cache clean --force')}\n\n` +
          `${pc.green('3.')} Check your .npmrc file for registry overrides:\n` +
          `   ${pc.cyan('cat ~/.npmrc')}\n` +
          `   ${pc.dim('Remove any @awesome.me registry settings')}\n\n` +
          `${pc.green('4.')} Try again:\n` +
          `   ${pc.cyan(installCmd)}\n\n`;
      } else if (stderr.includes('404') || stderr.includes('Not Found')) {
        diagnosisMessage +=
          `${pc.bold('Issue:')} Package not found in registry\n\n` +
          `${pc.bold('Possible causes:')}\n\n` +
          `${pc.dim('•')} Wrong package name in ${pc.cyan('package.json')}\n` +
          `${pc.dim('•')} Package version doesn't exist\n` +
          `${pc.dim('•')} Network/registry connection issues\n\n`;
      } else if (stderr.includes('ENOTFOUND') || stderr.includes('ETIMEDOUT')) {
        diagnosisMessage +=
          `${pc.bold('Issue:')} Network connectivity problem\n\n` +
          `${pc.bold('Possible causes:')}\n\n` +
          `${pc.dim('•')} No internet connection\n` +
          `${pc.dim('•')} Firewall blocking npm registry\n` +
          `${pc.dim('•')} VPN or proxy issues\n\n`;
      } else if (stderr.includes('EACCES') || stderr.includes('permission denied')) {
        diagnosisMessage +=
          `${pc.bold('Issue:')} Permission error\n\n` +
          `${pc.bold('Possible causes:')}\n\n` +
          `${pc.dim('•')} Need to run with sudo (not recommended)\n` +
          `${pc.dim('•')} npm cache permissions issue\n` +
          `${pc.dim('•')} Directory permissions problem\n\n` +
          `${pc.bold('Try:')}\n${pc.cyan(`npm cache clean --force && ${installCmd}`)}\n\n`;
      } else {
        diagnosisMessage +=
          `${pc.bold('Common causes:')}\n\n` +
          `${pc.dim('•')} Network connectivity issues\n` +
          `${pc.dim('•')} npm registry timeout or downtime\n` +
          `${pc.dim('•')} Corrupted package-lock.json or node_modules\n` +
          `${pc.dim('•')} Incompatible package versions\n\n`;
      }

      diagnosisMessage +=
        `${pc.bold('Recommended fixes:')}\n\n` +
        `${pc.green('1.')} Check your internet connection\n` +
        `${pc.green('2.')} Try: ${pc.cyan(`rm -rf node_modules package-lock.json && ${installCmd}`)}\n` +
        `${pc.green('3.')} Verify package.json has correct dependencies\n` +
        `${pc.green('4.')} Try manual install: ${pc.cyan(installCmd)}\n\n` +
        `${pc.dim('Error details:')}\n${pc.dim(errorMessage)}`;

      if (stderr) {
        diagnosisMessage += `\n\n${pc.dim('npm stderr:')}\n${pc.dim(stderr.slice(0, 500))}`;
      }

      p.note(diagnosisMessage, 'Installation Error');
    }
    process.exit(1);
  }
}

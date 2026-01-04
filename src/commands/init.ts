import * as p from '@clack/prompts';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { saveConfig, DEFAULT_CONFIG, type KigumiConfig } from '../utils/config.js';
import { getProjectInfo } from '../utils/detect-framework.js';
import { regenerateWebAwesomeSetup } from '../utils/regenerate.js';

export async function initCommand() {
  console.clear();

  p.intro(pc.bgCyan(pc.black(' kigumi init ')));

  const cwd = process.cwd();

  // Check if already initialized
  const configExists = await fs.pathExists(path.join(cwd, 'kigumi-components.json'));
  if (configExists) {
    const shouldContinue = await p.confirm({
      message: 'kigumi is already initialized. Overwrite configuration?',
      initialValue: false,
    });

    if (p.isCancel(shouldContinue) || !shouldContinue) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
  }

  // Detect project info
  const spinner = p.spinner();
  spinner.start('Detecting project setup...');
  const projectInfo = await getProjectInfo(cwd);
  spinner.stop('Project detected');

  p.note(
    `Framework: ${pc.cyan(projectInfo.framework)}\n` +
      `TypeScript: ${pc.cyan(projectInfo.typescript ? 'Yes' : 'No')}\n` +
      `Package Manager: ${pc.cyan(projectInfo.packageManager)}\n` +
      `Build Tool: ${pc.cyan(projectInfo.hasVite ? 'Vite' : 'Other')}`,
    'Project Info'
  );

  // Interactive prompts
  const config = await p.group(
    {
      framework: () =>
        p.select({
          message: 'Which framework are you using?',
          initialValue: projectInfo.framework !== 'unknown' ? projectInfo.framework : 'react',
          options: [
            { value: 'react', label: 'React' },
            { value: 'vue', label: 'Vue' },
            { value: 'svelte', label: 'Svelte' },
          ],
        }),
      typescript: () =>
        p.confirm({
          message: 'Use TypeScript?',
          initialValue: projectInfo.typescript,
        }),
      tier: () =>
        p.select({
          message: 'Which version of Web Awesome?',
          options: [
            { value: 'free', label: 'Free (Open Source)' },
            { value: 'pro', label: 'Pro (Requires Token)' },
          ],
          initialValue: 'free',
        }),
      theme: () =>
        p.select({
          message: 'Which theme would you like to use?',
          options: [
            { value: 'default', label: 'Default', hint: 'Recommended' },
            { value: 'awesome', label: 'Awesome' },
            { value: 'shoelace', label: 'Shoelace' },
            { value: 'none', label: 'None (Just base styles)' },
          ],
          initialValue: 'default',
        }),
      palette: ({ results }) => {
        // Skip if theme is 'none'
        if (results.theme === 'none') {
          return Promise.resolve('default');
        }

        const tier = results.tier as 'free' | 'pro';
        const options = [
          { value: 'default', label: 'Default', hint: 'Recommended' },
        ];

        // TODO: Add Pro palettes when we have the full list
        // if (tier === 'pro') {
        //   options.push({ value: 'vibrant', label: 'Vibrant' });
        // }

        return p.select({
          message: 'Which color palette?',
          options,
          initialValue: 'default',
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
          initialValue: 'blue',
        });
      },
      componentsDir: () =>
        p.text({
          message: 'Where should we install components?',
          initialValue: DEFAULT_CONFIG.componentsDir,
          placeholder: DEFAULT_CONFIG.componentsDir,
        }),
      utilsDir: () =>
        p.text({
          message: 'Where should we install utilities?',
          initialValue: DEFAULT_CONFIG.utilsDir,
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
      cssVars: true,
      selected: config.theme as 'default' | 'dark' | 'none',
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

  // Create directories
  spinner.start('Creating directories...');
  await fs.ensureDir(path.join(cwd, componentsDir));
  await fs.ensureDir(path.join(cwd, utilsDir));
  await fs.ensureDir(path.join(cwd, 'src/styles'));
  spinner.stop('Directories created');

  // Create .env file if Pro tier
  if (tier === 'pro') {
    const envPath = path.join(cwd, '.env');
    const envExists = await fs.pathExists(envPath);

    if (!envExists) {
      spinner.start('Creating .env file...');
      await fs.writeFile(
        envPath,
        '# Web Awesome Pro authentication token\n' +
          '# Get your token from https://webawesome.com\n' +
          'WA_TOKEN=your-token-here\n'
      );
      spinner.stop('.env file created');
    } else {
      // Check if WA_TOKEN exists in .env
      const envContent = await fs.readFile(envPath, 'utf-8');
      if (!envContent.includes('WA_TOKEN')) {
        spinner.start('Adding WA_TOKEN to .env...');
        await fs.appendFile(
          envPath,
          '\n# Web Awesome Pro authentication token\n' +
            '# Get your token from https://webawesome.com\n' +
            'WA_TOKEN=your-token-here\n'
        );
        spinner.stop('WA_TOKEN added to .env');
      }
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

  // Install dependencies
  const packageName = tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';
  if (config.installWebAwesome) {
    spinner.start(`Installing ${packageName}...`);
    try {
      await execa(projectInfo.packageManager, ['add', packageName], {
        cwd,
      });
      spinner.stop(`${packageName} installed`);
    } catch (error) {
      spinner.stop(`Failed to install ${packageName}`);
      p.note(
        'Please install manually:\n' +
          pc.cyan(`${projectInfo.packageManager} add ${packageName}`) +
          (tier === 'pro' ? '\n\nMake sure to set your WA_TOKEN in .env first!' : ''),
        'Installation Error'
      );
    }
  }

  // Success message
  const setupPath = path.join(utilsDir, 'webawesome.ts');
  const nextSteps = [
    tier === 'pro' && `Set your WA_TOKEN in ${pc.cyan('.env')}`,
    `Import Web Awesome in your main file:\n   ${pc.cyan(`import './${setupPath.replace(/\\/g, '/')}';`)}`,
    `Add your first component:\n   ${pc.cyan('npx kigumi add button')}`,
  ]
    .filter(Boolean)
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
      `\n\n${pc.yellow('Next steps:')}\n${nextSteps}`,
    'Setup Complete! 🎉'
  );

  p.outro(pc.green('Happy coding!'));
}

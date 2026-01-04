import fs from 'fs-extra';
import path from 'path';

export type Framework = 'react' | 'vue' | 'svelte' | 'angular' | 'unknown';

export interface ProjectInfo {
  framework: Framework;
  typescript: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  hasVite: boolean;
}

/**
 * Detect the framework used in the project
 */
export async function detectFramework(cwd: string = process.cwd()): Promise<Framework> {
  const packageJsonPath = path.join(cwd, 'package.json');

  if (!(await fs.pathExists(packageJsonPath))) {
    return 'unknown';
  }

  const packageJson = await fs.readJson(packageJsonPath);
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Check for React
  if (deps.react || deps['@types/react']) {
    return 'react';
  }

  // Check for Vue
  if (deps.vue || deps['@vue/cli-service']) {
    return 'vue';
  }

  // Check for Svelte
  if (deps.svelte || deps['@sveltejs/kit']) {
    return 'svelte';
  }

  // Check for Angular
  if (deps['@angular/core']) {
    return 'angular';
  }

  return 'unknown';
}

/**
 * Detect if the project uses TypeScript
 */
export async function detectTypeScript(cwd: string = process.cwd()): Promise<boolean> {
  const tsconfigPath = path.join(cwd, 'tsconfig.json');
  const packageJsonPath = path.join(cwd, 'package.json');

  // Check for tsconfig.json
  if (await fs.pathExists(tsconfigPath)) {
    return true;
  }

  // Check package.json dependencies
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    return !!deps.typescript;
  }

  return false;
}

/**
 * Detect the package manager used in the project
 */
export async function detectPackageManager(
  cwd: string = process.cwd()
): Promise<'npm' | 'pnpm' | 'yarn' | 'bun'> {
  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (await fs.pathExists(path.join(cwd, 'bun.lockb'))) {
    return 'bun';
  }
  return 'npm';
}

/**
 * Get comprehensive project information
 */
export async function getProjectInfo(cwd: string = process.cwd()): Promise<ProjectInfo> {
  const framework = await detectFramework(cwd);
  const typescript = await detectTypeScript(cwd);
  const packageManager = await detectPackageManager(cwd);

  const packageJsonPath = path.join(cwd, 'package.json');
  let hasVite = false;

  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    hasVite = !!deps.vite;
  }

  return {
    framework,
    typescript,
    packageManager,
    hasVite,
  };
}

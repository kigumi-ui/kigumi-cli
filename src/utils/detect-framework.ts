import fs from 'fs-extra';
import path from 'path';

export type Framework = 'react' | 'vue' | 'svelte' | 'angular' | 'unknown';

/**
 * Meta-framework — the tool that wraps the UI framework.
 *
 * - 'next': Next.js project (App Router or Pages Router).
 * - 'vite': Vite-based project (incl. create-vite, Astro w/ Vite).
 * - 'none': no recognized meta-framework (plain CRA, library, etc.).
 *
 * Informational only — does not branch template rendering. Drives init
 * scaffolding (global.d.ts vs vite-env.d.ts) and post-install hints.
 */
export type MetaFramework = 'next' | 'vite' | 'none';

export interface ProjectInfo {
  framework: Framework;
  typescript: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  metaFramework: MetaFramework;
  /** @deprecated Derived from metaFramework === 'vite'; kept for backwards-compat. */
  hasVite: boolean;
}

/**
 * Detect the framework used in the project
 */
export async function detectFramework(
  cwd: string = process.cwd()
): Promise<Framework> {
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
export async function detectTypeScript(
  cwd: string = process.cwd()
): Promise<boolean> {
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
 * Detect the meta-framework (Next.js, Vite, or none).
 *
 * Next.js takes precedence over Vite: if both `next` and `vite` are in deps
 * (unusual, but possible with some plugin setups), we return 'next'.
 *
 * Detection rules:
 * - 'next': `deps.next` OR `next.config.{js,ts,mjs,cjs}` exists.
 * - 'vite': `deps.vite`.
 * - 'none': neither.
 */
export async function detectMetaFramework(
  cwd: string = process.cwd()
): Promise<MetaFramework> {
  const packageJsonPath = path.join(cwd, 'package.json');
  const deps: Record<string, string> = {};

  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    Object.assign(
      deps,
      packageJson.dependencies ?? {},
      packageJson.devDependencies ?? {}
    );
  }

  if (deps.next) {
    return 'next';
  }

  const nextConfigCandidates = [
    'next.config.js',
    'next.config.ts',
    'next.config.mjs',
    'next.config.cjs',
  ];
  for (const name of nextConfigCandidates) {
    if (await fs.pathExists(path.join(cwd, name))) {
      return 'next';
    }
  }

  if (deps.vite) {
    return 'vite';
  }

  return 'none';
}

/**
 * Detect which Next.js router the project uses.
 *
 * Only meaningful when `detectMetaFramework()` returned 'next'. Callers should
 * guard on that before invoking.
 *
 * - 'app': `app/` or `src/app/` directory exists.
 * - 'pages': `pages/` or `src/pages/` directory exists (and no app/ dir).
 * - 'unknown': neither directory found (fresh scaffold mid-init, etc.).
 */
export async function detectNextRouter(
  cwd: string = process.cwd()
): Promise<'app' | 'pages' | 'unknown'> {
  const appCandidates = ['app', 'src/app'];
  for (const rel of appCandidates) {
    if (await fs.pathExists(path.join(cwd, rel))) {
      return 'app';
    }
  }

  const pagesCandidates = ['pages', 'src/pages'];
  for (const rel of pagesCandidates) {
    if (await fs.pathExists(path.join(cwd, rel))) {
      return 'pages';
    }
  }

  return 'unknown';
}

/**
 * Get comprehensive project information
 */
export async function getProjectInfo(
  cwd: string = process.cwd()
): Promise<ProjectInfo> {
  const framework = await detectFramework(cwd);
  const typescript = await detectTypeScript(cwd);
  const packageManager = await detectPackageManager(cwd);
  const metaFramework = await detectMetaFramework(cwd);

  return {
    framework,
    typescript,
    packageManager,
    metaFramework,
    hasVite: metaFramework === 'vite',
  };
}

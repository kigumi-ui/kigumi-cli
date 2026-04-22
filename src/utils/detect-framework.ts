import fs from 'fs-extra';
import path from 'path';

export type Framework = 'react' | 'vue' | 'svelte' | 'angular' | 'unknown';

/**
 * Which Next.js router the project uses.
 *
 * Only meaningful when `isNextProject()` returned true.
 *
 * - `'app'`: `app/` or `src/app/` directory exists (Next 13+ App Router).
 * - `'pages'`: `pages/` or `src/pages/` directory exists AND no App Router dir.
 * - `'unknown'`: neither directory exists (e.g. fresh scaffold mid-init,
 *   library with `next` as a peer dep). Callers should default to App Router
 *   behavior since that's the modern default.
 *
 * `'app'` wins when both exist — Next.js itself gives App Router precedence
 * over Pages Router for conflicting routes in Next 13+.
 */
export type NextRouter = 'app' | 'pages' | 'unknown';

/**
 * Where the project keeps its source code relative to `cwd`.
 *
 * - `'src'`: app/components/lib live under `src/` (Vite default, Next
 *   `create-next-app --src-dir`).
 * - `'root'`: everything at the repo root (Next `create-next-app` without
 *   `--src-dir`).
 *
 * Used to adapt Kigumi's directory defaults so `@/*` tsconfig paths stay
 * consistent with where the project actually keeps its code.
 */
export type SourceLayout = 'src' | 'root';

export interface ProjectInfo {
  framework: Framework;
  typescript: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun';
  hasVite: boolean;
  isNext: boolean;
  /** Set when `isNext` is true; undefined otherwise. */
  nextRouter?: NextRouter;
  /** Where the project's source lives. Detected for any project, not just Next. */
  sourceLayout: SourceLayout;
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
 * Detect if the project is a Next.js project
 *
 * WHY: Next.js uses React underneath but requires different init handling:
 * no vite config, `'use client'` directives on components, `providers.tsx`
 * Client Module for App Router, and `tsconfig.json` path aliases instead of
 * `tsconfig.app.json`.
 *
 * Detection checks `next` in `package.json` deps first, then falls back to
 * `next.config.{js,mjs,ts,cjs}` for projects where deps may not yet be
 * installed or are hoisted to a workspace root.
 */
export async function isNextProject(
  cwd: string = process.cwd()
): Promise<boolean> {
  const packageJsonPath = path.join(cwd, 'package.json');

  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      if (deps.next) {
        return true;
      }
    } catch (_error) {
      // Fall through to config-file detection on malformed package.json
    }
  }

  for (const name of [
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
    'next.config.cjs',
  ]) {
    if (await fs.pathExists(path.join(cwd, name))) {
      return true;
    }
  }

  return false;
}

/**
 * Detect which Next.js router the project uses.
 *
 * Callers should only invoke this when `isNextProject()` returned true.
 * Returns `'unknown'` when no router directory is present yet (fresh scaffold
 * or unusual layout) — init code defaults to App Router in that case since
 * it's the modern Next.js default.
 *
 * Both `src/` and root layouts are checked. App Router wins if both exist
 * because Next gives it precedence at build time for conflicting routes.
 */
export async function detectNextRouter(
  cwd: string = process.cwd()
): Promise<NextRouter> {
  for (const rel of ['src/app', 'app']) {
    if (await fs.pathExists(path.join(cwd, rel))) {
      return 'app';
    }
  }

  for (const rel of ['src/pages', 'pages']) {
    if (await fs.pathExists(path.join(cwd, rel))) {
      return 'pages';
    }
  }

  return 'unknown';
}

/**
 * Detect whether the project keeps its source under `src/` or at the root.
 *
 * Heuristic: if any of `src/app`, `src/pages`, `src/main.ts(x)`, `src/index.ts(x)`
 * exists, the project uses a `src/` layout. Otherwise it uses the root layout.
 *
 * Used by `kigumi init` to pick `componentsDir` defaults that match the
 * project's existing layout, so `@/*` path aliases stay consistent without
 * rewriting the user's `tsconfig.json`.
 */
export async function detectSourceLayout(
  cwd: string = process.cwd()
): Promise<SourceLayout> {
  const srcMarkers = [
    'src/app',
    'src/pages',
    'src/main.ts',
    'src/main.tsx',
    'src/main.js',
    'src/main.jsx',
    'src/index.ts',
    'src/index.tsx',
  ];

  for (const rel of srcMarkers) {
    if (await fs.pathExists(path.join(cwd, rel))) {
      return 'src';
    }
  }

  return 'root';
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
  const isNext = await isNextProject(cwd);
  const nextRouter = isNext ? await detectNextRouter(cwd) : undefined;
  const sourceLayout = await detectSourceLayout(cwd);

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
    isNext,
    nextRouter,
    sourceLayout,
  };
}

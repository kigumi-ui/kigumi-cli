#!/usr/bin/env node
/**
 * Whether the Theme Agent's trigger.dev task needs a Production deploy:
 *
 *   node scripts/theme-agent-deploy.mjs [<base-sha>]
 *
 * Run by `.github/workflows/theme-agent-deploy.yml` on every push to main,
 * with the commit of the last successful deployment of the `trigger-prod`
 * environment as the base. Writes `deploy=true|false` to `$GITHUB_OUTPUT`
 * (and prints it) and names the bundled files that changed.
 *
 * The task bundles every file its entry points reach through relative
 * imports, the shared Studio modules included, so the list is read from the
 * imports, never kept by hand; `docs/trigger/theme-agent-deploy.test.ts`
 * holds it to esbuild's own bundle of the task. Its config counts too, and
 * of the docs dependencies only what the task loads: the packages it
 * imports and every package they pull in, as the lockfile resolves them,
 * and the trigger.dev CLI that builds it. A bump of the site's own tooling
 * (Vite, Storybook) deploys nothing.
 *
 * Needs the root dependencies (`yaml`) for the lockfile. With no base
 * commit, or when git cannot answer, it deploys: the workflow still waits
 * for a maintainer's approval.
 */

import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

/** The task's directory, as `dirs` in `docs/trigger.config.ts` names it. */
const TRIGGER_DIR = 'docs/trigger';

/** Files outside the import graph that still change what is deployed. */
export const TASK_CONFIG_FILES = ['docs/trigger.config.ts'];

/** Packages that build the task without being loaded by it: by version only. */
export const TASK_TOOL_PACKAGES = ['trigger.dev'];

const LOCKFILE = 'docs/pnpm-lock.yaml';

/**
 * Specifiers a module loads at runtime: static and dynamic imports and
 * re-exports. Type-only imports and exports are left out, as the bundler
 * drops them.
 */
function runtimeSpecifiers(source) {
  const specifiers = [];
  const statement =
    /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(statement)) {
    if (match[2]) continue;
    specifiers.push(match[3]);
  }
  for (const match of source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

const isRelative = (specifier) => /^\.{1,2}\//.test(specifier);

/** A bare specifier's package: `@scope/name/sub` is `@scope/name`. */
function packageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** The file a relative specifier names, as TypeScript resolves `.js` to `.ts`. */
function resolveSpecifier(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  const stem = base.replace(/\.(js|mjs|ts|tsx)$/, '');
  const candidates = [
    base,
    `${stem}.ts`,
    `${stem}.tsx`,
    join(stem, 'index.ts'),
    join(stem, 'index.tsx'),
  ];
  return candidates.find(
    (candidate) => existsSync(candidate) && !candidate.endsWith('/')
  );
}

/** The task's entry points: every module in its directory but the tests. */
function entryPoints(repoRoot) {
  const dir = join(repoRoot, TRIGGER_DIR);
  return readdirSync(dir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => join(dir, file));
}

/**
 * Every file the task's deploy is built from, repository-relative and
 * sorted: the modules its entry points reach, and `TASK_CONFIG_FILES`.
 */
export function taskInputs(repoRoot) {
  return [
    ...taskModules(repoRoot).map((file) => relative(repoRoot, file)),
    ...TASK_CONFIG_FILES,
  ].sort();
}

/** The packages the task loads at runtime, by name, sorted. */
export function taskPackages(repoRoot) {
  const names = new Set();
  for (const file of taskModules(repoRoot)) {
    for (const specifier of runtimeSpecifiers(readFileSync(file, 'utf8'))) {
      if (isRelative(specifier) || specifier.startsWith('node:')) continue;
      names.add(packageName(specifier));
    }
  }
  return [...names].sort();
}

/** The modules the task's entry points reach, absolute paths. */
function taskModules(repoRoot) {
  const seen = new Set();
  const queue = entryPoints(repoRoot);
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of runtimeSpecifiers(readFileSync(file, 'utf8'))) {
      if (!isRelative(specifier)) continue;
      const target = resolveSpecifier(file, specifier);
      if (target && !seen.has(target)) queue.push(target);
    }
  }
  return [...seen];
}

/**
 * A lockfile entry's key: `name@version(peers)`, or the version itself for
 * an alias, whose version already names its package.
 */
function lockKey(name, version) {
  const bare = version.split('(')[0];
  return bare.includes('@') ? version : `${name}@${version}`;
}

/**
 * The lockfile entries behind `names`, as pnpm resolved them for docs/:
 * each package and every package it pulls in, sorted. With `direct`, only
 * the packages themselves.
 */
export function lockedDependencies(lockText, names, { direct = false } = {}) {
  const lock = parse(lockText);
  const importer = lock.importers?.['.'] ?? {};
  const declared = {
    ...importer.optionalDependencies,
    ...importer.devDependencies,
    ...importer.dependencies,
  };
  const snapshots = lock.snapshots ?? {};
  const seen = new Set();
  const queue = names
    .filter((name) => declared[name])
    .map((name) => lockKey(name, declared[name].version));
  while (queue.length > 0) {
    const key = queue.pop();
    if (seen.has(key)) continue;
    seen.add(key);
    if (direct) continue;
    const snapshot = snapshots[key] ?? {};
    for (const deps of [snapshot.dependencies, snapshot.optionalDependencies]) {
      for (const [dep, version] of Object.entries(deps ?? {})) {
        queue.push(lockKey(dep, String(version)));
      }
    }
  }
  return [...seen].sort();
}

/** What the lockfile resolves for the task: its packages whole, its tools by version. */
function lockedForTask(lockText, packages) {
  const tools = packages.filter((name) => TASK_TOOL_PACKAGES.includes(name));
  const loaded = packages.filter((name) => !TASK_TOOL_PACKAGES.includes(name));
  return [
    ...lockedDependencies(lockText, loaded),
    ...lockedDependencies(lockText, tools, { direct: true }),
  ].sort();
}

/**
 * Whether Production needs a deploy: a file the task is built from changed,
 * or, given `packages` and both lockfiles, what the lockfile resolves for
 * them. A base without a lockfile counts as changed.
 */
export function needsDeploy({
  changedFiles,
  inputs,
  packages = [],
  baseLock,
  headLock,
}) {
  const bundled = new Set(inputs);
  if (changedFiles.some((file) => bundled.has(file))) return true;
  if (packages.length === 0 || headLock === undefined) return false;
  if (!baseLock) return true;
  return (
    lockedForTask(baseLock, packages).join('\n') !==
    lockedForTask(headLock, packages).join('\n')
  );
}

function changedSince(repoRoot, base) {
  return execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
}

function report(deploy, reason) {
  const line = `deploy=${deploy}`;
  console.log(`${line} (${reason})`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${line}\n`);
  }
}

function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const base = process.argv[2];
  if (!base) {
    report(true, 'no successful deployment to compare against');
    return;
  }
  let changed;
  try {
    changed = changedSince(repoRoot, base);
  } catch (error) {
    report(true, `git could not diff against ${base}: ${String(error)}`);
    return;
  }
  const inputs = taskInputs(repoRoot);
  const packages = [...taskPackages(repoRoot), ...TASK_TOOL_PACKAGES];
  const headLock = readFileSync(join(repoRoot, LOCKFILE), 'utf8');
  let baseLock = null;
  try {
    baseLock = execFileSync('git', ['show', `${base}:${LOCKFILE}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (_error) {
    // No lockfile at the base: needsDeploy() counts that as changed.
  }
  const since = base.slice(0, 7);
  const bundled = changed.filter((file) => inputs.includes(file));
  if (
    needsDeploy({ changedFiles: changed, inputs, packages, baseLock, headLock })
  ) {
    const reasons =
      bundled.length > 0
        ? bundled.join(', ')
        : `what ${LOCKFILE} resolves for ${packages.join(', ')}`;
    report(true, `changed since ${since}: ${reasons}`);
  } else {
    report(false, `nothing the task is built from changed since ${since}`);
  }
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  main();
}

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
 * holds it to esbuild's own bundle of the task. The task's config and the
 * docs dependencies count too: a new SDK changes what is deployed.
 *
 * Plain Node, no dependencies. With no base commit, or when git cannot
 * answer, it deploys: the workflow still waits for a maintainer's approval.
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

/** The task's directory, as `dirs` in `docs/trigger.config.ts` names it. */
const TRIGGER_DIR = 'docs/trigger';

/** Files outside the import graph that still change what is deployed. */
export const TASK_CONFIG_FILES = [
  'docs/trigger.config.ts',
  'docs/package.json',
  'docs/pnpm-lock.yaml',
];

/**
 * Relative specifiers a module loads at runtime: static and dynamic
 * imports and re-exports. Type-only imports and exports are left out, as
 * the bundler drops them.
 */
function runtimeSpecifiers(source) {
  const specifiers = [];
  const statement =
    /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:[^'";]*?\sfrom\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
  for (const match of source.matchAll(statement)) {
    if (match[2]) continue;
    specifiers.push(match[3]);
  }
  for (const match of source.matchAll(
    /import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g
  )) {
    specifiers.push(match[1]);
  }
  return specifiers;
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
  const seen = new Set();
  const queue = entryPoints(repoRoot);
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of runtimeSpecifiers(readFileSync(file, 'utf8'))) {
      const target = resolveSpecifier(file, specifier);
      if (target && !seen.has(target)) queue.push(target);
    }
  }
  return [
    ...[...seen].map((file) => relative(repoRoot, file)),
    ...TASK_CONFIG_FILES,
  ].sort();
}

/** Whether any of `changedFiles` is one the task is built from. */
export function needsDeploy(changedFiles, inputs) {
  const bundled = new Set(inputs);
  return changedFiles.some((file) => bundled.has(file));
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
  const bundled = changed.filter((file) => inputs.includes(file));
  if (needsDeploy(changed, inputs)) {
    report(true, `changed since ${base.slice(0, 7)}: ${bundled.join(', ')}`);
  } else {
    report(false, `no bundled file changed since ${base.slice(0, 7)}`);
  }
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  main();
}

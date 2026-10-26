#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step" for the two Vercel projects in this repo:
 *
 *   node scripts/vercel-ignore-build.mjs <docs|storybook>
 *
 * Wired up as `ignoreCommand` in docs/vercel.json and
 * docs/storybook/vercel.json. Vercel reads the exit code:
 *   0 -> skip the build
 *   1 -> build
 *
 * A skipped build still counts against Vercel's deployment quota. Branches
 * that never need a deployment are therefore kept out before one exists, by
 * `git.deploymentEnabled` in each vercel.json: the release and Dependabot
 * branches for both projects, and every branch but main for Storybook. This
 * script decides for the deployments that are still created:
 *
 * - docs (kigumi.style) builds when a file the landing page or Studio renders
 *   or serves changed since the branch's last successful deployment, or when
 *   the CLI version changed (the Hero shows it).
 * - storybook (docs.kigumi.style) builds only for a release, when the CLI
 *   version changed. It documents the released CLI, and its changelog and
 *   version badge move only at a release.
 *
 * Runs before `pnpm install`, so: plain Node, no dependencies. Whenever the
 * answer is uncertain (no base commit, git failure) the script builds rather
 * than skips; a wasted build is cheaper than a stale site.
 */

import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { EXCLUDED_DIRS, PUBLISHED_SKILLS } from './publish-skills.mjs';

/** @typedef {'docs' | 'storybook'} Target */

export const TARGETS = /** @type {const} */ (['docs', 'storybook']);

const PRODUCTION_BRANCH = 'main';

/**
 * Branches that never get a deployment, whatever they touch. The same
 * branches are off in `git.deploymentEnabled`; this is the fallback if a
 * deployment is created anyway.
 */
const SKIPPED_BRANCH_PREFIXES = [
  'dependabot/',
  'changeset-release/',
  'changesets-ghcommit-temp/',
];

/**
 * Files under docs/ that kigumi.style neither renders nor serves. Everything
 * else under docs/ builds: a denylist, so a new directory builds by default.
 * @type {RegExp[]}
 */
const LANDING_IGNORED = [
  /^docs\/adr\//,
  /^docs\/agents\//,
  /^docs\/README\.md$/,
  /\/AGENTS\.md$/,
  /^docs\/\.storybook-test\//,
  /^docs\/vitest[^/]*\.ts$/,
  /^docs\/eslint\.config\.js$/,
  /^docs\/\.gitignore$/,
  /\/__tests__\//,
  /\.test\.[^/]+$/,
  /\.example$/,
  // The trigger.dev task deploys on its own (`pnpm deploy:task`) and the
  // prompt eval never ships; `tsc -b` only typechecks them, as CI does.
  /^docs\/trigger\//,
  /^docs\/trigger\.config\.ts$/,
  /^docs\/eval\//,
  // Storybook's own sources: stories, config, its Vercel project, and the
  // components and images that only stories import.
  /^docs\/src\/stories\//,
  /^docs\/\.storybook\//,
  /^docs\/storybook\//,
  /^docs\/src\/components\/(changelog|roadmap|storybook)\//,
  /^docs\/src\/assets\/components\//,
];

/**
 * Files outside docs/ that end up on kigumi.style (llms.txt and the published
 * skills, copied by the docs `prebuild`), and the build pipeline itself. The
 * root package.json counts only through its `version` (docs/vite.config.ts).
 */
const LANDING_EXTERNAL = [
  'llms.txt',
  'scripts/publish-skills.mjs',
  'scripts/generate-skills-index.mjs',
  'scripts/vercel-ignore-build.mjs',
  'scripts/setup-npmrc.mjs',
];

/**
 * @param {string} branch
 * @returns {boolean}
 */
export function isSkippedBranch(branch) {
  return SKIPPED_BRANCH_PREFIXES.some((prefix) => branch.startsWith(prefix));
}

/**
 * @param {string} file repo-relative path, forward slashes
 * @returns {boolean} whether `file` changes what kigumi.style shows
 */
export function isLandingFile(file) {
  if (file.startsWith('docs/')) {
    return !LANDING_IGNORED.some((re) => re.test(file));
  }
  if (LANDING_EXTERNAL.includes(file)) return true;

  // Published skills ship without their excluded directories (publish-skills).
  return PUBLISHED_SKILLS.some((skill) => {
    const prefix = `.claude/skills/${skill}/`;
    if (!file.startsWith(prefix)) return false;
    const dirs = file.slice(prefix.length).split('/').slice(0, -1);
    return !dirs.some((dir) => EXCLUDED_DIRS.includes(dir));
  });
}

/**
 * @param {Target} target
 * @param {string[]} files changed since the base commit
 * @param {boolean} versionChanged whether the root package.json `version`
 *   changed since the base commit
 * @returns {string[]} what makes `target` build; empty to skip
 */
export function buildReasons(target, files, versionChanged) {
  const reasons = versionChanged ? ['package.json (CLI version)'] : [];
  // Storybook's install (setup-npmrc, then `pnpm install` in docs/) is the
  // docs project's too, so every docs build exercises it before a release.
  if (target === 'storybook') return reasons;
  return [...reasons, ...files.filter(isLandingFile)];
}

/**
 * @param {string[]} args
 * @returns {string}
 */
function git(...args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * @param {string} sha
 * @returns {boolean}
 */
function hasCommit(sha) {
  try {
    git('cat-file', '-e', `${sha}^{commit}`);
    return true;
  } catch (_error) {
    // Not in the (shallow) clone.
    return false;
  }
}

/**
 * @param {unknown} error from `git()`
 * @returns {string} the first line git printed, else the error message
 */
function gitError(error) {
  const stderr = /** @type {{ stderr?: unknown }} */ (error)?.stderr;
  const text =
    typeof stderr === 'string' && stderr.trim() ? stderr : String(error);
  return text.trim().split('\n')[0];
}

/**
 * The commit to diff against: the branch's last successful deployment. Without
 * one, main compares with its parent (a commit whose build was skipped changed
 * nothing relevant), and any other branch with where it forked from main.
 * Vercel clones shallowly, so every path may need to fetch history first.
 * @param {string} branch
 * @returns {{ base: string, source: string } | { reason: string }} the base,
 *   or why there is none
 */
function resolveBase(branch) {
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;
  let missing = 'VERCEL_GIT_PREVIOUS_SHA is not set';
  if (previous) {
    let why = 'not in the clone';
    try {
      if (!hasCommit(previous))
        git('fetch', '--quiet', '--depth=1', 'origin', previous);
      if (hasCommit(previous))
        return { base: git('rev-parse', previous), source: 'last deployment' };
    } catch (error) {
      // A force-push can orphan the SHA.
      why = gitError(error);
    }
    missing = `last deployment ${previous.slice(0, 8)} is not fetchable: ${why}`;
  }

  if (branch === PRODUCTION_BRANCH) {
    try {
      try {
        git('fetch', '--quiet', '--deepen=1');
      } catch (_error) {
        // Already a full clone; the parent is there.
      }
      return { base: git('rev-parse', 'HEAD^'), source: `parent; ${missing}` };
    } catch (error) {
      return { reason: `${missing}; no parent: ${gitError(error)}` };
    }
  }

  try {
    git('fetch', '--quiet', '--depth=200', 'origin', PRODUCTION_BRANCH);
    try {
      git('fetch', '--quiet', '--deepen=200');
    } catch (_error) {
      // Already a full clone; nothing to deepen.
    }
    const base = git('merge-base', 'FETCH_HEAD', 'HEAD');
    // An empty diff proves nothing, so build.
    if (base === git('rev-parse', 'HEAD'))
      return { reason: `${missing}; the branch has no commits of its own` };
    return { base, source: `merge-base with main; ${missing}` };
  } catch (error) {
    return {
      reason: `${missing}; no merge-base with main: ${gitError(error)}`,
    };
  }
}

/**
 * @param {string} base
 * @returns {boolean} whether the root package.json `version` differs between
 *   `base` and HEAD; throws when either cannot be read
 */
function versionChanged(base) {
  /** @param {string} rev */
  const version = (rev) =>
    JSON.parse(git('show', `${rev}:package.json`)).version;
  return version(base) !== version('HEAD');
}

/**
 * @param {string[]} argv
 * @returns {0 | 1} Vercel's convention: 0 skips, 1 builds
 */
function main(argv) {
  const target = /** @type {Target} */ (argv[0]);
  if (!TARGETS.includes(target)) {
    console.error(
      `Usage: vercel-ignore-build.mjs <${TARGETS.join('|')}>; building to be safe.`
    );
    return 1;
  }

  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? '';
  if (isSkippedBranch(branch)) {
    console.log(`[${target}] Skip: branch ${branch} never deploys.`);
    return 0;
  }

  const resolved = resolveBase(branch);
  if ('reason' in resolved) {
    console.log(
      `[${target}] Build: no base commit to compare against (${resolved.reason}).`
    );
    return 1;
  }

  let changed;
  try {
    changed = git('diff', '--name-only', resolved.base, 'HEAD')
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    console.log(`[${target}] Build: git diff failed (${gitError(error)}).`);
    return 1;
  }

  let bumped;
  try {
    bumped = versionChanged(resolved.base);
  } catch (error) {
    console.log(
      `[${target}] Build: could not compare the CLI version (${gitError(error)}).`
    );
    return 1;
  }

  const reasons = buildReasons(target, changed, bumped);
  console.log(
    `[${target}] Compared ${changed.length} changed file(s) against ${resolved.base.slice(0, 8)} (${resolved.source}).`
  );
  if (reasons.length === 0) {
    console.log(
      target === 'storybook'
        ? '[storybook] Skip: no release; Storybook deploys only when the CLI version changes.'
        : '[docs] Skip: nothing kigumi.style renders or serves changed.'
    );
    return 0;
  }
  console.log(`[${target}] Build: ${reasons.length} reason(s):`);
  for (const reason of reasons.slice(0, 20)) console.log(`  ${reason}`);
  if (reasons.length > 20) console.log(`  ... and ${reasons.length - 20} more`);
  return 1;
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exit(main(process.argv.slice(2)));
}

#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step" for the two Vercel projects in this repo:
 *
 *   node scripts/vercel-ignore-build.mjs <docs|storybook>
 *
 * Wired up as `ignoreCommand` in docs/vercel.json and
 * docs/storybook/vercel.json. Vercel reads the exit code:
 *   0 -> skip the build (does not count against the deployment quota)
 *   1 -> build
 *
 * Every push to every branch used to build both projects, which exhausted the
 * free quota in a day. Now a project builds only when a file it renders or
 * serves changed since the last successful deployment of the branch.
 *
 * Runs before `pnpm install`, so: plain Node, no dependencies. Whenever the
 * answer is uncertain (no base commit, git failure) the script builds rather
 * than skips; a wasted build is cheaper than a stale site.
 */

import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PUBLISHED_SKILLS } from './publish-skills.mjs';

/** @typedef {'docs' | 'storybook'} Target */

export const TARGETS = /** @type {const} */ (['docs', 'storybook']);

/** Branches that never get a deployment, whatever they touch. */
const SKIPPED_BRANCH_PREFIXES = ['dependabot/'];

/** Changing the build pipeline itself must rebuild both projects. */
const ALWAYS_RELEVANT = [
  'scripts/vercel-ignore-build.mjs',
  'scripts/setup-npmrc.mjs',
];

/**
 * Files under docs/ that neither project renders or serves. Everything else
 * under docs/ is relevant: a denylist, so a new directory builds by default.
 * @type {RegExp[]}
 */
const DOCS_NON_VISUAL = [
  /^docs\/adr\//,
  /^docs\/agents\//,
  /^docs\/README\.md$/,
  /^docs\/\.storybook-test\//,
  /^docs\/vitest[^/]*\.ts$/,
  /^docs\/eslint\.config\.js$/,
  /^docs\/\.gitignore$/,
  /\/__tests__\//,
  /\.test\.[^/]+$/,
  /\.example$/,
];

/** @type {Record<Target, RegExp[]>} */
const DOCS_IGNORED_BY_TARGET = {
  // The landing page never imports stories or the Storybook config.
  docs: [/^docs\/src\/stories\//, /^docs\/\.storybook\//, /^docs\/storybook\//],
  // Storybook keeps all of docs/src: its MDX pages import kigumi-studio.
  storybook: [/^docs\/vercel\.json$/, /^docs\/index\.html$/],
};

/**
 * Files outside docs/ that end up on kigumi.style: the changelog page, the
 * version define in docs/vite.config.ts, llms.txt, and the published skills
 * (docs `prebuild`).
 */
const LANDING_EXTERNAL = [
  'CHANGELOG.md',
  'package.json',
  'llms.txt',
  'scripts/publish-skills.mjs',
  'scripts/generate-skills-index.mjs',
];

/**
 * @param {string} branch
 * @returns {boolean}
 */
export function isSkippedBranch(branch) {
  return SKIPPED_BRANCH_PREFIXES.some((prefix) => branch.startsWith(prefix));
}

/**
 * @param {Target} target
 * @param {string} file repo-relative path, forward slashes
 * @returns {boolean}
 */
export function isRelevant(target, file) {
  if (ALWAYS_RELEVANT.includes(file)) return true;

  if (file.startsWith('docs/')) {
    if (DOCS_NON_VISUAL.some((re) => re.test(file))) return false;
    return !DOCS_IGNORED_BY_TARGET[target].some((re) => re.test(file));
  }

  if (target === 'docs') {
    if (LANDING_EXTERNAL.includes(file)) return true;
    return PUBLISHED_SKILLS.some((skill) =>
      file.startsWith(`.claude/skills/${skill}/`)
    );
  }

  return false;
}

/**
 * @param {Target} target
 * @param {string[]} files
 * @returns {string[]} the files that make `target` rebuild
 */
export function relevantFiles(target, files) {
  return files.filter((file) => isRelevant(target, file));
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
 * The commit to diff against: the branch's last successful deployment, or,
 * for a branch that never deployed, where it forked from main. Vercel clones
 * shallowly, so both paths may need to fetch history first.
 * @returns {{ base: string, source: string } | null}
 */
function resolveBase() {
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;
  if (previous) {
    try {
      if (!hasCommit(previous))
        git('fetch', '--quiet', '--depth=1', 'origin', previous);
      if (hasCommit(previous))
        return { base: git('rev-parse', previous), source: 'last deployment' };
    } catch (_error) {
      // Fall through to the merge-base; a force-push can orphan the SHA.
    }
  }

  try {
    git('fetch', '--quiet', '--depth=200', 'origin', 'main');
    try {
      git('fetch', '--quiet', '--deepen=200');
    } catch (_error) {
      // Already a full clone; nothing to deepen.
    }
    const base = git('merge-base', 'FETCH_HEAD', 'HEAD');
    // HEAD is on main itself (a first production deploy, or an orphaned
    // previous SHA): an empty diff proves nothing, so build.
    if (base === git('rev-parse', 'HEAD')) return null;
    return { base, source: 'merge-base with main' };
  } catch (_error) {
    return null;
  }
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

  const resolved = resolveBase();
  if (!resolved) {
    console.log(`[${target}] Build: no base commit to compare against.`);
    return 1;
  }

  let changed;
  try {
    changed = git('diff', '--name-only', resolved.base, 'HEAD')
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    console.log(`[${target}] Build: git diff failed (${String(error)}).`);
    return 1;
  }

  const relevant = relevantFiles(target, changed);
  console.log(
    `[${target}] Compared ${changed.length} changed file(s) against ${resolved.base.slice(0, 8)} (${resolved.source}).`
  );
  if (relevant.length === 0) {
    console.log(
      `[${target}] Skip: nothing ${target} renders or serves changed.`
    );
    return 0;
  }
  console.log(`[${target}] Build: ${relevant.length} relevant file(s):`);
  for (const file of relevant.slice(0, 20)) console.log(`  ${file}`);
  if (relevant.length > 20)
    console.log(`  ... and ${relevant.length - 20} more`);
  return 1;
}

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exit(main(process.argv.slice(2)));
}

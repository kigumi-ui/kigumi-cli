/**
 * The git half of the PR body and PR log guards (issue #150, ADR 0006):
 * reads the facts `pr-body-rules.ts` checks a body and a log against. Kept
 * apart from the rules so those stay pure, and from the CLIs so this half is
 * testable against a real repository.
 *
 * `base` and `head` are commits. Diffs use the merge base (`base...head`),
 * so commits that landed on main after the branch point do not count, and
 * `--no-renames`, so a rename reads as a deletion plus an addition: git
 * otherwise folds two similar files (two changesets, say) into one rename
 * and the old path disappears from the diff.
 */

import { execFileSync } from 'child_process';

import { higherBump, type Bump } from './pr-body-rules.js';

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function lines(output: string): string[] {
  return output.split('\n').filter((line) => line !== '');
}

/** The highest bump in a changeset's frontmatter, e.g. `'kigumi': minor`. */
function frontmatterBump(changeset: string): Bump {
  const frontmatter =
    /^---\n([\s\S]*?)\n---/.exec(changeset.replace(/\r\n?/g, '\n'))?.[1] ?? '';
  return [...frontmatter.matchAll(/:\s*(patch|minor|major)\s*$/gm)]
    .map((match) => match[1] as Bump)
    .reduce(higherBump, 'none');
}

/**
 * The highest bump across the changesets the branch adds or edits, read as
 * they are at `head`. Changesets already on the base, and ones the branch
 * deletes, say nothing about this PR.
 */
export function changesetBump(cwd: string, base: string, head: string): Bump {
  const changed = lines(
    git(cwd, [
      'diff',
      '--name-only',
      '--no-renames',
      '--diff-filter=AM',
      `${base}...${head}`,
      '--',
      '.changeset',
    ])
  ).filter((path) => path.endsWith('.md') && !path.endsWith('/README.md'));
  return changed
    .map((path) => frontmatterBump(git(cwd, ['show', `${head}:${path}`])))
    .reduce(higherBump, 'none');
}

/** Every file at `head`, plus every file the branch deletes (a body may name those). */
export function knownPaths(
  cwd: string,
  base: string,
  head: string
): Set<string> {
  return new Set([
    ...lines(git(cwd, ['ls-tree', '-r', '--name-only', head])),
    ...lines(
      git(cwd, [
        'diff',
        '--name-only',
        '--no-renames',
        '--diff-filter=D',
        `${base}...${head}`,
      ])
    ),
  ]);
}

/**
 * The merge base of a PR's head and its base branch, as they are on
 * `origin`. A main checkout (the comment-triggered pr-log run) has neither
 * the PR's commits nor necessarily the base branch's tip, so both are
 * fetched under `refs/pr-log/<n>/`, which only pins them for this read and
 * is removed again, even when the fetch fails halfway.
 */
export function prMergeBase(
  cwd: string,
  pr: { number: number; baseRef: string; headSha: string }
): string {
  const headRef = `refs/pr-log/${pr.number}/head`;
  const baseRef = `refs/pr-log/${pr.number}/base`;
  try {
    git(cwd, [
      'fetch',
      '--no-tags',
      '--quiet',
      'origin',
      `+refs/pull/${pr.number}/head:${headRef}`,
      `+refs/heads/${pr.baseRef}:${baseRef}`,
    ]);
    return git(cwd, ['merge-base', baseRef, pr.headSha]).trim();
  } finally {
    git(cwd, ['update-ref', '-d', headRef]);
    git(cwd, ['update-ref', '-d', baseRef]);
  }
}

export interface BranchCommit {
  sha: string;
  /** Committer time, seconds since the epoch. A rebase or amend renews it. */
  committedAt: number;
}

/** The commits on the branch (`base..head`), newest first. */
export function branchCommits(
  cwd: string,
  base: string,
  head: string
): BranchCommit[] {
  return lines(git(cwd, ['log', '--format=%H %ct', `${base}..${head}`])).map(
    (line) => {
      const [sha, time] = line.split(' ');
      return { sha, committedAt: Number(time) };
    }
  );
}

function resolves(cwd: string, ref: string): boolean {
  try {
    git(cwd, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    return true;
  } catch (_error) {
    // rev-parse exits non-zero for an unknown or ambiguous ref: the range is stale.
    return false;
  }
}

/**
 * `git rev-list from..to` as full SHAs, or null when either end does not
 * exist here, e.g. a range a rebase rewrote away. Feeds `logCoverage`.
 */
export function rangeResolver(
  cwd: string
): (from: string, to: string) => string[] | null {
  return (from, to) => {
    if (!resolves(cwd, from) || !resolves(cwd, to)) return null;
    return lines(git(cwd, ['rev-list', `${from}..${to}`]));
  };
}

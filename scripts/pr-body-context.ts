/**
 * The git half of the PR body guard (issue #150, ADR 0006): reads the
 * facts `pr-body-rules.ts` checks a body against. Kept apart from the rules
 * so those stay pure, and from the CLI so this half is testable against a
 * real repository.
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

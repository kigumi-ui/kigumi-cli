/**
 * Tests for the git half of the PR body and PR log guards (issue #150):
 * reading the facts the rules are checked against from a real repository.
 * Every case builds its own temporary repo; nothing is mocked.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  branchCommits,
  changesetBump,
  knownPaths,
  prMergeBase,
  rangeResolver,
} from '../../../scripts/pr-body-context.js';
import { isolatedGitEnv, stripGitEnv } from '../_helpers/git-env.js';

let repo: string;
let restoreGitEnv: () => void;

function git(
  args: string[],
  env: Record<string, string> = {},
  cwd = repo
): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: isolatedGitEnv(env),
  }).trim();
}

function write(path: string, content: string): void {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), content);
}

/** Commits everything with a fixed committer time (seconds since the epoch). */
function commit(message: string, time = 1_000): string {
  git(['add', '-A']);
  git(['commit', '-q', '--allow-empty', '-m', message], {
    GIT_AUTHOR_DATE: `@${time} +0000`,
    GIT_COMMITTER_DATE: `@${time} +0000`,
  });
  return git(['rev-parse', 'HEAD']);
}

function changeset(bump: string): string {
  return `---\n'kigumi': ${bump}\n---\n\n### Fixed\n\n- x\n`;
}

beforeEach(() => {
  // The functions under test spawn git with process.env, not through git().
  restoreGitEnv = stripGitEnv();
  repo = mkdtempSync(join(tmpdir(), 'pr-body-context-'));
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.name', 'Test']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'commit.gpgsign', 'false']);
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
  restoreGitEnv();
});

describe('changesetBump', () => {
  it('is none when the branch adds no changeset', () => {
    write('src/a.ts', 'a');
    const base = commit('base');
    write('src/b.ts', 'b');
    const head = commit('feat');
    expect(changesetBump(repo, base, head)).toBe('none');
  });

  it('is the highest bump among the changesets the branch adds', () => {
    write('.changeset/README.md', 'readme');
    const base = commit('base');
    write('.changeset/one.md', changeset('patch'));
    write('.changeset/two.md', changeset('minor'));
    const head = commit('feat');
    expect(changesetBump(repo, base, head)).toBe('minor');
  });

  it('ignores changesets already on the base and ones the branch deletes', () => {
    write('.changeset/old.md', changeset('major'));
    write('.changeset/gone.md', changeset('major'));
    const base = commit('base');
    rmSync(join(repo, '.changeset/gone.md'));
    write('.changeset/new.md', changeset('patch'));
    const head = commit('feat');
    // Premise: git's rename detection must not fold the deletion and the
    // addition into one rename, or this case never exercises a deletion.
    expect(
      git(['diff', '--name-status', '--no-renames', `${base}...${head}`])
    ).toContain('D\t.changeset/gone.md');
    expect(changesetBump(repo, base, head)).toBe('patch');
  });

  it('counts a changeset the branch edits, reading it as it is at head', () => {
    write('.changeset/x.md', changeset('patch'));
    const base = commit('base');
    write('.changeset/x.md', changeset('major'));
    const head = commit('feat');
    expect(changesetBump(repo, base, head)).toBe('major');
  });

  it('diffs from the merge base once main has moved on', () => {
    // A release on main consumed old.md after the branch was cut. The branch
    // still has it, unchanged since the merge base, so it says nothing about
    // this PR; a diff from main's tip would read it as added.
    write('.changeset/old.md', changeset('major'));
    const forkPoint = commit('base');
    git(['switch', '-q', '-c', 'feature']);
    write('.changeset/new.md', changeset('patch'));
    const head = commit('feat');
    git(['switch', '-q', 'main']);
    rmSync(join(repo, '.changeset/old.md'));
    const movedBase = commit('release');
    // Premise: the base has moved past the fork point.
    expect(git(['merge-base', movedBase, head])).toBe(forkPoint);
    expect(changesetBump(repo, movedBase, head)).toBe('patch');
  });
});

describe('knownPaths', () => {
  it('holds every file at head plus the files the branch deletes', () => {
    write('src/kept.ts', 'k');
    write('scripts/old.ts', 'o');
    const base = commit('base');
    rmSync(join(repo, 'scripts/old.ts'));
    write('scripts/new.ts', 'n');
    const head = commit('feat');
    expect([...knownPaths(repo, base, head)].sort()).toEqual([
      'scripts/new.ts',
      'scripts/old.ts',
      'src/kept.ts',
    ]);
  });

  it('does not count a file main added after the fork as deleted by the branch', () => {
    write('src/kept.ts', 'k');
    const forkPoint = commit('base');
    git(['switch', '-q', '-c', 'feature']);
    write('scripts/new.ts', 'n');
    const head = commit('feat');
    git(['switch', '-q', 'main']);
    write('scripts/main-only.ts', 'm');
    const movedBase = commit('main moves on');
    // Premise: the base has moved past the fork point.
    expect(git(['merge-base', movedBase, head])).toBe(forkPoint);
    expect([...knownPaths(repo, movedBase, head)].sort()).toEqual([
      'scripts/new.ts',
      'src/kept.ts',
    ]);
  });
});

describe('knownPaths: renames', () => {
  it('keeps the old path of a renamed file, which a body may still name', () => {
    write('scripts/old-name.ts', 'export const unchanged = 1;\n'.repeat(20));
    const base = commit('base');
    git(['mv', 'scripts/old-name.ts', 'scripts/new-name.ts']);
    const head = commit('rename');
    expect([...knownPaths(repo, base, head)].sort()).toEqual([
      'scripts/new-name.ts',
      'scripts/old-name.ts',
    ]);
  });
});

describe('branchCommits', () => {
  it('lists the branch commits with their committer time, not the base', () => {
    const base = commit('base', 500);
    const b = commit('b', 1_000);
    const c = commit('c', 2_000);
    expect(branchCommits(repo, base, c)).toEqual([
      { sha: c, committedAt: 2_000 },
      { sha: b, committedAt: 1_000 },
    ]);
  });
});

describe('prMergeBase', () => {
  it('fetches the PR and its base from origin and returns their merge base', () => {
    // `repo` plays GitHub: main moved on after the PR's branch point, and the
    // PR's head is reachable only through refs/pull/7/head.
    const forkPoint = commit('base');
    git(['switch', '-q', '-c', 'feature']);
    const prHead = commit('pr work');
    git(['switch', '-q', 'main']);
    const mainTip = commit('main moves on');
    git(['update-ref', 'refs/pull/7/head', prHead]);
    git(['branch', '-q', '-D', 'feature']);
    const clone = mkdtempSync(join(tmpdir(), 'pr-body-context-clone-'));
    try {
      // --no-local: a path clone would hardlink every object, the PR's too.
      git(['clone', '-q', '--no-local', repo, clone]);
      // Premise: the clone lacks the PR's head, and main's tip is not the
      // merge base, so neither "no fetch" nor "the base tip" can pass.
      expect(() => git(['cat-file', '-e', prHead], {}, clone)).toThrow();
      expect(mainTip).not.toBe(forkPoint);

      expect(
        prMergeBase(clone, { number: 7, baseRef: 'main', headSha: prHead })
      ).toBe(forkPoint);
      expect(git(['for-each-ref', 'refs/pr-log'], {}, clone)).toBe('');
    } finally {
      rmSync(clone, { recursive: true, force: true });
    }
  });
});

describe('rangeResolver', () => {
  it('lists the commits after "from" up to and including "to", by short SHA', () => {
    const a = commit('a', 1_000);
    const b = commit('b', 2_000);
    const c = commit('c', 3_000);
    expect(rangeResolver(repo)(a.slice(0, 7), c.slice(0, 8))).toEqual([c, b]);
  });

  it('returns null when an end does not exist in the repository', () => {
    const a = commit('a');
    expect(rangeResolver(repo)('0'.repeat(40), a)).toBeNull();
  });
});

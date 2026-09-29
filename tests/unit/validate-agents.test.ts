/**
 * Tests for the templates/AGENTS.md count-claim matcher.
 *
 * Every case runs against a synthetic string, never the real file. A test
 * that read templates/AGENTS.md would pass only while the repo happened to
 * be in a particular state, which is the same anti-pattern as the parity
 * test that asserted gaps must exist.
 */
import { execFileSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AGENTS_CHECKS,
  checkHistoryFree,
  checkNoHistory,
  checkTemplateCountClaims,
  checkTestFiles,
  findHistory,
  findTestCountClaim,
  findTestTreeDrift,
  parseTestTree,
  findTemplateCountClaims,
} from '../../scripts/validate-agents.js';

describe('findTemplateCountClaims', () => {
  it('finds a claim in prose', () => {
    expect(
      findTemplateCountClaims('a single set of 84 React templates')
    ).toEqual([
      { framework: 'react', claimed: 84, context: '84 React templates' },
    ]);
  });

  it('finds claims for every framework', () => {
    const claims = findTemplateCountClaims(
      'We ship 84 React templates, 84 Vue templates and 84 Angular templates.'
    );
    expect(claims.map((c) => c.framework)).toEqual(['react', 'vue', 'angular']);
  });

  it('is case-insensitive on the framework name', () => {
    expect(findTemplateCountClaims('80 react templates')).toHaveLength(1);
  });

  it('returns nothing when prose makes no count claim', () => {
    expect(
      findTemplateCountClaims(
        'React templates stay framework-agnostic; do not add "use client".'
      )
    ).toEqual([]);
  });

  it('ignores numbers that are not template counts', () => {
    expect(findTemplateCountClaims('Requires Node 22 and React 19.')).toEqual(
      []
    );
  });
});

describe('checkTemplateCountClaims', () => {
  it('reports nothing when the claim matches reality', () => {
    expect(checkTemplateCountClaims('a set of 84 React templates', 84)).toEqual(
      []
    );
  });

  it('reports a stale claim', () => {
    const errors = checkTemplateCountClaims('a set of 80 React templates', 84);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('80 React templates');
    expect(errors[0]).toContain('84');
  });

  it('names the file and the fix so the message is actionable', () => {
    const [error] = checkTemplateCountClaims(
      '12 Vue templates',
      84,
      'some/FILE.md'
    );
    expect(error).toContain('some/FILE.md');
    expect(error).toContain('templates/vue/');
    expect(error).toContain('Update the sentence to 84');
  });

  it('reports every stale claim, not just the first', () => {
    expect(
      checkTemplateCountClaims('80 React templates and 80 Vue templates', 84)
    ).toHaveLength(2);
  });

  it('reports only the stale claim when others are correct', () => {
    const errors = checkTemplateCountClaims(
      '84 React templates but 80 Angular templates',
      84
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Angular');
  });

  it('tracks the real count rather than a hardcoded literal', () => {
    // The check must follow the registry, so a future 85th component makes
    // the current text stale instead of silently passing.
    expect(checkTemplateCountClaims('84 React templates', 85)).toHaveLength(1);
  });
});

describe('findHistory', () => {
  it('finds the root footer, date stamp after a pipe', () => {
    expect(
      findHistory(
        '# Guide\n\n**Maintained by:** AI Assistants | **Last Updated:** 2026-09-28'
      )
    ).toEqual([
      'line 3: **Maintained by:** AI Assistants | **Last Updated:** 2026-09-28',
    ]);
  });

  it('finds the sub-guide footer and the older colon-outside form', () => {
    expect(findHistory('**Last Updated:** 2026-09-28')).toHaveLength(1);
    expect(findHistory('**Last Updated**: 2026-01-09')).toHaveLength(1);
  });

  it('finds non-ISO date stamps', () => {
    expect(findHistory('Last updated: 29/09/2026')).toHaveLength(1);
    expect(findHistory('**Last Updated:** Sep 29, 2026')).toHaveLength(1);
    expect(findHistory('_Last updated September 29 2026_')).toHaveLength(1);
  });

  it('finds a date stamp after "on" or "as of"', () => {
    expect(findHistory('Last Updated on 2026-09-29')).toHaveLength(1);
    expect(findHistory('_Last updated as of Sep 29, 2026_')).toHaveLength(1);
    expect(findHistory('Last updated on every merge')).toEqual([]);
  });

  it('ignores "Last Updated" followed by a word, not a date', () => {
    expect(findHistory('Keep the Last Updated date out of it')).toEqual([]);
  });

  it('finds a changelog heading at any level', () => {
    expect(findHistory('## Changelog')).toHaveLength(1);
    expect(findHistory('### Change log')).toHaveLength(1);
    expect(findHistory('#### Recent changes')).toHaveLength(1);
    expect(findHistory('## History')).toHaveLength(1);
    expect(findHistory('### Update log')).toHaveLength(1);
  });

  it('ignores prose that names the rule', () => {
    // CLAUDE.md states the rule itself; it must not trip the check.
    expect(
      findHistory(
        'No "Last Updated" date, no changelog. `pnpm validate:agents` rejects a `Last Updated` line'
      )
    ).toEqual([]);
  });

  it('ignores a heading that only contains the word', () => {
    expect(findHistory('## Git history and rebases')).toEqual([]);
  });
});

describe('checkHistoryFree', () => {
  it('names the file and the line', () => {
    const errors = checkHistoryFree(
      'intro\n**Last Updated:** 2026-09-28',
      'tests/AGENTS.md'
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('tests/AGENTS.md');
    expect(errors[0]).toContain('line 2');
  });

  it('reports nothing for a file without history', () => {
    expect(checkHistoryFree('# Guide\n\nState only.', 'AGENTS.md')).toEqual([]);
  });
});

/**
 * A throwaway git repository per test, for the checks that list files with
 * `git ls-files`. `track` writes a file and stages it; `write` only writes it.
 */
function useTempRepo() {
  const repo = { root: '' };
  const savedGitEnv: Record<string, string | undefined> = {};

  beforeEach(async () => {
    // Inside the pre-commit hook git exports GIT_INDEX_FILE and friends;
    // `git ls-files` would then list the real repository, not this one.
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('GIT_')) {
        savedGitEnv[key] = process.env[key];
        delete process.env[key];
      }
    }
    repo.root = await fs.mkdtemp(path.join(os.tmpdir(), 'validate-agents-'));
    execFileSync('git', ['init', '-q'], { cwd: repo.root });
  });

  afterEach(async () => {
    Object.assign(process.env, savedGitEnv);
    await fs.remove(repo.root);
  });

  async function write(file: string, content = ''): Promise<void> {
    await fs.outputFile(path.join(repo.root, file), content);
  }

  async function track(file: string, content = ''): Promise<void> {
    await write(file, content);
    execFileSync('git', ['add', file], { cwd: repo.root });
  }

  return { repo, write, track };
}

describe('checkNoHistory', () => {
  const { repo, track } = useTempRepo();

  it('finds history in a nested AGENTS.md no list names', async () => {
    await track('AGENTS.md', '# Root\n');
    await track('docs/new-area/AGENTS.md', '**Last Updated:** 2026-09-28\n');
    await track('CLAUDE.md', '# Rules\n');

    const errors = await checkNoHistory(repo.root);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('docs/new-area/AGENTS.md');
  });

  it('checks CLAUDE.md too', async () => {
    await track('AGENTS.md', '# Root\n');
    await track('CLAUDE.md', '## Changelog\n');

    expect(await checkNoHistory(repo.root)).toHaveLength(1);
  });

  it('passes a tree without history', async () => {
    await track('AGENTS.md', '# Root\n');
    await track('src/AGENTS.md', '**Parent:** [AGENTS.md](../AGENTS.md)\n');

    expect(await checkNoHistory(repo.root)).toEqual([]);
  });

  it('fails rather than passes when it found nothing to check', async () => {
    // An empty file list would make every run green.
    expect(await checkNoHistory(repo.root)).toEqual([
      'git ls-files found no root AGENTS.md, so no file was checked',
    ]);
  });

  it('is one of the checks validate:agents runs', () => {
    expect(AGENTS_CHECKS.map((check) => check.fn)).toContain(checkNoHistory);
  });
});

describe('findTestCountClaim', () => {
  it('finds the count the tree used to state', () => {
    expect(
      findTestCountClaim(
        '├── unit/                    # Fast, isolated tests (120 files at top level, ~1500 tests)'
      )
    ).toBe('unit/                    # Fast, isolated tests (120 files');
  });

  it('passes the tree line without a count', () => {
    expect(
      findTestCountClaim(
        '├── unit/                    # Fast, isolated tests (more under eslint-rules/, scripts/, schemas/)'
      )
    ).toBeNull();
  });
});

/** A tests/AGENTS.md holding `tree` as its fenced directory tree. */
function agentsWithTree(tree: string): string {
  return `# Tests\n\n\`\`\`\ntests/\n${tree}\`\`\`\n`;
}

describe('parseTestTree', () => {
  it('reads each test-file row as its path under tests/', () => {
    const tree = parseTestTree(
      agentsWithTree(
        [
          '├── unit/                    # Fast tests',
          '│   ├── add.test.ts          # Add command',
          '│   ├── helper.ts            # not a test file',
          '│   ├── scripts/',
          '│   │   ├── README.md',
          '│   │   └── gen.test.ts      # Generator',
          '│   └── zeta.test.ts         # after the subdirectory closed',
          '└── e2e/',
          '    └── smoke.test.ts',
          '',
        ].join('\n')
      )
    );
    expect(tree).toEqual({
      found: true,
      rows: [
        'unit/add.test.ts',
        'unit/scripts/gen.test.ts',
        'unit/zeta.test.ts',
        'e2e/smoke.test.ts',
      ],
      unreadable: [],
    });
  });

  it('joins a row that carries its own directory prefix', () => {
    expect(
      parseTestTree(agentsWithTree('├── unit/\n│   └── scripts/gen.test.ts\n'))
        .rows
    ).toEqual(['unit/scripts/gen.test.ts']);
  });

  it('ignores test files named in prose outside the tree', () => {
    const content =
      'We replaced `gone.test.ts` with **other.test.ts**.\n' +
      agentsWithTree('├── unit/\n│   └── kept.test.ts\n');
    expect(parseTestTree(content).rows).toEqual(['unit/kept.test.ts']);
  });

  it('reports a tree line it cannot place, rather than skipping it', () => {
    const tree = parseTestTree(
      agentsWithTree('├── unit/\n│  ├── misindented.test.ts\n')
    );
    expect(tree.unreadable).toEqual(['│  ├── misindented.test.ts']);
  });

  it('reports no tree when the fenced tests/ block is missing', () => {
    expect(parseTestTree('# Tests\n\nNo tree here.\n')).toEqual({
      found: false,
      rows: [],
      unreadable: [],
    });
  });
});

describe('findTestTreeDrift', () => {
  it('passes a tree that lists exactly the files on disk', () => {
    expect(
      findTestTreeDrift(
        ['unit/a.test.ts', 'unit/scripts/b.test.ts'],
        ['unit/a.test.ts', 'unit/scripts/b.test.ts']
      )
    ).toEqual([]);
  });

  it('flags a row whose test file was deleted', () => {
    expect(
      findTestTreeDrift(
        ['unit/a.test.ts', 'unit/gone.test.ts'],
        ['unit/a.test.ts']
      )
    ).toEqual([
      'tests/AGENTS.md tree lists tests/unit/gone.test.ts, which does not exist',
    ]);
  });

  it('flags a test file with no row, in any directory', () => {
    expect(
      findTestTreeDrift(
        ['unit/a.test.ts'],
        ['unit/a.test.ts', 'unit/utils/b.test.ts']
      )
    ).toEqual([
      'tests/AGENTS.md tree has no row for tests/unit/utils/b.test.ts',
    ]);
  });

  it('matches whole paths, so a longer name does not list a shorter one', () => {
    expect(
      findTestTreeDrift(
        ['unit/github-token.test.ts'],
        ['unit/github-token.test.ts', 'unit/token.test.ts']
      )
    ).toEqual(['tests/AGENTS.md tree has no row for tests/unit/token.test.ts']);
  });

  it('does not accept a same-named file in another directory', () => {
    expect(
      findTestTreeDrift(['unit/init.test.ts'], ['integration/init.test.ts'])
    ).toEqual([
      'tests/AGENTS.md tree has no row for tests/integration/init.test.ts',
      'tests/AGENTS.md tree lists tests/unit/init.test.ts, which does not exist',
    ]);
  });

  it('lets a glob row cover the files it matches in its own directory', () => {
    expect(
      findTestTreeDrift(
        ['integration/*.test.ts', 'unit/{a,b}.test.ts'],
        ['integration/init.test.ts', 'unit/a.test.ts', 'unit/b.test.ts']
      )
    ).toEqual([]);
  });

  it('does not let a glob row reach into a subdirectory', () => {
    expect(
      findTestTreeDrift(
        ['integration/*.test.ts'],
        ['integration/init.test.ts', 'integration/deep/x.test.ts']
      )
    ).toEqual([
      'tests/AGENTS.md tree has no row for tests/integration/deep/x.test.ts',
    ]);
  });

  it('flags a glob row that matches no file', () => {
    expect(
      findTestTreeDrift(
        ['unit/a.test.ts', 'e2e/consumer-*.test.ts'],
        ['unit/a.test.ts']
      )
    ).toEqual([
      'tests/AGENTS.md tree lists tests/e2e/consumer-*.test.ts, which matches no test file',
    ]);
  });
});

describe('checkTestFiles', () => {
  const { repo, write, track } = useTempRepo();

  it('flags a deleted row and an unlisted file', async () => {
    await track('tests/unit/kept.test.ts');
    await track('tests/unit/scripts/new.test.ts');
    await track(
      'tests/AGENTS.md',
      agentsWithTree('├── unit/\n│   ├── kept.test.ts\n│   └── gone.test.ts\n')
    );

    expect(await checkTestFiles(repo.root)).toEqual([
      'tests/AGENTS.md tree has no row for tests/unit/scripts/new.test.ts',
      'tests/AGENTS.md tree lists tests/unit/gone.test.ts, which does not exist',
    ]);
  });

  it('passes a tree in step with the files', async () => {
    await track('tests/unit/kept.test.ts');
    await track('tests/e2e/smoke.test.ts');
    await track(
      'tests/AGENTS.md',
      agentsWithTree(
        '├── unit/\n│   └── kept.test.ts\n└── e2e/\n    └── smoke.test.ts\n'
      )
    );

    expect(await checkTestFiles(repo.root)).toEqual([]);
  });

  it('sees a new test file before it is staged', async () => {
    await track('tests/AGENTS.md', agentsWithTree('├── unit/\n'));
    await write('tests/unit/unstaged.test.ts');

    expect(await checkTestFiles(repo.root)).toEqual([
      'tests/AGENTS.md tree has no row for tests/unit/unstaged.test.ts',
    ]);
  });

  it('skips recorded CLI output under tests/fixtures', async () => {
    await track(
      'tests/AGENTS.md',
      agentsWithTree('├── unit/\n│   └── a.test.ts\n')
    );
    await track('tests/unit/a.test.ts');
    await track('tests/fixtures/starter-snapshots/react/X.test.tsx');

    expect(await checkTestFiles(repo.root)).toEqual([]);
  });

  it('fails rather than passes when there is no tree to check', async () => {
    await track('tests/AGENTS.md', '# Tests\n');
    await track('tests/unit/a.test.ts');

    expect(await checkTestFiles(repo.root)).toEqual([
      'tests/AGENTS.md has no fenced `tests/` tree, so no test file was checked',
    ]);
  });

  it('reports a tree line it cannot place', async () => {
    await track('tests/unit/a.test.ts');
    await track(
      'tests/AGENTS.md',
      agentsWithTree('├── unit/\n│   ├── a.test.ts\n│  └── bad.test.ts\n')
    );

    expect(await checkTestFiles(repo.root)).toEqual([
      'tests/AGENTS.md tree line cannot be placed in the tree: "│  └── bad.test.ts"',
    ]);
  });

  it('is one of the checks validate:agents runs', () => {
    expect(AGENTS_CHECKS.map((check) => check.fn)).toContain(checkTestFiles);
  });
});

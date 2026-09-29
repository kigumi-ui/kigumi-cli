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
  findStaleTestRows,
  findTestCountClaim,
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

describe('checkNoHistory', () => {
  let root: string;
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
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'validate-agents-'));
    execFileSync('git', ['init', '-q'], { cwd: root });
  });

  afterEach(async () => {
    Object.assign(process.env, savedGitEnv);
    await fs.remove(root);
  });

  async function track(file: string, content: string): Promise<void> {
    await fs.outputFile(path.join(root, file), content);
    execFileSync('git', ['add', file], { cwd: root });
  }

  it('finds history in a nested AGENTS.md no list names', async () => {
    await track('AGENTS.md', '# Root\n');
    await track('docs/new-area/AGENTS.md', '**Last Updated:** 2026-09-28\n');
    await track('CLAUDE.md', '# Rules\n');

    const errors = await checkNoHistory(root);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('docs/new-area/AGENTS.md');
  });

  it('checks CLAUDE.md too', async () => {
    await track('AGENTS.md', '# Root\n');
    await track('CLAUDE.md', '## Changelog\n');

    expect(await checkNoHistory(root)).toHaveLength(1);
  });

  it('passes a tree without history', async () => {
    await track('AGENTS.md', '# Root\n');
    await track('src/AGENTS.md', '**Parent:** [AGENTS.md](../AGENTS.md)\n');

    expect(await checkNoHistory(root)).toEqual([]);
  });

  it('fails rather than passes when it found nothing to check', async () => {
    // An empty file list would make every run green.
    expect(await checkNoHistory(root)).toEqual([
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

describe('findStaleTestRows', () => {
  it('finds a row naming a test file that no longer exists', () => {
    expect(
      findStaleTestRows(
        '│   ├── gone.test.ts          # Deleted two PRs ago\n' +
          '│   ├── kept.test.ts          # Still here\n',
        new Set(['kept.test.ts'])
      )
    ).toEqual(['gone.test.ts']);
  });

  it('passes a row whose file lives in a subdirectory', () => {
    // The set holds basenames from every directory under tests/.
    expect(
      findStaleTestRows(
        '│   │   └── no-any.test.ts # RuleTester',
        new Set(['no-any.test.ts'])
      )
    ).toEqual([]);
  });

  it('skips glob patterns, which name no single file', () => {
    expect(
      findStaleTestRows(
        '│   └── *.test.ts # Tests that require built CLI\n' +
          '#### Consumer tsc (`consumer-tsc-*.test.ts`)\n' +
          'Pro lanes: `consumer-tsc-*-pro.test.ts`, `$name.test.ts`\n',
        new Set()
      )
    ).toEqual([]);
  });

  it('reports a stale name once however often it is mentioned', () => {
    expect(
      findStaleTestRows('gone.test.ts, and again: `gone.test.ts`', new Set())
    ).toEqual(['gone.test.ts']);
  });
});

describe('checkTestFiles', () => {
  let root: string;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'validate-agents-tests-'));
  });

  afterEach(async () => {
    await fs.remove(root);
  });

  async function write(file: string, content = ''): Promise<void> {
    await fs.outputFile(path.join(root, file), content);
  }

  it('flags a tree row whose test file was deleted', async () => {
    await write('tests/unit/kept.test.ts');
    await write(
      'tests/AGENTS.md',
      '├── kept.test.ts # here\n├── gone.test.ts # deleted\n'
    );

    expect(await checkTestFiles(root)).toEqual([
      'tests/AGENTS.md names a test file that does not exist: gone.test.ts',
    ]);
  });

  it('passes rows for test files outside tests/unit', async () => {
    await write('tests/unit/kept.test.ts');
    await write('tests/e2e/smoke.test.ts');
    await write('tests/unit/scripts/nested.test.ts');
    await write(
      'tests/AGENTS.md',
      '├── kept.test.ts\n├── smoke.test.ts\n├── nested.test.ts\n'
    );

    expect(await checkTestFiles(root)).toEqual([]);
  });

  it('still flags a unit test file the tree does not list', async () => {
    await write('tests/unit/kept.test.ts');
    await write('tests/unit/unlisted.test.ts');
    await write('tests/AGENTS.md', '├── kept.test.ts\n');

    expect(await checkTestFiles(root)).toEqual([
      'tests/AGENTS.md tree is missing test file: unlisted.test.ts',
    ]);
  });

  it('is one of the checks validate:agents runs', () => {
    expect(AGENTS_CHECKS.map((check) => check.fn)).toContain(checkTestFiles);
  });
});

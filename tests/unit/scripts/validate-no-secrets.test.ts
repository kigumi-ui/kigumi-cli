/**
 * Committed-Secret Checker Tests
 *
 * The guard exists because a live Chromatic project token sat in
 * `docs/package.json` as `--project-token=chpt_...` while CI read the same
 * credential from a repository secret. The repo is about to go public, so a
 * committed credential is the one class of mistake that cannot be undone by a
 * later commit.
 *
 * The two matchers are pure and exported so these tests drive the real
 * decision logic rather than a copy of it (see tests/AGENTS.md, "Internals
 * Exported for Test Coverage").
 *
 * The balance being pinned: catch real provider-prefixed credentials, and stay
 * quiet on the placeholders that docs and fixtures legitimately contain. A
 * check that fires on `your_token_here` gets switched off, and a switched-off
 * check protects nothing.
 */

import { describe, expect, it } from 'vitest';
import {
  findHomePaths,
  findSecretsInText,
  findTrackedEnvFiles,
  isPlaceholder,
  isScannable,
} from '../../../scripts/validate-no-secrets.js';

describe('isPlaceholder', () => {
  it.each([
    ['your_token_here', 'the .env.example convention'],
    ['abcdefghij1234567890', 'the WEBAWESOME_NPM_TOKEN test fixture'],
    ['abc123def456ghi789jkl012mno345', 'the CopyButton story fixture'],
    ['xxxxxxxxxxxxxxxxxxxx', 'redaction filler'],
    ['0000000000000000', 'zero filler'],
    ['testtoken', 'no digits and no uppercase'],
  ])('treats %s as a placeholder (%s)', (value) => {
    expect(isPlaceholder(value)).toBe(true);
  });

  it.each([
    ['4e3397305b8d707', 'the real Chromatic token that motivated this guard'],
    ['q35C7wv3msiiSrTRR1Ln_', 'a real Web Awesome Pro token shape'],
    ['oWNZNH2SvMIfF0LPE_KuZ', 'another real Pro token shape'],
  ])('treats %s as a real credential (%s)', (value) => {
    expect(isPlaceholder(value)).toBe(false);
  });
});

describe('findSecretsInText', () => {
  it('catches the exact line this guard was written for', () => {
    const findings = findSecretsInText(
      'docs/package.json',
      '    "chromatic": "chromatic --project-token=chpt_4e3397305b8d707",'
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]!.kind).toBe('Chromatic project token');
    expect(findings[0]!.line).toBe(1);
  });

  it('redacts the credential so it is not reprinted in CI logs', () => {
    const findings = findSecretsInText('x.json', 'token=chpt_4e3397305b8d707');

    expect(findings[0]!.excerpt).not.toContain('4e3397305b8d707');
    expect(findings[0]!.excerpt).toContain('*');
  });

  it('reports the correct 1-based line number', () => {
    const findings = findSecretsInText(
      'x.ts',
      ['first', 'second', 'ghp_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'].join('\n')
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]!.line).toBe(3);
  });

  it.each([
    ['npm access token', 'npm_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'],
    ['GitHub token', 'ghp_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'],
    ['AWS access key id', 'AKIAQ7RSTUVW3XYZ2ABC'],
    ['Anthropic API key', 'sk-ant-A1b2C3d4E5f6G7h8I9j0K1l2M3'],
    ['Stripe live key', 'sk_live_A1b2C3d4E5f6G7h8I9j0'],
  ])('detects a %s', (kind, literal) => {
    const findings = findSecretsInText('x.ts', `const t = "${literal}";`);
    expect(findings.map((f) => f.kind)).toContain(kind);
  });

  it('stays quiet on the placeholders already in this repo', () => {
    const realLines = [
      'WEBAWESOME_NPM_TOKEN=your_token_here',
      "process.env.WEBAWESOME_NPM_TOKEN = 'abcdefghij1234567890'",
      "const key = 'sk_live_abc123def456ghi789jkl012mno345';",
      "const BANNER_STORAGE_KEY = 'banner-20260823-dismissed';",
    ].join('\n');

    expect(findSecretsInText('x.ts', realLines)).toEqual([]);
  });

  it('finds every occurrence when one line carries two credentials', () => {
    const findings = findSecretsInText(
      'x.ts',
      'a=chpt_4e3397305b8d707 b=chpt_9f8e7d6c5b4a321'
    );

    expect(findings).toHaveLength(2);
  });

  it('does not leak regex state between lines', () => {
    // The patterns are global and shared across calls. Nothing resets
    // lastIndex explicitly; the exec loop running to completion is what does
    // it. This pins that, so an early `break` added later fails here rather
    // than silently skipping every second occurrence.
    const line = 'token=chpt_4e3397305b8d707';
    const findings = findSecretsInText('x.ts', [line, line, line].join('\n'));

    expect(findings.map((f) => f.line)).toEqual([1, 2, 3]);
  });
});

describe('findHomePaths', () => {
  // A home path is not a credential, but it leaks the maintainer's username to
  // every clone and is useless to anyone else: the path does not exist on their
  // machine. Both husky hooks carried one.
  it('catches the hook line this check was written for', () => {
    const findings = findHomePaths(
      '.husky/post-commit',
      "_PINNED='/Users/mmustermann/Library/Application Support/x/bin/python'"
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]!.kind).toBe('absolute home-directory path');
  });

  it('catches a Linux home path too', () => {
    expect(
      findHomePaths('x.sh', 'PATH=/home/mmustermann/.local/bin')
    ).toHaveLength(1);
  });

  it.each([
    '/Users/you/projects/app',
    '/Users/username/dev',
    '/home/runner/work/repo',
    '/home/ubuntu/app',
  ])('allows the documentation placeholder %s', (path) => {
    expect(findHomePaths('README.md', `cd ${path}`)).toEqual([]);
  });

  it('ignores a relative path that merely contains the word users', () => {
    expect(findHomePaths('x.ts', "const p = 'src/users/list.ts';")).toEqual([]);
  });

  it('reports each occurrence with its line number', () => {
    const findings = findHomePaths(
      'x.sh',
      ['a=/Users/mmustermann/one', 'b=2', 'c=/home/mmustermann/two'].join('\n')
    );

    expect(findings.map((f) => f.line)).toEqual([1, 3]);
  });

  it('does not leak regex state across calls', () => {
    // The pattern is module-level and global. Two identical calls must give
    // identical results, or a stale lastIndex is silently skipping matches.
    const line = 'p=/Users/mmustermann/x';
    expect(findHomePaths('a.sh', line)).toHaveLength(1);
    expect(findHomePaths('b.sh', line)).toHaveLength(1);
    expect(findHomePaths('c.sh', line)).toHaveLength(1);
  });
});

describe('findTrackedEnvFiles', () => {
  it('flags a tracked .env but not its .example sibling', () => {
    const flagged = findTrackedEnvFiles([
      '.env',
      '.env.example',
      'docs/.env',
      'docs/.env.example',
      'src/index.ts',
    ]);

    expect(flagged).toEqual(['.env', 'docs/.env']);
  });

  it('allows the .sample convention too', () => {
    expect(findTrackedEnvFiles(['.env.sample'])).toEqual([]);
  });

  it('does not flag a file that merely starts with env', () => {
    expect(findTrackedEnvFiles(['src/environment.ts'])).toEqual([]);
  });
});

describe('isScannable', () => {
  it('skips binary assets where a match would be coincidence', () => {
    expect(isScannable('docs/public/logo.png')).toBe(false);
    expect(isScannable('assets/font.woff2')).toBe(false);
  });

  it('scans source and config', () => {
    expect(isScannable('docs/package.json')).toBe(true);
    expect(isScannable('src/index.ts')).toBe(true);
  });
});

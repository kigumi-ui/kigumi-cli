/**
 * Tests for the PR body and PR log rules (issue #150, ADR 0006).
 *
 * The PR body is the squash commit on main, so these rules keep it short and
 * true: four allowed headings, no constructs that are noise in `git log`, and
 * claims that must match the diff. Every expected value here is a literal
 * worked example, never recomputed the way the rule computes it.
 */
import { describe, expect, it } from 'vitest';

import {
  bodyEdit,
  checkBody,
  checkRewrite,
  isExempt,
  logCoverage,
  logStatus,
  mentionedIssues,
  type BodyContext,
  type BodyFinding,
  type LogComment,
} from '../../../scripts/pr-body-rules.js';

function context(overrides: Partial<BodyContext> = {}): BodyContext {
  return {
    exempt: null,
    draft: false,
    changesetBump: 'none',
    existingIssues: new Set([6, 150]),
    knownPaths: new Set(['scripts/event-types.ts', 'AGENTS.md']),
    commentIds: new Set([5870061109]),
    ...overrides,
  };
}

/** A body that satisfies every rule on a non-draft PR. */
const VALID = [
  'Closes #150',
  '',
  'PR bodies stay short because they become the commit on main.',
  '',
  '## Impact',
  'none: contributor workflow only.',
  '',
  '## Verification',
  'CI only',
].join('\n');

/**
 * VALID with `extra` inserted after the summary (from line 5 on), so it does
 * not become part of the last section. Adds `extra.length + 2` characters.
 */
function valid(extra: string): string {
  return VALID.replace('main.\n', `main.\n\n${extra}\n`);
}

function rules(findings: BodyFinding[]): string[] {
  return findings.map((f) => f.rule);
}

describe('checkBody: headings', () => {
  it('accepts a body using only the four allowed headings', () => {
    const body = [
      'Closes #6',
      '',
      'Summary.',
      '',
      '## Deviations from #6',
      '- one',
      '',
      '## Impact',
      'none',
      '',
      '## Review focus',
      'The resolver order in `scripts/event-types.ts`.',
      '',
      '## Verification',
      'CI only',
    ].join('\n');
    expect(checkBody(body, context())).toEqual([]);
  });

  it('rejects a heading outside the four, naming it and its line', () => {
    const findings = checkBody(
      `${VALID}\n\n## Review\nRound two fixed the parity test.`,
      context()
    );
    expect(findings).toEqual([
      {
        rule: 'heading',
        line: 11,
        message: 'heading "## Review" is not allowed',
      },
    ]);
  });

  it('ignores heading-shaped lines inside a fenced code block', () => {
    const body = valid('```sh\n# install\npnpm install\n```');
    expect(checkBody(body, context())).toEqual([]);
  });

  it('reads a backtick run closed on its own line as inline code, not a fence', () => {
    // CommonMark: a backtick fence's info string holds no backtick. As a
    // fence, this line would hide the table and both required headings.
    const body = valid(
      '```pnpm test``` runs the suite.\n\n| a | b |\n| - | - |'
    );
    expect(rules(checkBody(body, context()))).toEqual(['table']);
  });

  it('keeps a fence open past a marker line that carries an info string', () => {
    // Only a bare marker closes a fence; "```ts" inside one is content.
    const body = valid('```md\nExample:\n```ts\n## Not a heading\n```');
    expect(checkBody(body, context())).toEqual([]);
  });

  it('rejects a setext heading, which renders like "## Review"', () => {
    expect(checkBody(valid('Review\n------\nText.'), context())).toEqual([
      {
        rule: 'heading',
        line: 5,
        message: 'heading "Review" (underlined) is not allowed',
      },
    ]);
  });

  it('accepts ordered and unordered lists', () => {
    const body = `${VALID}\n\n## Review focus\n1. first\n2. second\n- a\n  * nested`;
    expect(checkBody(body, context())).toEqual([]);
  });

  it('rejects an allowed heading used twice', () => {
    expect(rules(checkBody(`${VALID}\n\n## Impact\nminor`, context()))).toEqual(
      ['duplicate-heading']
    );
  });
});

describe('checkBody: constructs that are noise in git log', () => {
  it('rejects a markdown table', () => {
    const findings = checkBody(
      valid('| Injected bug | Result |\n| --- | --- |\n| x | red |'),
      context()
    );
    expect(findings).toEqual([
      {
        rule: 'table',
        line: 6,
        message:
          'tables break when the body becomes a commit message; put them in a log comment',
      },
    ]);
  });

  it('rejects an aligned table delimiter row without outer pipes', () => {
    expect(
      rules(checkBody(valid('a | b\n:-- | --:\n1 | 2'), context()))
    ).toEqual(['table']);
  });

  it('rejects <details>, whatever its casing', () => {
    expect(
      rules(
        checkBody(valid('<DETAILS><summary>x</summary>y</DETAILS>'), context())
      )
    ).toEqual(['details']);
  });

  it('rejects an HTML comment, such as leftover template guidance', () => {
    expect(
      rules(checkBody(`<!-- What changed and why? -->\n${VALID}`, context()))
    ).toEqual(['html-comment']);
  });

  it('rejects ticked and unticked checklist items', () => {
    expect(
      rules(checkBody(valid('- [ ] one\n* [x] two\n+ [X] three'), context()))
    ).toEqual(['checklist', 'checklist', 'checklist']);
  });

  it('allows naming them in inline code, which renders literally', () => {
    const body = `${VALID}\n\n## Review focus\nThe \`<!--\` ban and the \`<details>\` ban.`;
    expect(checkBody(body, context())).toEqual([]);
  });

  it('ignores all of them inside a fenced code block', () => {
    const body = valid(
      '~~~md\n| a | b |\n| - | - |\n<!-- c -->\n<details>\n- [ ] d\n~~~'
    );
    expect(checkBody(body, context())).toEqual([]);
  });
});

describe('checkBody: size', () => {
  it('accepts a body of exactly 2,500 characters', () => {
    const body = valid('x'.repeat(2500 - VALID.length - 2));
    expect(body).toHaveLength(2500);
    expect(checkBody(body, context())).toEqual([]);
  });

  it('rejects a body of 2,501 characters, counting the whole body', () => {
    const body = valid('x'.repeat(2501 - VALID.length - 2));
    expect(body).toHaveLength(2501);
    expect(checkBody(body, context())).toEqual([
      { rule: 'size', message: 'body is 2501 characters; the limit is 2500' },
    ]);
  });

  it('counts a CRLF line break as one character, as the commit will', () => {
    const body = valid('x'.repeat(2500 - VALID.length - 2)).replace(
      /\n/g,
      '\r\n'
    );
    expect(body.length).toBeGreaterThan(2500);
    expect(checkBody(body, context())).toEqual([]);
  });
});

describe('checkBody: required headings', () => {
  it('requires Impact and Verification on a PR ready for review', () => {
    expect(checkBody('Closes #150\n\nSummary.', context())).toEqual([
      {
        rule: 'required-heading',
        message: 'a PR ready for review needs "## Impact"',
      },
      {
        rule: 'required-heading',
        message: 'a PR ready for review needs "## Verification"',
      },
    ]);
  });

  it('does not require them on a draft', () => {
    expect(
      checkBody('Closes #150\n\nSummary.', context({ draft: true }))
    ).toEqual([]);
  });

  it('still applies structure rules to a draft', () => {
    expect(
      rules(
        checkBody(
          'Summary.\n\n## Test plan\n- [x] pnpm test',
          context({ draft: true })
        )
      )
    ).toEqual(['heading', 'checklist']);
  });
});

function withSections(
  impact: string,
  verification = 'CI only',
  extra = ''
): string {
  return `Closes #150\n\nSummary.\n${extra}\n## Impact\n${impact}\n\n## Verification\n${verification}`;
}

describe('checkBody: Impact matches the changesets', () => {
  it('accepts a level that matches the highest changeset bump', () => {
    expect(
      checkBody(
        withSections('minor: new event types.'),
        context({ changesetBump: 'minor' })
      )
    ).toEqual([]);
  });

  it('reads the level through emphasis and code markup', () => {
    expect(
      checkBody(
        withSections('**`Patch`**, one fix.'),
        context({ changesetBump: 'patch' })
      )
    ).toEqual([]);
  });

  it('rejects an Impact that does not start with a level', () => {
    expect(
      checkBody(withSections('Breaking for handlers.'), context())
    ).toEqual([
      {
        rule: 'impact-level',
        line: 6,
        message: '"## Impact" must start with none, patch, minor or major',
      },
    ]);
  });

  it('rejects "none" when the diff adds a changeset', () => {
    expect(
      checkBody(withSections('none'), context({ changesetBump: 'patch' }))
    ).toEqual([
      {
        rule: 'impact-changeset',
        line: 6,
        message: 'Impact says none, but the changesets in the diff bump patch',
      },
    ]);
  });

  it('rejects a level when the diff adds no changeset', () => {
    expect(
      rules(
        checkBody(withSections('minor'), context({ changesetBump: 'none' }))
      )
    ).toEqual(['impact-changeset']);
  });
});

describe('checkBody: issue references', () => {
  it('rejects a #N that does not exist', () => {
    expect(
      checkBody(withSections('none', 'CI only', 'See #999.\n'), context())
    ).toEqual([
      { rule: 'issue-missing', line: 4, message: '#999 does not exist' },
    ]);
  });

  it('does not treat other repos or comment anchors as references', () => {
    const extra =
      'Upstream shoelace-style/webawesome#12, and x.com/y#issuecomment-5.\n';
    expect(
      checkBody(withSections('none', 'CI only', extra), context())
    ).toEqual([]);
  });

  it('rejects Deviations naming an issue the PR does not close or reference', () => {
    const extra = 'Mentions #6.\n\n## Deviations from #6\n- one\n';
    expect(
      rules(checkBody(withSections('none', 'CI only', extra), context()))
    ).toEqual(['deviations-ref']);
  });

  it('accepts Deviations naming an issue the PR references', () => {
    const extra = 'Refs #6\n\n## Deviations from #6\n- one\n';
    expect(
      checkBody(withSections('none', 'CI only', extra), context())
    ).toEqual([]);
  });
});

describe('checkBody: repo paths in inline code', () => {
  const paths = context({
    knownPaths: new Set([
      'scripts/event-types.ts',
      'docs/adr/0005-event-types.md',
      'AGENTS.md',
    ]),
  });

  it('rejects a repo path that does not exist', () => {
    expect(
      checkBody(
        withSections('none', 'CI only', 'Edits `scripts/event-typs.ts`.\n'),
        paths
      )
    ).toEqual([
      {
        rule: 'path-missing',
        line: 4,
        message:
          '`scripts/event-typs.ts` does not exist at head and is not deleted by the diff',
      },
    ]);
  });

  it('accepts files, line suffixes and directories that exist', () => {
    const extra =
      '`scripts/event-types.ts:42`, `./scripts/` and `docs/adr/`.\n';
    expect(checkBody(withSections('none', 'CI only', extra), paths)).toEqual(
      []
    );
  });

  it('rejects a prefix that is not a whole path', () => {
    expect(
      rules(
        checkBody(
          withSections('none', 'CI only', 'See `scripts/event`.\n'),
          paths
        )
      )
    ).toEqual(['path-missing']);
  });

  it('accepts an ADR cited by number, as AGENTS.md cites them', () => {
    expect(
      checkBody(
        withSections('none', 'CI only', 'See `docs/adr/0005`.\n'),
        paths
      )
    ).toEqual([]);
  });

  it('rejects an ADR number that no ADR, or more than one, has', () => {
    const twice = context({
      knownPaths: new Set(['docs/adr/0007-a.md', 'docs/adr/0007-b.md']),
    });
    const cite = (n: string) =>
      withSections('none', 'CI only', `See \`docs/adr/${n}\`.\n`);
    expect(rules(checkBody(cite('0099'), paths))).toEqual(['path-missing']);
    expect(rules(checkBody(cite('0007'), twice))).toEqual(['path-missing']);
  });

  it('leaves a bare file name alone: a nested file and a typo look the same', () => {
    // `pr-body.yml` names .github/workflows/pr-body.yml; `AGENTS.m` is a typo.
    // Neither is a top-level entry, and nothing tells the two apart.
    const extra = 'See `pr-body.yml` and `AGENTS.m`.\n';
    expect(checkBody(withSections('none', 'CI only', extra), paths)).toEqual(
      []
    );
  });

  it('leaves tokens alone whose first segment is not in the repo', () => {
    const extra =
      '`kigumi-ui/kigumi-cli`, `dist/events/*.d.ts`, `node dist/index.js add`, `@awesome.me/webawesome`.\n';
    expect(checkBody(withSections('none', 'CI only', extra), paths)).toEqual(
      []
    );
  });
});

describe('checkBody: Verification', () => {
  const LOG =
    'https://github.com/kigumi-ui/kigumi-cli/pull/151#issuecomment-5870061109';

  it('accepts a link to a comment on this PR', () => {
    expect(
      checkBody(
        withSections('none', `Gates pass; evidence in the [log](${LOG}).`),
        context()
      )
    ).toEqual([]);
  });

  it('accepts "CI only." with a full stop', () => {
    expect(checkBody(withSections('none', 'CI only.'), context())).toEqual([]);
  });

  it('rejects a claim with nothing to point at', () => {
    expect(
      checkBody(withSections('none', 'All gates pass.'), context())
    ).toEqual([
      {
        rule: 'verification',
        line: 9,
        message:
          '"## Verification" must read "CI only" or link a log comment on this PR',
      },
    ]);
  });

  it('rejects a link to a comment that is not on this PR', () => {
    const other =
      'https://github.com/kigumi-ui/kigumi-cli/pull/126#issuecomment-1';
    expect(
      checkBody(withSections('none', `Evidence: ${other}`), context())
    ).toEqual([
      {
        rule: 'verification',
        line: 9,
        message: '#issuecomment-1 is not a comment on this PR',
      },
    ]);
  });
});

describe('checkBody: drafts', () => {
  it('does not check claims on a draft, where the work is still moving', () => {
    const body = withSections(
      'Breaking.',
      'All gates pass.',
      'See #999 and `scripts/nope.ts`.\n'
    );
    expect(
      checkBody(body, context({ draft: true, changesetBump: 'minor' }))
    ).toEqual([]);
  });
});

describe('checkBody: AI attribution', () => {
  it('rejects an attribution line, which the squash would copy onto main', () => {
    const findings = checkBody(
      `${VALID}\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)`,
      context({ draft: true })
    );
    expect(findings).toEqual([
      {
        rule: 'attribution',
        line: 11,
        message:
          'AI generator attribution: 🤖 Generated with [Claude Code](https://claude.com/claude-code)',
      },
    ]);
  });

  it('accepts prose that mentions Claude', () => {
    const body = `${VALID}\n\n## Review focus\nThe Claude stop hook no longer runs this check.`;
    expect(checkBody(body, context())).toEqual([]);
  });

  it('checks an exempt PR for attribution only, since the squash writes its body too', () => {
    // A generated body: a table and no Impact are fine, attribution is not.
    const body =
      '# Releases\n\n| a | b |\n| - | - |\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)';
    expect(rules(checkBody(body, context({ exempt: 'release PR' })))).toEqual([
      'attribution',
    ]);
  });
});

describe('bodyEdit: how much of the body an edit changed', () => {
  const TEN = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');

  it('counts one changed line of ten as 10%', () => {
    expect(
      bodyEdit(TEN, TEN.replace('line 4', 'line four'), 'mischa').changedRatio
    ).toBe(0.1);
  });

  it('counts a full rewrite as 100%', () => {
    expect(bodyEdit('a\nb', 'c\nd', 'mischa').changedRatio).toBe(1);
  });

  it('ignores blank lines and line-ending changes', () => {
    expect(
      bodyEdit('a\nb\nc', 'a\r\n\r\nb\r\n\r\nc', 'mischa').changedRatio
    ).toBe(0);
  });

  it('counts appended lines against the longer version', () => {
    expect(bodyEdit('a\nb', 'a\nb\nc\nd\ne', 'mischa').changedRatio).toBe(0.6);
  });
});

describe('bodyEdit: the trail comment', () => {
  it('renders the change as a diff with a summary line', () => {
    expect(bodyEdit('a\nb\nc', 'a\nB\nc', 'mischa').trail).toBe(
      [
        '**Body edit** by @mischa: 1 of 3 lines changed (33%).',
        '',
        '```diff',
        ' a',
        '-b',
        '+B',
        ' c',
        '```',
      ].join('\n')
    );
  });

  it('fences with more backticks than any run in the body', () => {
    const trail = bodyEdit('x', 'x\n```sh\ny\n```', 'mischa').trail;
    expect(trail.split('\n')[2]).toBe('````diff');
    expect(trail.split('\n').at(-1)).toBe('````');
  });
});

describe('logCoverage: every pushed commit sits in a Covers range', () => {
  // A branch a -> b -> c -> d, with full SHAs.
  const [A, B, C, D] = ['a', 'b', 'c', 'd'].map((x) => x.repeat(40));
  const history = [A, B, C, D];
  /** git rev-list from..to on the linear history above. */
  function resolveRange(from: string, to: string): string[] | null {
    const start = history.findIndex((sha) => sha.startsWith(from));
    const end = history.findIndex((sha) => sha.startsWith(to));
    if (start === -1 || end === -1) return null;
    return history.slice(start + 1, end + 1);
  }
  function log(id: number, body: string, trusted = true): LogComment {
    return { id, body, trusted };
  }

  it('covers the commits after "from" up to and including "to"', () => {
    const comments = [
      log(
        1,
        `**Round 1** · Covers: ${A.slice(0, 7)}..${D.slice(0, 7)}\n\nChanged\n- x`
      ),
    ];
    expect(logCoverage([B, C, D], comments, resolveRange)).toEqual({
      uncovered: [],
      unparseable: [],
      stale: [],
      rounds: 1,
    });
  });

  it('reports a pushed commit no range covers', () => {
    const comments = [log(1, `**Round 1** · Covers: ${A}..${C}`)];
    expect(logCoverage([B, C, D], comments, resolveRange).uncovered).toEqual([
      D,
    ]);
  });

  it('ignores a log header from someone without write access', () => {
    const comments = [log(1, `**Round 1** · Covers: ${A}..${D}`, false)];
    expect(logCoverage([B], comments, resolveRange).uncovered).toEqual([B]);
  });

  it('flags a comment that starts like a log header but does not parse', () => {
    const comments = [
      log(7, `**Round 2** Covers ${A}..${D}`),
      log(8, 'Thanks, looks good.'),
    ];
    expect(logCoverage([B], comments, resolveRange)).toEqual({
      uncovered: [B],
      unparseable: [7],
      stale: [],
      rounds: 0,
    });
  });

  it('treats a range rewritten away by a rebase as stale, covering nothing', () => {
    const comments = [log(3, `**Round 1** · Covers: ${'e'.repeat(7)}..${D}`)];
    expect(logCoverage([B], comments, resolveRange)).toEqual({
      uncovered: [B],
      unparseable: [],
      stale: [3],
      rounds: 1,
    });
  });

  it('reads the header after leading blank lines and CRLF', () => {
    const comments = [
      log(1, `\r\n**Round 1** · Covers: ${A}..${B}\r\n\r\nChanged`),
    ];
    expect(logCoverage([B], comments, resolveRange).uncovered).toEqual([]);
  });
});

describe('isExempt', () => {
  it('exempts bot authors and the changesets release branch, nothing else', () => {
    expect(
      isExempt({
        authorType: 'Bot',
        headRef: 'dependabot/npm_and_yarn/x',
        sameRepo: true,
      })
    ).toBe('bot author');
    expect(
      isExempt({
        authorType: 'User',
        headRef: 'changeset-release/main',
        sameRepo: true,
      })
    ).toBe('release PR');
    expect(
      isExempt({
        authorType: 'User',
        headRef: 'issue-150-pr-body-log',
        sameRepo: true,
      })
    ).toBeNull();
  });

  it("does not exempt a fork's branch that happens to be named changeset-release/main", () => {
    expect(
      isExempt({
        authorType: 'User',
        headRef: 'changeset-release/main',
        sameRepo: false,
      })
    ).toBeNull();
  });
});

describe('logStatus: the commit status, never a pass for work not done', () => {
  const covered = { uncovered: [], unparseable: [], stale: [], rounds: 2 };

  it('reports success when every required commit is covered', () => {
    expect(
      logStatus({
        exempt: null,
        draft: false,
        branchCommits: 5,
        required: 3,
        coverage: covered,
      })
    ).toEqual({
      state: 'success',
      description:
        'All 3 commit(s) committed after the PR opened are covered by 2 log comment(s)',
    });
  });

  it('reports failure for uncovered commits and unparseable headers', () => {
    const coverage = {
      uncovered: ['d'.repeat(40)],
      unparseable: [7],
      stale: [],
      rounds: 1,
    };
    expect(
      logStatus({
        exempt: null,
        draft: false,
        branchCommits: 5,
        required: 3,
        coverage,
      })
    ).toEqual({
      state: 'failure',
      description:
        "1 commit(s) in no log comment's Covers range; unparseable log header in comment 7",
    });
  });

  it('keeps a draft pending instead of passing it', () => {
    expect(
      logStatus({
        exempt: null,
        draft: true,
        branchCommits: 5,
        required: 3,
        coverage: covered,
      }).state
    ).toBe('pending');
  });

  it('says an exempt PR was not checked', () => {
    expect(
      logStatus({
        exempt: 'bot author',
        draft: false,
        branchCommits: 1,
        required: 0,
        coverage: covered,
      })
    ).toEqual({
      state: 'success',
      description: 'Not checked: exempt (bot author)',
    });
  });

  it('refuses a branch with no commits, which means the range is wrong', () => {
    expect(
      logStatus({
        exempt: null,
        draft: false,
        branchCommits: 0,
        required: 0,
        coverage: covered,
      })
    ).toEqual({
      state: 'error',
      description:
        'No commits between base and head: the range or the checkout is wrong',
    });
  });

  it('passes with nothing to cover only after reading a non-empty branch', () => {
    expect(
      logStatus({
        exempt: null,
        draft: false,
        branchCommits: 4,
        required: 0,
        coverage: covered,
      })
    ).toEqual({
      state: 'success',
      description: 'No commits committed after the PR opened (4 on the branch)',
    });
  });
});

describe('mentionedIssues: what the CLI has to look up', () => {
  it('lists each #N once, skipping code, other repos and comment anchors', () => {
    const body =
      'Closes #150, see #6 and #150.\n`#7` a/b#8 x#issuecomment-9\n```\n#10\n```\n## Deviations from #11';
    expect(mentionedIssues(body)).toEqual([150, 6, 11]);
  });
});

describe('checkRewrite: an edit may fix the body, not replace it', () => {
  const BODY = 'a\nb\nc\nd';

  it('accepts changing half of the lines', () => {
    expect(
      checkRewrite(BODY, 'a\nb\nC\nD', { draft: false, actor: 'mischa' })
    ).toEqual([]);
  });

  it('rejects changing more than half on a PR ready for review', () => {
    expect(
      checkRewrite(BODY, 'a\nB\nC\nD', { draft: false, actor: 'mischa' })
    ).toEqual([
      {
        rule: 'rewrite',
        message:
          'this edit changed 3 of 4 lines (75%); edit the sentences that became wrong, and say why in a log comment',
      },
    ]);
  });

  it('lets a draft be rewritten', () => {
    expect(
      checkRewrite(BODY, 'w\nx\ny\nz', { draft: true, actor: 'mischa' })
    ).toEqual([]);
  });
});

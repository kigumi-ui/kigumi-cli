/**
 * Tests for the commit-attribution matcher.
 *
 * The interesting boundary is not "does it catch a trailer" but "does it
 * leave prose alone". This repo's history legitimately discusses Claude
 * hooks and Claude sessions; a hook that rejected those would get bypassed
 * with --no-verify, which is worse than having no hook.
 */
import { describe, expect, it } from 'vitest';

import {
  findAttribution,
  findPullRequestAttribution,
} from '../../scripts/check-commit-attribution.js';

describe('findAttribution: rejects attribution trailers', () => {
  it('rejects a Claude co-author trailer', () => {
    const findings = findAttribution(
      'feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>'
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(3);
    expect(findings[0].reason).toBe('AI co-author trailer');
  });

  it('rejects the trailer whatever its casing', () => {
    expect(findAttribution('co-authored-by: claude')).toHaveLength(1);
    expect(findAttribution('CO-AUTHORED-BY: CLAUDE')).toHaveLength(1);
  });

  it('rejects an Anthropic co-author trailer', () => {
    expect(
      findAttribution('Co-Authored-By: Someone <bot@anthropic.com>')
    ).toHaveLength(1);
  });

  it('rejects "Generated with Claude Code", with or without the emoji', () => {
    expect(
      findAttribution('🤖 Generated with [Claude Code](https://claude.com)')
    ).toHaveLength(1);
    expect(findAttribution('Generated with Claude Code')).toHaveLength(1);
  });

  it('reports every offending line', () => {
    const findings = findAttribution(
      'feat: x\n\nCo-Authored-By: Claude <a@b>\nGenerated with Claude Code'
    );
    expect(findings).toHaveLength(2);
  });
});

describe('findAttribution: leaves legitimate messages alone', () => {
  it('accepts an ordinary commit message', () => {
    expect(
      findAttribution('fix(validate): correct the parity severity')
    ).toEqual([]);
  });

  it('accepts a human co-author trailer', () => {
    expect(
      findAttribution(
        'feat: x\n\nCo-Authored-By: Michael Suzuki <legal@kigumi.style>'
      )
    ).toEqual([]);
  });

  it('accepts prose discussing Claude, which this history really contains', () => {
    const message = [
      'ci: gate pull requests on five more validators',
      '',
      'A check wired only to the Claude stop hook does not protect the repo,',
      'it protects one Claude session.',
    ].join('\n');
    expect(findAttribution(message)).toEqual([]);
  });

  it('accepts a body mentioning .claude/ paths and Anthropic', () => {
    expect(
      findAttribution(
        'chore: move .claude/hooks/ guardrails\n\nAnthropic ships this pattern.'
      )
    ).toEqual([]);
  });

  it('accepts a subject that merely starts with the word generated', () => {
    expect(
      findAttribution('fix: generated templates drift from the registry')
    ).toEqual([]);
  });

  it('ignores commented-out template lines', () => {
    // git strips these before creating the commit, so they are not attribution.
    expect(
      findAttribution(
        'feat: x\n\n# Co-Authored-By: Claude <noreply@anthropic.com>'
      )
    ).toEqual([]);
  });

  it('accepts an empty message', () => {
    expect(findAttribution('')).toEqual([]);
  });
});

describe('findAttribution: other agents', () => {
  it('rejects the Cursor Agent co-author trailer that reached main via squash merges', () => {
    const findings = findAttribution(
      'fix: x\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>'
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].reason).toBe('AI co-author trailer');
  });

  it('rejects "Made/Created/Generated with Cursor" footers', () => {
    expect(findAttribution('Made with Cursor')).toHaveLength(1);
    expect(findAttribution('Created with Cursor')).toHaveLength(1);
    expect(findAttribution('Generated with Cursor')).toHaveLength(1);
  });

  it('accepts prose mentioning Cursor', () => {
    expect(
      findAttribution(
        'docs: note the .cursor/hooks directory\n\nMade the cursor visible.'
      )
    ).toEqual([]);
  });
});

describe('findPullRequestAttribution', () => {
  const clean = { sha: 'aaaaaaa1', message: 'feat: x' };
  const dirty = {
    sha: 'bbbbbbb2',
    message: 'fix: y\n\nCo-authored-by: Cursor Agent <cursoragent@cursor.com>',
  };

  it('passes a clean PR', () => {
    expect(
      findPullRequestAttribution({ body: 'Adds x.', commits: [clean] })
    ).toEqual([]);
  });

  it('names the commit that carries a trailer', () => {
    const findings = findPullRequestAttribution({
      body: 'Adds x.',
      commits: [clean, dirty],
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].source).toBe('commit bbbbbbb2');
  });

  it('flags a PR body footer', () => {
    const findings = findPullRequestAttribution({
      body: 'Adds x.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)',
      commits: [clean],
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].source).toBe('PR body');
  });
});

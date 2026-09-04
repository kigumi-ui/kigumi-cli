/**
 * Tests for the commit-attribution matcher.
 *
 * The interesting boundary is not "does it catch a trailer" but "does it
 * leave prose alone". This repo's history legitimately discusses Claude
 * hooks and Claude sessions; a hook that rejected those would get bypassed
 * with --no-verify, which is worse than having no hook.
 */
import { describe, expect, it } from 'vitest';

import { findAttribution } from '../../scripts/check-commit-attribution.js';

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

import { describe, it, expect } from 'vitest';
import {
  toSlug,
  evaluateCriteria,
  renderDraft,
  type FindingInput,
} from '../../../scripts/triage-finding.js';

const FIXED_DATE = '2026-05-04';

describe('toSlug', () => {
  it('converts the first 5 words into kebab-case', () => {
    expect(
      toSlug('Config validation throws on extra fields in v0.20.0 schema')
    ).toBe('config-validation-throws-on-extra');
  });

  it('lowercases and strips punctuation', () => {
    expect(toSlug("Init's --force flag: silently overwrites!")).toBe(
      'inits-force-flag-silently-overwrites'
    );
  });

  it('handles single-word descriptions', () => {
    expect(toSlug('Bug')).toBe('bug');
  });

  it('falls back to "untitled" for empty or punctuation-only inputs', () => {
    expect(toSlug('')).toBe('untitled');
    expect(toSlug('---')).toBe('untitled');
    expect(toSlug('!!!')).toBe('untitled');
  });
});

describe('evaluateCriteria', () => {
  it('returns Issue when all three criteria are met', () => {
    const result = evaluateCriteria({ K1: true, K2: true, K3: true });
    expect(result.recommendation).toBe('issue');
    expect(result.failedCriteria).toEqual([]);
  });

  it('returns in-PR-note when K3 met but K1 fails', () => {
    const result = evaluateCriteria({ K1: false, K2: true, K3: true });
    expect(result.recommendation).toBe('pr-note');
    expect(result.failedCriteria).toEqual(['K1']);
  });

  it('returns in-PR-note when K3 met but K2 fails', () => {
    const result = evaluateCriteria({ K1: true, K2: false, K3: true });
    expect(result.recommendation).toBe('pr-note');
    expect(result.failedCriteria).toEqual(['K2']);
  });

  it('returns in-PR-note listing both K1 and K2 when only K3 is met', () => {
    const result = evaluateCriteria({ K1: false, K2: false, K3: true });
    expect(result.recommendation).toBe('pr-note');
    expect(result.failedCriteria).toEqual(['K1', 'K2']);
  });

  it('returns wontfix when K3 fails regardless of K1/K2', () => {
    expect(
      evaluateCriteria({ K1: true, K2: true, K3: false }).recommendation
    ).toBe('wontfix');
    expect(
      evaluateCriteria({ K1: false, K2: false, K3: false }).recommendation
    ).toBe('wontfix');
  });
});

describe('renderDraft', () => {
  const finding: FindingInput = {
    description: 'Config validation throws on extra fields in v0.20.0 schema',
    severity: 'medium',
    type: 'bug',
    initiative: 'open-fix-clusters-latin',
  };

  it('renders an Issue draft matching the canonical state-file Findings format', () => {
    const draft = renderDraft('issue', finding, ['K1', 'K2', 'K3'], FIXED_DATE);
    expect(draft).toContain('### config-validation-throws-on-extra');
    expect(draft).toContain('**Type:** bug medium');
    expect(draft).toContain(`**Date:** ${FIXED_DATE}`);
    expect(draft).toContain(`**Routed from:** triage-finding ${FIXED_DATE}`);
    expect(draft).toContain(
      '**Summary:** Config validation throws on extra fields in v0.20.0 schema'
    );
  });

  it('renders a PR-note bullet citing the failed criterion', () => {
    const draft = renderDraft('pr-note', finding, ['K1'], FIXED_DATE);
    expect(draft).toMatch(
      /^- Out-of-scope note: Config validation throws on extra fields in v0\.20\.0 schema \(deferred per triage 2026-05-04: criterion K1 not met,/
    );
  });

  it('renders a PR-note citing the first failed criterion when multiple fail', () => {
    const draft = renderDraft('pr-note', finding, ['K1', 'K2'], FIXED_DATE);
    expect(draft).toMatch(/criterion K1 not met,/);
  });

  it('renders a wontfix acknowledgement with reactivation criteria', () => {
    const draft = renderDraft('wontfix', finding, ['K3'], FIXED_DATE);
    expect(draft).toContain(
      `Triage decision ${FIXED_DATE}: wontfix-unless-recurring`
    );
    expect(draft).toContain('Reactivation criteria');
    expect(draft).toContain('5 features');
  });
});

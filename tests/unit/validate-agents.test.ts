/**
 * Tests for the templates/AGENTS.md count-claim matcher.
 *
 * Every case runs against a synthetic string, never the real file. A test
 * that read templates/AGENTS.md would pass only while the repo happened to
 * be in a particular state, which is the same anti-pattern as the parity
 * test that asserted gaps must exist.
 */
import { describe, expect, it } from 'vitest';

import {
  checkTemplateCountClaims,
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

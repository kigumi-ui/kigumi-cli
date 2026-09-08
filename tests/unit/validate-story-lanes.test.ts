/**
 * Tests for the story interaction-lane matchers.
 *
 * All synthetic. Nothing reads docs/, so these cannot start passing or
 * failing because a story was added to the real tree.
 */
import { describe, expect, it } from 'vitest';

import {
  diffLanes,
  hasInteractionTag,
  parseListedStories,
} from '../../scripts/validate-story-lanes.js';

describe('parseListedStories', () => {
  it('reads the names out of the shared array', () => {
    const source = `
      export const INTERACTION_STORIES = [
        'Button',
        'Dialog',
      ] as const;
    `;
    expect(parseListedStories(source)).toEqual(['Button', 'Dialog']);
  });

  it('returns nothing when the array is absent', () => {
    expect(parseListedStories('export const OTHER = [];')).toEqual([]);
  });

  it('handles an empty list', () => {
    expect(
      parseListedStories('export const INTERACTION_STORIES = [] as const;')
    ).toEqual([]);
  });
});

describe('hasInteractionTag', () => {
  it('detects the interaction tag', () => {
    expect(
      hasInteractionTag("export const S = { tags: ['interaction'] };")
    ).toBe(true);
  });

  it('detects it alongside other tags', () => {
    expect(
      hasInteractionTag("const S = { tags: ['autodocs', 'interaction'] };")
    ).toBe(true);
  });

  it('is false for a story with only other tags', () => {
    expect(hasInteractionTag("const S = { tags: ['autodocs'] };")).toBe(false);
  });

  it('does not match the bare word outside a tags array', () => {
    // A title or comment mentioning interaction must not opt a story in.
    expect(
      hasInteractionTag(
        "// covers interaction states\nconst S = { title: 'x' };"
      )
    ).toBe(false);
  });
});

describe('diffLanes', () => {
  it('passes when both sides agree', () => {
    expect(diffLanes(['Button', 'Dialog'], ['Button', 'Dialog'])).toEqual([]);
  });

  it('flags a tagged story missing from the list', () => {
    const findings = diffLanes(['Button'], ['Button', 'Dialog']);
    expect(findings).toHaveLength(1);
    expect(findings[0].story).toBe('Dialog');
    expect(findings[0].message).toContain('never runs it');
  });

  it('flags a listed story that is not tagged', () => {
    const findings = diffLanes(['Button', 'Ghost'], ['Button']);
    expect(findings).toHaveLength(1);
    expect(findings[0].story).toBe('Ghost');
    expect(findings[0].message).toContain('absent or not tagged');
  });

  it('reports drift in both directions at once', () => {
    expect(
      diffLanes(['A', 'B'], ['B', 'C'])
        .map((f) => f.story)
        .sort()
    ).toEqual(['A', 'C']);
  });

  it('is order-independent', () => {
    expect(diffLanes(['B', 'A'], ['A', 'B'])).toEqual([]);
  });
});

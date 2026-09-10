/**
 * Markdown Link Checker Tests
 *
 * The guard exists because `.cursor/SKILLS.md` pointed at six skill files for
 * six months after the directory holding them was deleted, and two skills sent
 * agents to reference docs that were never written. A link to a missing file
 * sends the reader somewhere instead of nowhere.
 *
 * The matchers are pure and exported so these tests drive the real decision
 * logic rather than a copy of it (see tests/AGENTS.md, "Internals Exported for
 * Test Coverage"). `findBrokenLinks` takes its `exists` probe as an argument,
 * so the whole checker is exercised without laying files on disk.
 */

import { describe, expect, it } from 'vitest';
import {
  findBrokenLinks,
  isCheckableTarget,
  isExcluded,
  normalizeTarget,
} from '../../../scripts/validate-doc-links.js';

/** Nothing exists: every checkable link is broken. */
const nothingExists = () => false;
/** Everything exists: no checkable link is broken. */
const allExists = () => true;

describe('isCheckableTarget', () => {
  it.each([
    ['https://example.com', 'external https'],
    ['http://example.com', 'external http'],
    ['mailto:a@b.c', 'mailto'],
    ['tel:+123', 'tel'],
    ['#section', 'bare anchor'],
    ['//cdn.example.com/x', 'protocol-relative'],
    ['', 'empty'],
  ])('skips %s (%s)', (target) => {
    expect(isCheckableTarget(target)).toBe(false);
  });

  it.each(['./sibling.md', '../parent.md', 'docs/adr/0001.md', 'AGENTS.md'])(
    'checks the relative path %s',
    (target) => {
      expect(isCheckableTarget(target)).toBe(true);
    }
  );
});

describe('normalizeTarget', () => {
  it('drops an anchor', () => {
    expect(normalizeTarget('AGENTS.md#rules')).toBe('AGENTS.md');
  });

  it('drops a link title', () => {
    expect(normalizeTarget('AGENTS.md "The rules"')).toBe('AGENTS.md');
  });

  it('leaves a plain path alone', () => {
    expect(normalizeTarget('  docs/adr/0001.md  ')).toBe('docs/adr/0001.md');
  });
});

describe('isExcluded', () => {
  it('excludes fixture markdown, whose dead links are the test input', () => {
    expect(isExcluded('tests/fixtures/state/initiatives-good.md')).toBe(true);
  });

  it('does not excuse ordinary test documentation', () => {
    expect(isExcluded('tests/unit/regression/README.md')).toBe(false);
    expect(isExcluded('tests/AGENTS.md')).toBe(false);
  });
});

describe('findBrokenLinks', () => {
  it('catches the shape this guard was written for', () => {
    const findings = findBrokenLinks(
      '.cursor/SKILLS.md',
      '| Skill | [skills/generate-webawesome-component/](skills/generate-webawesome-component/SKILL.md) |',
      nothingExists
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]!.resolved).toBe(
      '.cursor/skills/generate-webawesome-component/SKILL.md'
    );
  });

  it('resolves a link relative to the linking file, not the repo root', () => {
    const findings = findBrokenLinks(
      '.claude/skills/a/SKILL.md',
      'See [memory](../../memory/MEMORY.md).',
      nothingExists
    );

    expect(findings[0]!.resolved).toBe('.claude/memory/MEMORY.md');
  });

  it('reports nothing when the target exists', () => {
    expect(findBrokenLinks('a/b.md', 'See [x](./c.md).', allExists)).toEqual(
      []
    );
  });

  it('ignores links inside a fenced code block', () => {
    const content = [
      '```md',
      '[example](does/not/exist.md)',
      '```',
      'Real prose with no link.',
    ].join('\n');

    expect(findBrokenLinks('a.md', content, nothingExists)).toEqual([]);
  });

  it('ignores a link inside inline code', () => {
    expect(
      findBrokenLinks('a.md', 'Write `[x](nope.md)` to link.', nothingExists)
    ).toEqual([]);
  });

  it('never reports an external URL, even though it cannot resolve', () => {
    expect(
      findBrokenLinks(
        'README.md',
        'See [WA](https://webawesome.com/docs).',
        nothingExists
      )
    ).toEqual([]);
  });

  it('finds every broken link in a document, not just the first', () => {
    const content = ['- [one](a.md)', '- [two](b.md)', '- [three](c.md)'].join(
      '\n'
    );

    expect(findBrokenLinks('x.md', content, nothingExists)).toHaveLength(3);
  });

  it('does not leak regex state between calls', () => {
    // The link pattern is global. A stale lastIndex would make the second
    // identical call silently find nothing.
    const content = '[a](missing.md)';
    expect(findBrokenLinks('x.md', content, nothingExists)).toHaveLength(1);
    expect(findBrokenLinks('y.md', content, nothingExists)).toHaveLength(1);
    expect(findBrokenLinks('z.md', content, nothingExists)).toHaveLength(1);
  });
});

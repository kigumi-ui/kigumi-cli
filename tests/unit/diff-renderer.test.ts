/**
 * Diff Renderer Tests
 *
 * Tests for src/utils/diff-renderer.ts
 *
 * Covers:
 * - Identical / whitespace-only inputs -> empty string
 * - Added / removed / changed lines with correct colors
 * - File name header and hunk headers
 * - Context lines limited to 3 around changes
 * - Multiple hunks (distant changes -> separate, close changes -> merged)
 * - Empty inputs
 * - maxLines truncation
 * - Inline snapshots for regression safety
 */

import { describe, it, expect } from 'vitest';
import { renderDiff } from '../../src/utils/diff-renderer.js';
import pc from 'picocolors';

describe('renderDiff', () => {
  // ── Empty / identical ──

  it('returns empty string for identical content', () => {
    const content = 'line 1\nline 2\nline 3';
    expect(renderDiff(content, content, 'test.ts')).toBe('');
  });

  it('returns empty string for whitespace-only differences', () => {
    expect(renderDiff('hello\n', 'hello', 'test.ts')).toBe('');
  });

  it('returns empty string when both inputs are empty', () => {
    expect(renderDiff('', '', 'test.ts')).toBe('');
  });

  // ── Single-line changes with inline snapshots ──

  it('shows added lines in green', () => {
    const result = renderDiff(
      'line 1\nline 2',
      'line 1\nline 2\nline 3',
      'test.ts'
    );
    expect(result).toContain(pc.green('+ line 3'));
    expect(result).toMatchInlineSnapshot(`
      "  ${pc.bold('test.ts')}
        ${pc.dim('─'.repeat(Math.min('test.ts'.length + 4, 60)))}
        ${pc.cyan('@@ -1,2 +1,3 @@')}
        ${pc.dim('  line 1')}
        ${pc.dim('  line 2')}
        ${pc.green('+ line 3')}
      "
    `);
  });

  it('shows removed lines in red', () => {
    const result = renderDiff(
      'line 1\nline 2\nline 3',
      'line 1\nline 2',
      'test.ts'
    );
    expect(result).toContain(pc.red('- line 3'));
  });

  it('shows changed lines as remove + add', () => {
    const result = renderDiff(
      'line 1\nold line\nline 3',
      'line 1\nnew line\nline 3',
      'test.ts'
    );
    expect(result).toContain(pc.red('- old line'));
    expect(result).toContain(pc.green('+ new line'));
  });

  // ── Headers ──

  it('includes file name header', () => {
    const result = renderDiff('a', 'b', 'Button.tsx');
    expect(result).toContain(pc.bold('Button.tsx'));
  });

  it('includes hunk header with line numbers', () => {
    const result = renderDiff('a', 'b', 'test.ts');
    expect(result).toContain('@@');
  });

  // ── Context lines ──

  it('shows context lines around changes', () => {
    const old = 'line 1\nline 2\nline 3\nold\nline 5\nline 6\nline 7';
    const new_ = 'line 1\nline 2\nline 3\nnew\nline 5\nline 6\nline 7';
    const result = renderDiff(old, new_, 'test.ts');
    expect(result).toContain('line 3');
    expect(result).toContain('line 5');
  });

  it('limits context to 3 lines around changes', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
    const modified = [...lines];
    modified[10] = 'CHANGED';
    const result = renderDiff(lines.join('\n'), modified.join('\n'), 'test.ts');
    // line 1 is too far from the change at line 11
    expect(result).not.toContain('line 1\n');
    // line 8 is within 3 lines before the change
    expect(result).toContain('line 8');
  });

  // ── Edge cases: empty inputs ──

  it('handles empty old content', () => {
    const result = renderDiff('', 'new content', 'test.ts');
    expect(result).toContain(pc.green('+ new content'));
  });

  it('handles empty new content', () => {
    const result = renderDiff('old content', '', 'test.ts');
    expect(result).toContain(pc.red('- old content'));
  });

  // ── maxLines truncation ──

  it('respects maxLines option', () => {
    const old = Array.from({ length: 50 }, (_, i) => `old ${i}`).join('\n');
    const new_ = Array.from({ length: 50 }, (_, i) => `new ${i}`).join('\n');
    const result = renderDiff(old, new_, 'test.ts', { maxLines: 5 });
    expect(result).toContain('more lines');
  });

  // ── Multiple hunks ──

  it('produces two hunk headers for distant changes', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
    const modified = [...lines];
    modified[1] = 'CHANGED_A';
    modified[18] = 'CHANGED_B';
    const result = renderDiff(lines.join('\n'), modified.join('\n'), 'test.ts');
    const hunkCount = (result.match(/@@ /g) || []).length;
    expect(hunkCount).toBe(2);
  });

  it('merges close changes into a single hunk', () => {
    // Two changes 3 lines apart -> should merge (distance < 2 * CONTEXT_LINES)
    const old = 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj';
    const new_ = 'a\nB\nc\nd\ne\nf\ng\nH\ni\nj';
    const result = renderDiff(old, new_, 'test.ts');
    const hunkCount = (result.match(/@@ /g) || []).length;
    expect(hunkCount).toBe(1);
    // Both changes must be in the same hunk
    expect(result).toContain(pc.red('- b'));
    expect(result).toContain(pc.green('+ B'));
    expect(result).toContain(pc.red('- h'));
    expect(result).toContain(pc.green('+ H'));
  });

  it('mixes merged and separate hunks for three changes', () => {
    // Changes at line 2, line 5 (close -> merge), and line 18 (far -> separate)
    const lines = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`);
    const modified = [...lines];
    modified[1] = 'CHANGED_A';
    modified[4] = 'CHANGED_B';
    modified[17] = 'CHANGED_C';
    const result = renderDiff(lines.join('\n'), modified.join('\n'), 'test.ts');
    const hunkCount = (result.match(/@@ /g) || []).length;
    expect(hunkCount).toBe(2);
  });

  // ── Only additions / only removals ──

  it('shows only additions when lines are appended', () => {
    const result = renderDiff(
      'line 1\nline 2',
      'line 1\nline 2\nline 3\nline 4',
      'test.ts'
    );
    expect(result).toContain(pc.green('+ line 3'));
    expect(result).toContain(pc.green('+ line 4'));
    expect(result).not.toContain(pc.red('- '));
  });

  it('shows only removals when lines are deleted', () => {
    const result = renderDiff('line 1\nline 2\nline 3', 'line 1', 'test.ts');
    expect(result).toContain(pc.red('- line 2'));
    expect(result).toContain(pc.red('- line 3'));
    expect(result).not.toContain(pc.green('+ '));
  });
});

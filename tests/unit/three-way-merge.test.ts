/**
 * Three-Way Merge Tests
 *
 * Tests for src/utils/three-way-merge.ts - Merge logic
 */

import { describe, it, expect } from 'vitest';
import { mergeFile, threeWayMerge } from '../../src/utils/three-way-merge.js';

describe('three-way-merge', () => {
  describe('mergeFile', () => {
    // ── No snapshot cases ──

    it('should return no-snapshot-match when no snapshot and files match', () => {
      const result = mergeFile(null, 'content A', 'content A', 'file.tsx');
      expect(result.status).toBe('no-snapshot-match');
      expect(result.newContent).toBeNull();
    });

    it('should return no-snapshot-differ when no snapshot and files differ', () => {
      const result = mergeFile(null, 'content A', 'content B', 'file.tsx');
      expect(result.status).toBe('no-snapshot-differ');
      expect(result.newContent).toBeNull();
    });

    // ── Snapshot exists cases ──

    it('should return up-to-date when template unchanged (base === theirs)', () => {
      const result = mergeFile('base', 'modified', 'base', 'file.tsx');
      expect(result.status).toBe('up-to-date');
      expect(result.newContent).toBeNull();
    });

    it('should return safe-overwrite when user did not edit (base === ours)', () => {
      const result = mergeFile('base', 'base', 'new template', 'file.tsx');
      expect(result.status).toBe('safe-overwrite');
      expect(result.newContent).toBe('new template');
    });

    it('should return already-current when ours === theirs', () => {
      const result = mergeFile('base', 'same', 'same', 'file.tsx');
      expect(result.status).toBe('already-current');
      expect(result.newContent).toBeNull();
    });

    it('should return up-to-date when all three are the same', () => {
      const result = mergeFile('same', 'same', 'same', 'file.tsx');
      expect(result.status).toBe('up-to-date');
      expect(result.newContent).toBeNull();
    });

    it('should return clean-merge for non-overlapping changes', () => {
      const base = 'line1\nline2\nline3';
      const ours = 'line1 modified\nline2\nline3';
      const theirs = 'line1\nline2\nline3 modified';

      const result = mergeFile(base, ours, theirs, 'file.tsx');
      expect(result.status).toBe('clean-merge');
      expect(result.newContent).toContain('line1 modified');
      expect(result.newContent).toContain('line3 modified');
      expect(result.merge?.hasConflicts).toBe(false);
      expect(result.merge?.conflictCount).toBe(0);
    });

    it('should return conflict for overlapping changes', () => {
      const base = 'line1\nline2\nline3';
      const ours = 'line1\nours change\nline3';
      const theirs = 'line1\ntheirs change\nline3';

      const result = mergeFile(base, ours, theirs, 'file.tsx');
      expect(result.status).toBe('conflict');
      expect(result.merge?.hasConflicts).toBe(true);
      expect(result.merge?.conflictCount).toBe(1);
    });

    // ── Whitespace normalization ──

    it('should ignore trailing whitespace when comparing', () => {
      const result = mergeFile('base\n\n', 'base\n', 'base\n\n\n', 'file.tsx');
      expect(result.status).toBe('up-to-date');
    });

    // ── Real-world scenarios ──

    it('should handle real-world CSS merge (user + template both add rules)', () => {
      const base = ['.Button { color: red; }', '', '/* end */'].join('\n');

      const ours = [
        '.Button { color: red; }',
        '.Button:hover { color: blue; }',
        '',
        '/* end */',
      ].join('\n');

      const theirs = [
        '.Button { color: red; }',
        '',
        '.Button:focus { outline: 2px solid; }',
        '/* end */',
      ].join('\n');

      const result = mergeFile(base, ours, theirs, 'Button.css');
      expect(result.status).toBe('clean-merge');
      expect(result.newContent).toContain('.Button:hover');
      expect(result.newContent).toContain('.Button:focus');
    });

    it('should handle real-world TSX merge (user adds prop + template changes import)', () => {
      const base = [
        "import React from 'react';",
        '',
        'export function Button(props) {',
        '  return <wa-button {...props} />;',
        '}',
      ].join('\n');

      const ours = [
        "import React from 'react';",
        '',
        'export function Button(props) {',
        '  return <wa-button {...props} class="custom" />;',
        '}',
      ].join('\n');

      const theirs = [
        "import React from 'react';",
        "import type { ButtonProps } from './types';",
        '',
        'export function Button(props) {',
        '  return <wa-button {...props} />;',
        '}',
      ].join('\n');

      const result = mergeFile(base, ours, theirs, 'Button.tsx');
      expect(result.status).toBe('clean-merge');
      expect(result.newContent).toContain('class="custom"');
      expect(result.newContent).toContain('import type { ButtonProps }');
    });
  });

  describe('threeWayMerge', () => {
    it('should produce correct conflict markers', () => {
      const base = 'line1\nshared\nline3';
      const ours = 'line1\nours\nline3';
      const theirs = 'line1\ntheirs\nline3';

      const result = threeWayMerge(base, ours, theirs);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflictCount).toBe(1);
      expect(result.content).toContain('<<<<<<< yours');
      expect(result.content).toContain('=======');
      expect(result.content).toContain('>>>>>>> theirs');
      expect(result.content).toContain('ours');
      expect(result.content).toContain('theirs');
    });

    it('should merge cleanly when changes do not overlap', () => {
      const base = 'a\nb\nc\nd\ne';
      const ours = 'a\nB\nc\nd\ne';
      const theirs = 'a\nb\nc\nD\ne';

      const result = threeWayMerge(base, ours, theirs);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflictCount).toBe(0);
      expect(result.content).toBe('a\nB\nc\nD\ne');
    });
  });
});

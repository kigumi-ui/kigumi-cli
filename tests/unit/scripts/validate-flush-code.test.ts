/**
 * Flush Code Block Validation Tests
 *
 * Tests for scripts/validate-flush-code.ts.
 *
 * The rule guards a visual convention that only a human looking at the page
 * would otherwise catch, so the tests exercise the pure matcher against
 * hand-written snippets. A check of this shape fails quietly when its pattern
 * stops matching, and a table over real markup shapes is what distinguishes
 * "found nothing" from "looked for nothing".
 */

import { describe, it, expect } from 'vitest';
import {
  scanFlushCode,
  isFlushContainer,
  hasDividerAbove,
} from '../../../scripts/validate-flush-code.js';

describe('validate:flush-code', () => {
  describe('isFlushContainer', () => {
    it.each([
      ['single-line spacing', `<Card style={{ '--spacing': '0' }}>`],
      ['single-line padding', `<TabPanel style={{ '--padding': '0' }}>`],
      ['double-quoted', `<Card style={{ "--spacing": "0" }}>`],
      ['a zero with units', `<Card style={{ '--spacing': '0px' }}>`],
      [
        'a multi-line style object',
        `<Card\n  style={{\n    '--spacing': '0',\n    border: 'none',\n  }}\n>`,
      ],
    ])('treats %s as flush', (_label, tag) => {
      expect(isFlushContainer(tag)).toBe(true);
    });

    it.each([
      ['a padded card', `<Card style={{ '--spacing': 'var(--wa-space-m)' }}>`],
      ['an unrelated zero', `<div style={{ margin: '0' }}>`],
      ['a plain container', `<div className="wa-stack">`],
      ['a non-zero padding', `<TabPanel style={{ '--padding': '1rem' }}>`],
    ])('does not treat %s as flush', (_label, tag) => {
      expect(isFlushContainer(tag)).toBe(false);
    });
  });

  describe('hasDividerAbove', () => {
    it('detects a filename row drawn with a bottom border', () => {
      const above = `<div style={{ borderBottom: '1px solid var(--wa-color-border)' }}>file.ts</div>`;

      expect(hasDividerAbove(above)).toBe(true);
    });

    it('detects a tab bar', () => {
      expect(hasDividerAbove('<TabGroup>\n<Tab>react</Tab>')).toBe(true);
    });

    it('does not fire on ordinary markup', () => {
      expect(hasDividerAbove('<div className="wa-stack">')).toBe(false);
    });
  });

  describe('scanFlushCode', () => {
    it('flags a code block sitting flush without the class', () => {
      const source = [
        `<Card appearance="outlined" style={{ '--spacing': '0' }}>`,
        `  <pre>`,
        `    <code>npx kigumi init</code>`,
        `  </pre>`,
        `</Card>`,
      ].join('\n');

      const found = scanFlushCode(source, 'docs/src/Example.tsx');

      expect(found).toHaveLength(1);
      expect(found[0].kind).toBe('missing-flush-class');
      expect(found[0].line).toBe(2);
    });

    it('accepts the same block once it opts in', () => {
      const source = [
        `<Card appearance="outlined" style={{ '--spacing': '0' }}>`,
        `  <pre className="flush-code">`,
        `    <code>npx kigumi init</code>`,
        `  </pre>`,
        `</Card>`,
      ].join('\n');

      expect(scanFlushCode(source, 'docs/src/Example.tsx')).toEqual([]);
    });

    it('sees through layout wrappers between the card and the block', () => {
      // The real markup nests the block in a flank/cluster div, so a rule that
      // only looked at the immediate parent would miss every actual case.
      const source = [
        `<Card style={{ '--spacing': '0' }}>`,
        `  <div className="wa-flank:end" style={{ position: 'relative' }}>`,
        `    <pre>`,
        `      <code>npx kigumi init</code>`,
        `    </pre>`,
        `  </div>`,
        `</Card>`,
      ].join('\n');

      const found = scanFlushCode(source, 'docs/src/Example.tsx');

      expect(found).toHaveLength(1);
      expect(found[0].kind).toBe('missing-flush-class');
    });

    it('leaves a padded standalone block alone', () => {
      // These are deliberately native and must never be flagged.
      const source = [
        `<div className="wa-stack">`,
        `  <pre>`,
        `    <code>npx skills add kigumi</code>`,
        `  </pre>`,
        `</div>`,
      ].join('\n');

      expect(scanFlushCode(source, 'docs/src/Example.tsx')).toEqual([]);
    });

    it('leaves a block in a padded card alone', () => {
      const source = [
        `<Card style={{ '--spacing': 'var(--wa-space-m)' }}>`,
        `  <pre>`,
        `    <code>npx kigumi init</code>`,
        `  </pre>`,
        `</Card>`,
      ].join('\n');

      expect(scanFlushCode(source, 'docs/src/Example.tsx')).toEqual([]);
    });

    it('does not attribute a closed sibling card to a later block', () => {
      // The flush card closes before the block starts, so the block is not
      // inside it. Walking backwards without tracking depth would say it is.
      const source = [
        `<Card style={{ '--spacing': '0' }}>`,
        `  <pre className="flush-code"><code>a</code></pre>`,
        `</Card>`,
        `<div className="wa-stack">`,
        `  <pre>`,
        `    <code>b</code>`,
        `  </pre>`,
        `</div>`,
      ].join('\n');

      expect(scanFlushCode(source, 'docs/src/Example.tsx')).toEqual([]);
    });

    it('requires the divider variant below a filename row', () => {
      const source = [
        `<Card style={{ '--spacing': '0' }}>`,
        `  <div style={{ borderBottom: '1px solid var(--wa-color-border)' }}>`,
        `    kigumi.config.json`,
        `  </div>`,
        `  <pre className="flush-code">`,
        `    <code>{}</code>`,
        `  </pre>`,
        `</Card>`,
      ].join('\n');

      const found = scanFlushCode(source, 'docs/src/Example.tsx');

      expect(found).toHaveLength(1);
      expect(found[0].kind).toBe('missing-divider-variant');
    });

    it('accepts the divider variant when present', () => {
      const source = [
        `<Card style={{ '--spacing': '0' }}>`,
        `  <div style={{ borderBottom: '1px solid var(--wa-color-border)' }}>`,
        `    kigumi.config.json`,
        `  </div>`,
        `  <pre className="flush-code flush-code--below-divider">`,
        `    <code>{}</code>`,
        `  </pre>`,
        `</Card>`,
      ].join('\n');

      expect(scanFlushCode(source, 'docs/src/Example.tsx')).toEqual([]);
    });

    it('still flags a block whose card lives in another component', () => {
      // FrameworkCodeBlock and MonorepoPatternBlock render the block in a
      // helper function while the zero-inset Card sits in the exported one.
      // The divider above the block is the only local evidence, so a rule
      // keyed purely on ancestry would skip these two real call sites.
      const source = [
        `function CodePane({ snippet }) {`,
        `  return (`,
        `    <div>`,
        `      <div style={{ borderBottom: '1px solid var(--wa-color-border)' }}>`,
        `        {snippet.filename}`,
        `      </div>`,
        `      <pre>`,
        `        <code>{snippet.code}</code>`,
        `      </pre>`,
        `    </div>`,
        `  );`,
        `}`,
      ].join('\n');

      const found = scanFlushCode(source, 'docs/src/Example.tsx');

      expect(found).toHaveLength(1);
      expect(found[0].kind).toBe('missing-flush-class');
    });

    it('reports every offending block, not just the first', () => {
      const source = [
        `<Card style={{ '--spacing': '0' }}>`,
        `  <pre><code>a</code></pre>`,
        `</Card>`,
        `<Card style={{ '--spacing': '0' }}>`,
        `  <pre><code>b</code></pre>`,
        `</Card>`,
      ].join('\n');

      expect(scanFlushCode(source, 'docs/src/Example.tsx')).toHaveLength(2);
    });
  });
});

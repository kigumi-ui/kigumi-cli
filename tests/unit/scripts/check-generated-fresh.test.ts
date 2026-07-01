import { describe, it, expect } from 'vitest';
import {
  stripCssComments,
  cssRulesEqual,
  extractReactSurface,
  diffSubset,
  isDocsOnlyCssAllowed,
  splitCssRuleBlocks,
  containsAtRule,
} from '../../../scripts/check-generated-fresh.js';

describe('stripCssComments', () => {
  it('removes block comments and blank lines, trimming each rule line', () => {
    // Each line is trimmed so indentation differences never count as drift.
    const input = `/* doc comment\n * CSS Parts:\n * base — root\n */\n.Foo {\n  display: none;\n}\n\n`;
    expect(stripCssComments(input)).toBe('.Foo {\ndisplay: none;\n}');
  });

  it('treats two files differing only in comments as equal rules', () => {
    const a = `/* old style\n * base — root\n */\n.Foo::part(base) { color: red; }\n`;
    const b = `/* new style\n * - base: the root\n */\n.Foo::part(base) { color: red; }\n`;
    expect(cssRulesEqual(a, b)).toBe(true);
  });

  it('detects a real rule difference even when comments match', () => {
    const a = `/* same */\n.Foo { color: red; }\n`;
    const b = `/* same */\n.Foo { color: blue; }\n`;
    expect(cssRulesEqual(a, b)).toBe(false);
  });

  it('normalizes trailing/leading whitespace per line', () => {
    const a = `.Foo {  color: red;  }`;
    const b = `.Foo {  color: red;  }\n`;
    expect(cssRulesEqual(a, b)).toBe(true);
  });

  it('strips consecutive block comments on the same line', () => {
    const input = `/* a */.Foo { color: red; }/* b */`;
    expect(stripCssComments(input)).toBe('.Foo { color: red; }');
  });
});

describe('containsAtRule', () => {
  it('detects @media / @keyframes / @supports / @layer', () => {
    expect(
      containsAtRule('@media (max-width: 1px) { .x { color: red; } }')
    ).toBe(true);
    expect(containsAtRule('@layer base { .x {} }')).toBe(true);
  });

  it('returns false for flat rule-only CSS', () => {
    expect(containsAtRule('.Foo { color: red; }')).toBe(false);
  });

  it('ignores @ inside comments only', () => {
    // The @ is inside a stripped comment, so no real at-rule remains.
    expect(containsAtRule('/* see @media docs */ .Foo { color: red; }')).toBe(
      false
    );
  });
});

describe('splitCssRuleBlocks', () => {
  it('splits flat CSS into whole rule blocks on the closing brace', () => {
    const css = `.A { color: red; }\n.B::part(x) { display: none; }`;
    expect(splitCssRuleBlocks(css)).toEqual([
      '.A { color: red;\n}',
      '.B::part(x) { display: none;\n}',
    ]);
  });

  it('keeps multi-line declarations within their block', () => {
    const css = `.A {\n  color: red;\n  display: none;\n}`;
    expect(splitCssRuleBlocks(css)).toEqual([
      '.A {\ncolor: red;\ndisplay: none;\n}',
    ]);
  });
});

describe('isDocsOnlyCssAllowed', () => {
  it('allows the Page navigation-toggle docs-only override (multi-line rule)', () => {
    // The real docs override spans selector line + declaration + closing brace.
    const docs = `.Page::part(navigation-toggle) {\n  display: none;\n}\n.Page {\n  color: red;\n}`;
    const template = `.Page {\n  color: red;\n}`;
    expect(isDocsOnlyCssAllowed('Page', docs, template)).toBe(true);
  });

  it('does not allow an unlisted extra rule for an allowlisted component', () => {
    const docs = `.Page::part(navigation-toggle) {\n  display: none;\n}\n.Page::part(footer) {\n  color: red;\n}\n.Page {\n  color: red;\n}`;
    const template = `.Page {\n  color: red;\n}`;
    expect(isDocsOnlyCssAllowed('Page', docs, template)).toBe(false);
  });

  it('does not allow a missing/changed template rule even with allowlist', () => {
    const docs = `.Page::part(navigation-toggle) {\n  display: none;\n}\n.Page {\n  color: blue;\n}`;
    const template = `.Page {\n  color: red;\n}`;
    expect(isDocsOnlyCssAllowed('Page', docs, template)).toBe(false);
  });

  it('does not allow docs-only rules for a non-allowlisted component', () => {
    const docs = `.Button::part(base) { color: red; }\n.Button { color: red; }`;
    const template = `.Button { color: red; }`;
    expect(isDocsOnlyCssAllowed('Button', docs, template)).toBe(false);
  });

  it('refuses (returns false) when an at-rule is present, even if allowlisted', () => {
    // Nested at-rules cannot be safely rule-block-split, so fail loudly.
    const docs = `.Page::part(navigation-toggle) {\n  display: none;\n}\n@media (max-width: 1px) {\n  .Page { color: red; }\n}`;
    const template = `@media (max-width: 1px) {\n  .Page { color: red; }\n}`;
    expect(isDocsOnlyCssAllowed('Page', docs, template)).toBe(false);
  });
});

describe('extractReactSurface', () => {
  it('extracts addEventListener events (single and double quotes)', () => {
    const src = `
      el.addEventListener('blur', handleBlur);
      el.addEventListener("wa-invalid", handleWaInvalid);
    `;
    expect(extractReactSurface(src).events).toEqual(
      new Set(['blur', 'wa-invalid'])
    );
  });

  it('returns an empty event set when no listeners are wired', () => {
    expect(extractReactSurface('const x = 1;').events).toEqual(new Set());
  });
});

describe('diffSubset', () => {
  it('passes when jsx is a strict subset of tsx', () => {
    const tsx = new Set(['blur', 'focus', 'change']);
    const jsx = new Set(['blur']);
    expect(diffSubset(jsx, tsx)).toEqual([]);
  });

  it('passes when jsx equals tsx', () => {
    const tsx = new Set(['blur', 'focus']);
    const jsx = new Set(['blur', 'focus']);
    expect(diffSubset(jsx, tsx)).toEqual([]);
  });

  it('reports members present in jsx but absent in tsx', () => {
    const tsx = new Set(['blur']);
    const jsx = new Set(['blur', 'ghost-event']);
    expect(diffSubset(jsx, tsx)).toEqual(['ghost-event']);
  });

  it('passes for an empty subset', () => {
    expect(diffSubset(new Set(), new Set(['blur']))).toEqual([]);
  });
});

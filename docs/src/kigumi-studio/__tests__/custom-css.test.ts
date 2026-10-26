import { describe, it, expect } from 'vitest';
import {
  scopeCustomCSS,
  storedCustomCSS,
  validateCustomCSS,
} from '../lib/custom-css';

const ROOT = '.studio-preview .component-showcase';

/** Rules as one line each, so tests compare structure, not whitespace. */
function flat(css: string): string[] {
  return css
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .split(/(?<=\})\s*/)
    .map((rule) => rule.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

describe('custom CSS in the preview', () => {
  it('scopes a component rule to the preview', () => {
    expect(
      flat(scopeCustomCSS('.Card > .Card { box-shadow: none; }', ROOT))
    ).toEqual([
      '.studio-preview .component-showcase .Card > .Card { box-shadow: none; }',
    ]);
  });

  it('scopes each selector of a list, not the commas inside :is()', () => {
    expect(
      flat(
        scopeCustomCSS('.Badge, :is(.Tag, .Chip)::part(base) { gap: 0; }', ROOT)
      )
    ).toEqual([
      '.studio-preview .component-showcase .Badge, .studio-preview .component-showcase :is(.Tag, .Chip)::part(base) { gap: 0; }',
    ]);
  });

  it('keeps @media and scopes the rules inside it', () => {
    expect(
      flat(
        scopeCustomCSS(
          '@media (max-width: 600px) { .Card { padding: 0; } }',
          ROOT
        )
      )
    ).toEqual([
      '@media (max-width: 600px) { .studio-preview .component-showcase .Card { padding: 0; }',
      '}',
    ]);
  });

  // The preview's theme root carries the custom theme's values inline, which
  // beat any rule; a custom property set on its children still wins for
  // everything inside, as an overrides layer wins over the theme layer.
  it('puts a :root rule on the theme root, its custom properties on its children', () => {
    expect(
      flat(
        scopeCustomCSS(
          ':root { --wa-color-brand: #c2410c; font-family: serif; }',
          ROOT
        )
      )
    ).toEqual([
      '.studio-preview .component-showcase { font-family: serif; }',
      '.studio-preview .component-showcase > * { --wa-color-brand: #c2410c; }',
    ]);
  });

  it('reads html, body and the mode classes as the theme root', () => {
    expect(
      flat(
        scopeCustomCSS(
          'html.wa-dark { --wa-color-text-normal: #fafafa; }\n.wa-dark .Card { color: red; }\nbody .Badge { gap: 0; }',
          ROOT
        )
      )
    ).toEqual([
      '.studio-preview .component-showcase.wa-dark > * { --wa-color-text-normal: #fafafa; }',
      '.studio-preview .component-showcase.wa-dark .Card { color: red; }',
      '.studio-preview .component-showcase .Badge { gap: 0; }',
    ]);
  });
});

describe('custom CSS in the preview: review findings', () => {
  it('scopes the rules inside @scope and @starting-style', () => {
    expect(
      flat(
        scopeCustomCSS(
          '@scope (.Card) { .Badge { color: red; } }\n@starting-style { .Card { opacity: 0; } }',
          ROOT
        )
      )
    ).toEqual([
      '@scope (.Card) { .studio-preview .component-showcase .Badge { color: red; }',
      '}',
      '@starting-style { .studio-preview .component-showcase .Card { opacity: 0; }',
      '}',
    ]);
  });

  it('sends a custom property with a comment before it to the children', () => {
    expect(
      flat(
        scopeCustomCSS(':root { /* brand */ --wa-color-brand: #c2410c; }', ROOT)
      )
    ).toEqual([
      '.studio-preview .component-showcase > * { --wa-color-brand: #c2410c; }',
    ]);
  });

  it('keeps a rule nested in a :root rule whole, on the root', () => {
    expect(
      flat(
        scopeCustomCSS(
          ':root { --gap: 1rem; .Card { color: red; --inset: 0; } }',
          ROOT
        )
      )
    ).toEqual([
      '.studio-preview .component-showcase { .Card { color: red; --inset: 0; }',
      '}',
      '.studio-preview .component-showcase > * { --gap: 1rem; }',
    ]);
  });
});

describe('custom CSS in the preview: global at-rules', () => {
  it('leaves @property out: it registers the property for the whole page', () => {
    expect(
      flat(
        scopeCustomCSS(
          "@property --wa-color-brand { syntax: '<color>'; inherits: false; initial-value: red; }\n.Card { color: red; }",
          ROOT
        )
      )
    ).toEqual(['.studio-preview .component-showcase .Card { color: red; }']);
  });

  it('gives @keyframes a preview name and points the rules that animate at it', () => {
    expect(
      flat(
        scopeCustomCSS(
          '@keyframes spin { to { rotate: 1turn; } }\n.Spinner { animation: spin 1s linear infinite; }\n@media (prefers-reduced-motion: no-preference) { .Badge { animation-name: spin, spinner-fade; } }',
          ROOT
        )
      )
    ).toEqual([
      '@keyframes kigumi-preview-spin { to { rotate: 1turn; }',
      '}',
      '.studio-preview .component-showcase .Spinner { animation: kigumi-preview-spin 1s linear infinite; }',
      '@media (prefers-reduced-motion: no-preference) { .studio-preview .component-showcase .Badge { animation-name: kigumi-preview-spin, spinner-fade; }',
      '}',
    ]);
  });
});

describe('custom CSS check before Apply', () => {
  it('accepts rules, at-rules, comments and braces inside strings', () => {
    expect(
      validateCustomCSS(
        '/* nested cards */\n.Card > .Card { box-shadow: none; }\n@media (min-width: 40rem) { .Badge::after { content: "}"; } }'
      )
    ).toEqual([]);
  });

  it('accepts no custom CSS at all', () => {
    expect(validateCustomCSS('  \n')).toEqual([]);
  });

  it.each([
    [
      'a block never closed',
      '.Card { color: red;',
      '".Card" opens a block that is never closed.',
    ],
    [
      'a } with no block',
      '.Card { color: red; } }',
      'A } closes a block that was never opened.',
    ],
    [
      'a declaration outside a rule',
      'color: red;',
      '"color: red;" is outside any rule.',
    ],
    [
      'text after the last rule',
      '.Card { color: red; } .Badge',
      '".Badge" after the last rule is not part of any rule.',
    ],
    [
      'a block without a selector',
      '{ color: red; }',
      'A block has no selector before its {.',
    ],
    [
      'a comment never closed',
      '.Card { color: red; } /* note',
      'A comment is never closed with */.',
    ],
    [
      'an unbalanced block inside @media',
      '@media print { .Card { color: red; }',
      '"@media print" opens a block that is never closed.',
    ],
    [
      'a declaration outside a rule inside @media',
      '@media print { color: red; }',
      '"color: red;" is outside any rule.',
    ],
  ])('refuses %s', (_label, css, error) => {
    expect(validateCustomCSS(css)).toEqual([error]);
  });
});

describe('custom CSS saved by an earlier Studio', () => {
  it('reads an imported rule saved with the preview scope as written', () => {
    expect(
      storedCustomCSS(
        '.studio-preview .Card > .Card, .studio-preview .Badge {\n  box-shadow: none;\n}'
      )
    ).toBe('.Card > .Card, .Badge {\n  box-shadow: none;\n}');
  });

  it('strips the scope only where it starts a selector', () => {
    expect(
      storedCustomCSS(
        '.studio-preview .Badge::after {\n  content: "see .studio-preview docs";\n}'
      )
    ).toBe('.Badge::after {\n  content: "see .studio-preview docs";\n}');
  });

  it('leaves custom CSS saved unscoped, and none, as it is', () => {
    expect(storedCustomCSS('.Card > .Card { box-shadow: none; }')).toBe(
      '.Card > .Card { box-shadow: none; }'
    );
    expect(storedCustomCSS(null)).toBeNull();
    expect(storedCustomCSS(undefined)).toBeNull();
  });
});

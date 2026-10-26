import { describe, it, expect } from 'vitest';
import {
  MAX_AGENT_CSS_LENGTH,
  validateAgentCSS,
} from '../theme-agent/agent-css';

describe('custom CSS from the Theme Agent', () => {
  it('accepts rules that take every colour from a --wa- value', () => {
    expect(
      validateAgentCSS(
        [
          '.Card::part(base) { border: none; }',
          'wa-card::part(header) {',
          '  border-bottom: var(--wa-border-width-s) solid var(--wa-color-surface-border);',
          '}',
          '.wa-dark .Card { box-shadow: 0 0 0 1px var(--wa-color-neutral-border-quiet); }',
          '.Button { background: transparent; color: currentColor; }',
        ].join('\n')
      )
    ).toEqual([]);
  });

  it('accepts @media, @supports and @container, with the rules inside checked', () => {
    expect(
      validateAgentCSS(
        [
          '@media (max-width: 600px) { .Card { padding: 0; } }',
          '@supports (display: grid) { @container (min-width: 20rem) { .Card { gap: 1rem; } } }',
        ].join('\n')
      )
    ).toEqual([]);
    expect(
      validateAgentCSS('@media (max-width: 600px) { .Card { color: red; } }')
    ).toEqual([
      '.Card color: "red" is a colour literal; take every colour from a var(--wa-*) value',
    ]);
  });

  it('refuses CSS that does not parse', () => {
    expect(validateAgentCSS('.Card { border: none;')).toEqual([
      'customCSS: ".Card" opens a block that is never closed.',
    ]);
  });

  it.each([
    ['@import', '@import "https://example.com/x.css";', '@import'],
    ['@font-face', '@font-face { font-family: X; }', '@font-face'],
    ['@keyframes', '@keyframes spin { to { rotate: 1turn; } }', '@keyframes'],
    ['@layer', '@layer overrides { .Card { gap: 0; } }', '@layer'],
    [
      'a nested @property',
      '@media print { @property --x { syntax: "*"; inherits: false; } }',
      '@property',
    ],
  ])('refuses %s', (_name, css, atRule) => {
    expect(validateAgentCSS(css)).toContain(
      `customCSS: ${atRule} is not allowed; only @media, @supports and @container`
    );
  });

  it.each([
    ['url()', '.Card { background: url(https://example.com/x.png); }', 'url('],
    [
      'image-set()',
      '.Card { background-image: image-set("x.png" 1x); }',
      'image-set(',
    ],
  ])('refuses %s, which loads a resource', (_name, css, fn) => {
    expect(validateAgentCSS(css)).toContain(
      `customCSS: ${fn}) loads a resource and is not allowed`
    );
  });

  it.each([
    ['expression()', '.Card { width: expression(alert(1)); }'],
    ['a javascript: value', '.Card { cursor: "javascript:alert(1)"; }'],
    ['-moz-binding', '.Card { -moz-binding: none; }'],
    ['behavior', '.Card { behavior: none; }'],
    ['markup', '.Card { content: "</style><script>"; }'],
    ['a backslash escape', '.Card { content: "\\75 rl"; }'],
  ])('refuses %s, which is script-like', (_name, css) => {
    expect(validateAgentCSS(css).join('\n')).toMatch(/script-like/);
  });

  it('refuses CSS over the size limit', () => {
    const rule = '.Card { padding: 0; }\n';
    const css = rule.repeat(Math.ceil(MAX_AGENT_CSS_LENGTH / rule.length) + 1);
    const [error, ...rest] = validateAgentCSS(css);
    expect(rest).toEqual([]);
    expect(error).toMatch(
      new RegExp(
        `^customCSS: \\d+ characters, more than the ${MAX_AGENT_CSS_LENGTH} allowed$`
      )
    );
  });

  it.each([
    ['a hex colour', '.Card { color: #ff0000; }', '#ff0000'],
    ['a short hex colour', '.Card { border-color: #f00; }', '#f00'],
    ['rgb()', '.Card { color: rgb(255 0 0); }', 'rgb('],
    ['oklch()', '.Card { background: oklch(70% 0.1 200); }', 'oklch('],
    [
      'color-mix()',
      '.Card { color: color-mix(in srgb, var(--wa-color-brand) 50%, white); }',
      'color-mix(',
    ],
    ['a named colour', '.Card { border: 1px solid tomato; }', 'tomato'],
    ['a system colour', '.Card { color: CanvasText; }', 'CanvasText'],
  ])('refuses %s', (_name, css, literal) => {
    expect(validateAgentCSS(css).join('\n')).toContain(`"${literal}"`);
  });

  it('refuses a colour from a custom property that is not a --wa- value', () => {
    expect(validateAgentCSS('.Card { color: var(--brand-red); }')).toEqual([
      '.Card color: var(--brand-red) is not a --wa- value; take every colour from a var(--wa-*) value',
    ]);
  });

  it('reads a hex in a selector as an id, not a colour', () => {
    expect(validateAgentCSS('#app .Card { gap: 0; }')).toEqual([]);
  });

  it('refuses a nested rule, which it cannot check', () => {
    expect(
      validateAgentCSS('.Card { & .Button { color: var(--wa-color-brand); } }')
    ).toEqual([
      '.Card: a nested rule is not allowed; write each rule at the top level or inside @media, @supports or @container',
    ]);
  });
});

describe('custom CSS from the Theme Agent: review holes', () => {
  it.each([
    ['-webkit-link', '.Card { color: -webkit-link; }'],
    ['-moz-default-color', '.Card { border-color: -moz-default-color; }'],
  ])('refuses the vendor-prefixed value %s', (literal, css) => {
    expect(validateAgentCSS(css).join('\n')).toContain(`"${literal}"`);
  });

  it.each([
    ['-moz-element', '.Card { background: -moz-element(#app); }'],
    [
      '-webkit-cross-fade',
      '.Card { background: -webkit-cross-fade(a, b, 50%); }',
    ],
  ])('refuses %s(), which loads a resource', (fn, css) => {
    expect(validateAgentCSS(css)).toContain(
      `customCSS: ${fn}() loads a resource and is not allowed`
    );
  });

  it('reads a colour between two strings with mixed quotes as a colour', () => {
    expect(
      validateAgentCSS(`.Card { quotes: "'a" red "b'"; }`).join('\n')
    ).toContain('"red"');
  });
});

describe('custom CSS from the Theme Agent: the user own rules', () => {
  const handWritten = [
    '@font-face { font-family: Brand; src: url(/brand.woff2); }',
    '.Button { color: #ff0000; }',
  ].join('\n');
  const added = '.Card::part(base) { border: none; }';

  it('leaves the rules it keeps from the current custom CSS unchecked', () => {
    expect(validateAgentCSS(`${handWritten}\n${added}`, handWritten)).toEqual(
      []
    );
  });

  it('reads a kept rule as kept whatever its whitespace', () => {
    expect(
      validateAgentCSS(
        `.Button {\n  color: #ff0000;\n}\n${added}`,
        '.Button { color: #ff0000; }'
      )
    ).toEqual([]);
  });

  it('checks a rule it changed or added', () => {
    expect(
      validateAgentCSS(
        `${handWritten}\n.Card { color: #00ff00; }`,
        handWritten
      ).join('\n')
    ).toContain('"#00ff00"');
    expect(
      validateAgentCSS('.Button { color: #00ff00; }', handWritten).join('\n')
    ).toContain('"#00ff00"');
  });

  it('counts only what it adds toward the size limit', () => {
    const rule = '.Button { padding: 0; }\n';
    const long = rule.repeat(Math.ceil(MAX_AGENT_CSS_LENGTH / rule.length) + 1);
    expect(validateAgentCSS(`${long}\n${added}`, long)).toEqual([]);
  });
});

describe("custom CSS from the Theme Agent: Studio's own classes", () => {
  it.each([
    '.component-showcase { background: var(--wa-color-surface-default); }',
    '.studio-preview .Card { gap: 0; }',
    '@media (min-width: 40rem) { .showcase-section { gap: 0; } }',
  ])('refuses a selector on a Studio class: %s', (css) => {
    expect(validateAgentCSS(css).join('\n')).toMatch(
      /Studio's own class, in no project/
    );
  });

  it('accepts the page as body, html or :root', () => {
    expect(
      validateAgentCSS(
        'body { background: radial-gradient(var(--wa-color-surface-border) 1px, transparent 1px); }\n:root, html { scroll-behavior: smooth; }'
      )
    ).toEqual([]);
  });
});

describe('custom CSS from the Theme Agent: comments', () => {
  // A browser reads a comment as a space, so it must not join the words
  // around it into one the colour check does not know.
  it.each([
    ['a named colour', '.Card { border: 1px solid/**/red; }', '"red"'],
    [
      'a colour function',
      '.Card { border: 1px solid/**/rgb(255 0 0); }',
      '"rgb("',
    ],
    [
      'a vendor keyword',
      '.Card { color:/* x */-webkit-link; }',
      '"-webkit-link"',
    ],
  ])('reads %s after a comment', (_name, css, literal) => {
    expect(validateAgentCSS(css).join('\n')).toContain(literal);
  });
});

describe('custom CSS from the Theme Agent: colours mixed from --wa- values', () => {
  // Every input is a --wa- value, but the result is a colour of its own that
  // the contrast check on the theme's values never sees (ADR 0009).
  it.each([
    'oklch(from var(--wa-color-brand) l c h / 50%)',
    'color-mix(in oklab, var(--wa-color-brand), var(--wa-color-surface-default))',
    'light-dark(var(--wa-color-brand), var(--wa-color-surface-default))',
  ])('refuses %s', (value) => {
    expect(validateAgentCSS(`.Card { color: ${value}; }`).join('\n')).toMatch(
      /makes a colour of its own, which the contrast check does not see/
    );
  });
});

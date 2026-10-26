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
    expect(validateAgentCSS(css)).toEqual([
      `customCSS: ${css.length} characters, more than the ${MAX_AGENT_CSS_LENGTH} allowed`,
    ]);
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

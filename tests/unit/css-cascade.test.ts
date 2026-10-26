/**
 * The built-CSS cascade reader the React consumer suite judges the
 * overrides layer with (issue #194). It must agree with how a browser
 * orders cascade layers, or the e2e check proves nothing.
 */

import { describe, it, expect } from 'vitest';
import { cascadeWinner } from '../e2e/_helpers/css-cascade.js';

const PROBE = '--kigumi-probe';

describe('cascadeWinner', () => {
  it('lets the later layer win, whatever the source order of the rules', () => {
    // The order statement fixes the layers before either block appears.
    const css = `@layer base,theme,overrides;@layer overrides{:root{${PROBE}:overrides}}@layer theme{:root{${PROBE}:theme}}`;
    expect(cascadeWinner(css, PROBE)).toEqual({
      value: 'overrides',
      layer: 'overrides',
    });
  });

  it('orders layers by first appearance when blocks declare them', () => {
    // How Vite's minifier writes layers.css: blocks, no order statement.
    const css = `@layer base{a{color:red}}@layer theme{:root{${PROBE}:theme}}@layer overrides{:root{${PROBE}:overrides}}`;
    expect(cascadeWinner(css, PROBE)?.value).toBe('overrides');
  });

  it('lets an earlier-declared layer lose even when its block comes last', () => {
    const css = `@layer base{}@layer theme{}@layer overrides{:root{${PROBE}:overrides}}@layer theme{:root{${PROBE}:theme-again}}`;
    expect(cascadeWinner(css, PROBE)?.value).toBe('overrides');
  });

  it('lets an unlayered declaration beat every layer', () => {
    // The Next.js Pages Router path: no layers, source order decides.
    const css = `@layer overrides{:root{${PROBE}:overrides}}:root{${PROBE}:unlayered}`;
    expect(cascadeWinner(css, PROBE)).toEqual({
      value: 'unlayered',
      layer: null,
    });
  });

  it('lets the later of two unlayered declarations win', () => {
    const css = `:root{${PROBE}:first}:root{${PROBE}:second}`;
    expect(cascadeWinner(css, PROBE)?.value).toBe('second');
  });

  it('ranks a nested layer by its top-level layer', () => {
    // Web Awesome's own layers end up inside base.
    const css = `@layer base{@layer wa-theme-overrides{:root{${PROBE}:wa}}}@layer theme{:root{${PROBE}:theme}}`;
    expect(cascadeWinner(css, PROBE)).toEqual({
      value: 'theme',
      layer: 'theme',
    });
  });

  it('ignores declarations inside comments and other properties', () => {
    const css = `/* :root{${PROBE}:comment} */@layer theme{:root{${PROBE}-other:x;${PROBE}:theme}}`;
    expect(cascadeWinner(css, PROBE)?.value).toBe('theme');
  });

  it('returns undefined when nothing declares the property', () => {
    expect(cascadeWinner(':root{color:red}', PROBE)).toBeUndefined();
  });
});

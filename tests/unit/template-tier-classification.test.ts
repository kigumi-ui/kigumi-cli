/**
 * Tier Classification Drift Audit
 *
 * Enforces the two-tier React wrapper split introduced in v0.20 for Next.js
 * App Router compatibility:
 *
 * - Tier 1 (presentational, RSC-safe): no hooks, no `'use client';`.
 * - Tier 2 (interactive): first line is `'use client';`, rest unchanged.
 *
 * Source of truth: `tier` field on `src/utils/component-metadata.ts`
 * (CEM-derived). If a template drifts from its assigned tier, this test
 * fails fast and names the component + violated invariant.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'react');

const FORBIDDEN_HOOKS = [
  /\buseRef\s*\(/,
  /\buseImperativeHandle\s*\(/,
  /\buseEffect\s*\(/,
  /\buseState\s*\(/,
];

/**
 * Strip JSDoc/line comments so hook references inside `@example` snippets
 * (e.g. Markdown's docblock showing `useRef<MarkdownRef>`) don't trip the
 * audit. JSDoc is documentation, not executable code.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
}

function readTemplate(name: string, ext: 'tsx' | 'jsx'): string {
  const file = path.join(TEMPLATES_DIR, name, `${name}.${ext}.hbs`);
  return fs.readFileSync(file, 'utf-8');
}

const USE_CLIENT_LINE = "'use client';";

describe('tier classification drift audit', () => {
  // Build the [pascalName, tier] pairs once. Both registry and metadata key
  // on the same kebab-case component key.
  const components = Object.entries(COMPONENT_METADATA).map(([key, meta]) => {
    const def = LOCAL_REGISTRY[key];
    if (!def) {
      throw new Error(
        `Metadata entry "${key}" has no matching registry entry — ` +
          `the two must stay in lockstep.`
      );
    }
    return { key, name: def.name, tier: meta.tier };
  });

  it('covers all 74 Web Awesome components', () => {
    expect(components).toHaveLength(74);
  });

  describe('Tier 1 (presentational) TSX', () => {
    const tier1 = components.filter((c) => c.tier === 'presentational');

    it.each(tier1.map((c) => [c.name]))(
      '%s.tsx.hbs has no forbidden hooks',
      (name) => {
        const source = stripComments(readTemplate(name, 'tsx'));
        for (const re of FORBIDDEN_HOOKS) {
          expect(
            re.test(source),
            `${name}.tsx.hbs must not use ${re.source}; Tier 1 components ` +
              `are pure forwardRef pass-throughs. Update the CEM-derived ` +
              `tier or rewrite the template.`
          ).toBe(false);
        }
      }
    );

    it.each(tier1.map((c) => [c.name]))(
      "%s.tsx.hbs does not start with 'use client';",
      (name) => {
        const firstLine = readTemplate(name, 'tsx').split('\n')[0];
        expect(firstLine).not.toBe(USE_CLIENT_LINE);
      }
    );
  });

  describe('Tier 1 (presentational) JSX', () => {
    const tier1 = components.filter((c) => c.tier === 'presentational');

    it.each(tier1.map((c) => [c.name]))(
      "%s.jsx.hbs does not contain 'use client';",
      (name) => {
        const source = readTemplate(name, 'jsx');
        expect(source).not.toContain(USE_CLIENT_LINE);
      }
    );
  });

  describe('Tier 2 (interactive) TSX', () => {
    const tier2 = components.filter((c) => c.tier === 'interactive');

    it.each(tier2.map((c) => [c.name]))(
      "%s.tsx.hbs starts with 'use client';",
      (name) => {
        const firstLine = readTemplate(name, 'tsx').split('\n')[0];
        expect(firstLine).toBe(USE_CLIENT_LINE);
      }
    );
  });

  describe('Tier 2 (interactive) JSX', () => {
    const tier2 = components.filter((c) => c.tier === 'interactive');

    it.each(tier2.map((c) => [c.name]))(
      "%s.jsx.hbs starts with 'use client';",
      (name) => {
        const firstLine = readTemplate(name, 'jsx').split('\n')[0];
        expect(firstLine).toBe(USE_CLIENT_LINE);
      }
    );
  });
});

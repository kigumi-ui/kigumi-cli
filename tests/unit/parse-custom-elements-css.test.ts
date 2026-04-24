/**
 * Tests for CEM → CSS_METADATA extraction
 *
 * Exercises three layers:
 *   1. Pure `extractCssMetadata` function — input/output contracts
 *   2. Regression checks against the committed generated `CSS_METADATA` —
 *      catches stale hand-maintained data from ever re-appearing
 *   3. Invariant: every registry component is either covered by CEM or
 *      is a known CSS-less utility component
 *   4. Cross-framework parity: all three generators consume CSS_METADATA
 *      consistently (guards against lookup bugs in any one generator).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractCssMetadata } from '../../scripts/parse-custom-elements.js';
import { CSS_METADATA } from '../../scripts/css-metadata.js';
import { getAllComponents } from '../../src/utils/registry.js';
import { toKebabCase } from '../../src/utils/naming.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

// ── 1. Pure extractor contract ───────────────────────────────────────────────

describe('extractCssMetadata (pure)', () => {
  it('maps CEM parts + properties onto the CSS_METADATA shape', () => {
    const result = extractCssMetadata({
      tagName: 'wa-dialog',
      cssParts: [
        { name: 'dialog', description: "The dialog's internal element." },
        { name: 'body', description: "The dialog's body content area." },
      ],
      cssProperties: [
        { name: '--spacing', description: 'Space around content.' },
        {
          name: '--show-duration',
          description: 'Animation duration when displaying.',
          default: '200ms',
        },
      ],
    });

    expect(result).toEqual({
      parts: [
        { name: 'dialog', description: "The dialog's internal element." },
        { name: 'body', description: "The dialog's body content area." },
      ],
      customProperties: [
        { name: '--spacing', description: 'Space around content.' },
        {
          name: '--show-duration',
          description: 'Animation duration when displaying.',
          default: '200ms',
        },
      ],
      docsUrl: 'https://webawesome.com/docs/components/dialog',
    });
  });

  it('returns null when CEM declares neither parts nor custom properties', () => {
    expect(
      extractCssMetadata({
        tagName: 'wa-animation',
        cssParts: [],
        cssProperties: [],
      })
    ).toBeNull();
    expect(
      extractCssMetadata({
        tagName: 'wa-include',
      })
    ).toBeNull();
  });

  it('returns a result when only parts exist', () => {
    const result = extractCssMetadata({
      tagName: 'wa-tab',
      cssParts: [{ name: 'base', description: 'Base.' }],
      cssProperties: [],
    });
    expect(result?.parts).toHaveLength(1);
    expect(result?.customProperties).toEqual([]);
  });

  it('returns a result when only custom properties exist', () => {
    const result = extractCssMetadata({
      tagName: 'wa-divider',
      cssParts: [],
      cssProperties: [{ name: '--color', description: 'Color.' }],
    });
    expect(result?.parts).toEqual([]);
    expect(result?.customProperties).toHaveLength(1);
  });

  it('omits the default key on custom properties that have no default', () => {
    const result = extractCssMetadata({
      tagName: 'wa-card',
      cssParts: [],
      cssProperties: [{ name: '--spacing', description: 'Spacing.' }],
    });
    const prop = result!.customProperties[0];
    expect(prop).not.toHaveProperty('default');
    expect(Object.keys(prop)).toEqual(['name', 'description']);
  });

  it('preserves an empty-string default (distinguishes "no default" from "default is empty")', () => {
    // Guard: a truthiness check (`if (p.default)`) would silently drop this.
    // CEM is free to ship `default: ""` for reset-style properties, so the
    // contract must be "present iff CEM says it's present".
    const result = extractCssMetadata({
      tagName: 'wa-dialog',
      cssParts: [],
      cssProperties: [
        { name: '--reset-color', description: 'Reset color.', default: '' },
      ],
    });
    expect(result?.customProperties[0]).toEqual({
      name: '--reset-color',
      description: 'Reset color.',
      default: '',
    });
  });

  it('filters entries where CEM omits the name field', () => {
    const result = extractCssMetadata({
      tagName: 'wa-dialog',
      cssParts: [
        { description: 'unnamed — should be dropped' },
        { name: 'body', description: 'Body.' },
      ],
      cssProperties: [
        { description: 'unnamed property — should be dropped' },
        { name: '--spacing', description: 'Spacing.' },
      ],
    });
    expect(result?.parts).toEqual([{ name: 'body', description: 'Body.' }]);
    expect(result?.customProperties).toEqual([
      { name: '--spacing', description: 'Spacing.' },
    ]);
  });

  it('falls back to empty string for missing descriptions but preserves the name', () => {
    const result = extractCssMetadata({
      tagName: 'wa-tab',
      cssParts: [{ name: 'base' }],
      cssProperties: [{ name: '--color' }],
    });
    expect(result?.parts[0]).toEqual({ name: 'base', description: '' });
    expect(result?.customProperties[0]).toEqual({
      name: '--color',
      description: '',
    });
  });

  it('preserves part names with special characters (e.g. BEM-style double underscore)', () => {
    const result = extractCssMetadata({
      tagName: 'wa-dialog',
      cssParts: [
        {
          name: 'close-button__base',
          description: "The close button's exported base part.",
        },
      ],
      cssProperties: [],
    });
    expect(result?.parts[0].name).toBe('close-button__base');
  });

  it('derives docsUrl from multi-word tag names correctly', () => {
    expect(
      extractCssMetadata({
        tagName: 'wa-color-picker',
        cssParts: [{ name: 'base', description: 'Base.' }],
        cssProperties: [],
      })?.docsUrl
    ).toBe('https://webawesome.com/docs/components/color-picker');
  });
});

// ── 2. Regression checks against the committed generated file ────────────────
//
// The hand-maintained CSS_METADATA historically shipped stale data that
// survived WA's 3.x renames. Assert explicitly that the OLD names are absent
// and the CURRENT WA names are present so a regression to hand-maintained
// data fails loudly instead of silently misleading users.

describe('CSS_METADATA regressions — WA 3.x names, not Shoelace-era names', () => {
  it('button uses the WA 3.x `start` / `end` parts, not the legacy `prefix` / `suffix`', () => {
    const partNames = CSS_METADATA['button'].parts.map((p) => p.name);
    expect(partNames).toContain('start');
    expect(partNames).toContain('end');
    expect(partNames).not.toContain('prefix');
    expect(partNames).not.toContain('suffix');
  });

  it('input uses WA 3.x part names (label, hint, base, input) without the legacy form-control-* wrappers', () => {
    const partNames = CSS_METADATA['input'].parts.map((p) => p.name);
    expect(partNames).toEqual(
      expect.arrayContaining(['label', 'hint', 'base', 'input'])
    );
    expect(partNames).not.toContain('form-control');
    expect(partNames).not.toContain('form-control-label');
    expect(partNames).not.toContain('form-control-input');
    expect(partNames).not.toContain('form-control-help-text');
  });

  it('card does not expose a `base` part — WA 3.x dropped the base wrapper', () => {
    const partNames = CSS_METADATA['card'].parts.map((p) => p.name);
    expect(partNames).not.toContain('base');
    expect(partNames).toEqual(
      expect.arrayContaining(['media', 'header', 'body', 'footer'])
    );
  });

  it('does NOT include --wa-* global tokens as per-component custom properties', () => {
    // The old hand-maintained CSS_METADATA leaked global tokens (--wa-spacing-*)
    // into per-component scaffolds. Component-scoped props in CEM never start
    // with `--wa-` — they're always short names like `--spacing`, `--width`.
    for (const [key, meta] of Object.entries(CSS_METADATA)) {
      for (const prop of meta.customProperties) {
        expect(
          prop.name.startsWith('--wa-'),
          `CSS_METADATA['${key}'] leaks a --wa-* global token as a component property: ${prop.name}`
        ).toBe(false);
      }
    }
  });
});

describe('CSS_METADATA shape + content sanity', () => {
  it('keys are sorted alphabetically for stable diffs', () => {
    const keys = Object.keys(CSS_METADATA);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });

  it('every entry has a docsUrl pointing at the matching component page', () => {
    for (const [key, meta] of Object.entries(CSS_METADATA)) {
      expect(meta.docsUrl).toBe(
        `https://webawesome.com/docs/components/${key}`
      );
    }
  });

  it('every entry has at least one part OR custom property (no empty stubs)', () => {
    for (const [key, meta] of Object.entries(CSS_METADATA)) {
      const total = meta.parts.length + meta.customProperties.length;
      expect(
        total,
        `CSS_METADATA['${key}'] has zero parts AND zero custom properties — it should not be in the map at all (extractCssMetadata should return null)`
      ).toBeGreaterThan(0);
    }
  });

  it('preserves multi-word keys as kebab-case (not collapsed to one word)', () => {
    expect(CSS_METADATA).toHaveProperty('file-input');
    expect(CSS_METADATA).toHaveProperty('button-group');
    expect(CSS_METADATA).toHaveProperty('color-picker');
    expect(CSS_METADATA).not.toHaveProperty('fileinput');
    expect(CSS_METADATA).not.toHaveProperty('buttongroup');
  });

  it('dialog carries both parts and properties with defaults preserved', () => {
    // Dialog is the canonical "rich" component — parts for structural hooks,
    // custom properties for animation tuning with explicit defaults.
    const dialog = CSS_METADATA['dialog'];
    expect(dialog.parts.map((p) => p.name)).toEqual(
      expect.arrayContaining(['dialog', 'header', 'title', 'body', 'footer'])
    );
    const showDuration = dialog.customProperties.find(
      (p) => p.name === '--show-duration'
    );
    expect(showDuration).toBeDefined();
    expect(showDuration?.default).toBe('200ms');
  });
});

// ── 3. Registry-coverage invariant ───────────────────────────────────────────
//
// Core promise: every component a user can install produces a useful CSS
// scaffold. "Useful" means either a populated CSS_METADATA entry, or the
// component legitimately has no CSS surface (utility components like
// wa-animation that never render anything). Enforce this invariant so that
// when WA adds a new component OR removes CSS from an existing one, CI tells
// us before a user finds out.

const KNOWN_CSS_LESS_COMPONENTS = new Set([
  // Invisible utility components. Confirmed against custom-elements.json 3.5.0:
  // each declares zero cssParts and zero cssProperties.
  'animation',
  'format-bytes',
  'format-date',
  'format-number',
  'include',
  'intersection-observer',
  'markdown',
  'mutation-observer',
  'relative-time',
  'resize-observer',
]);

describe('Registry × CSS_METADATA invariant', () => {
  it('every registry component has CSS_METADATA coverage OR is a known CSS-less utility', () => {
    const uncovered: string[] = [];
    for (const [_key, component] of Object.entries(getAllComponents())) {
      const kebab = toKebabCase(component.name);
      const covered = kebab in CSS_METADATA;
      const knownEmpty = KNOWN_CSS_LESS_COMPONENTS.has(kebab);
      if (!covered && !knownEmpty) uncovered.push(kebab);
    }
    expect(
      uncovered,
      `Uncovered components (add to CSS_METADATA via CEM regen, or add to KNOWN_CSS_LESS_COMPONENTS if WA legitimately has no CSS surface for them): ${uncovered.join(', ')}`
    ).toEqual([]);
  });

  it('no component is both covered and marked CSS-less (the two lists are disjoint)', () => {
    const overlap = [...KNOWN_CSS_LESS_COMPONENTS].filter(
      (k) => k in CSS_METADATA
    );
    expect(
      overlap,
      `Components appear in both CSS_METADATA and KNOWN_CSS_LESS_COMPONENTS — remove from KNOWN_CSS_LESS_COMPONENTS: ${overlap.join(', ')}`
    ).toEqual([]);
  });

  it('every KNOWN_CSS_LESS_COMPONENTS entry exists in the registry (no dead entries)', () => {
    const registryKebabs = new Set(
      Object.values(getAllComponents()).map((c) => toKebabCase(c.name))
    );
    const dead = [...KNOWN_CSS_LESS_COMPONENTS].filter(
      (k) => !registryKebabs.has(k)
    );
    expect(
      dead,
      `KNOWN_CSS_LESS_COMPONENTS lists components that aren't in the registry: ${dead.join(', ')}`
    ).toEqual([]);
  });
});

// ── 4. Generated CSS template parity across frameworks ───────────────────────
//
// The three framework generators (React, Vue, Angular) share CSS_METADATA as
// the sole source of parts/properties data. A lookup bug in one generator
// (e.g. a PascalCase-vs-kebab-case mismatch) silently strips the data for
// that framework only — React users get guidance while Angular users get an
// empty scaffold. These tests catch that kind of drift by comparing framework
// outputs directly.

function extractPartsFromCss(content: string): string[] {
  const partsSection = content.match(/CSS Parts:\n([\s\S]*?)(?:\n\s*\*\/|$)/);
  if (!partsSection) return [];
  return partsSection[1]
    .split('\n')
    .map(
      (line) =>
        line
          .replace(/^\s*\*\s*-?\s*/, '')
          .trim()
          .split(/[\s:]/)[0]
    )
    .filter(Boolean);
}

describe('Generated CSS templates use CSS_METADATA consistently', () => {
  it('React, Vue, and Angular Button.css all expose the CEM parts (start/end, not prefix/suffix)', async () => {
    const react = await fs.readFile(
      path.join(TEMPLATES_DIR, 'react/Button/Button.css'),
      'utf-8'
    );
    const vue = await fs.readFile(
      path.join(TEMPLATES_DIR, 'vue/Button/Button.css'),
      'utf-8'
    );
    const angular = await fs.readFile(
      path.join(TEMPLATES_DIR, 'angular/Button/button.component.css'),
      'utf-8'
    );

    const expected = ['base', 'start', 'label', 'end', 'caret', 'spinner'];
    for (const [framework, content] of [
      ['react', react],
      ['vue', vue],
      ['angular', angular],
    ] as const) {
      const parts = extractPartsFromCss(content);
      expect(
        parts,
        `${framework} Button.css is missing CEM-derived parts — generator's CSS_METADATA lookup is likely broken`
      ).toEqual(expect.arrayContaining(expected));
      expect(parts, `${framework} Button.css leaks legacy parts`).not.toContain(
        'prefix'
      );
      expect(parts, `${framework} Button.css leaks legacy parts`).not.toContain(
        'suffix'
      );
    }
  });

  it('Dialog CSS exposes --show-duration with its default in all three frameworks', async () => {
    // Guards two related classes of bug:
    //   1. Angular previously only emitted parts (never customProperties).
    //   2. React/Vue emitted customProperties but dropped the default value.
    // All three generators must now surface CEM defaults consistently.
    const frameworks = [
      ['react', 'react/Dialog/Dialog.css'],
      ['vue', 'vue/Dialog/Dialog.css'],
      ['angular', 'angular/Dialog/dialog.component.css'],
    ] as const;
    for (const [framework, rel] of frameworks) {
      const content = await fs.readFile(path.join(TEMPLATES_DIR, rel), 'utf-8');
      expect(
        content,
        `${framework} Dialog.css is missing the CSS Custom Properties section`
      ).toMatch(/CSS Custom Properties:/);
      expect(
        content,
        `${framework} Dialog.css is missing the "default: 200ms" annotation for --show-duration`
      ).toMatch(/--show-duration.*default: 200ms/);
    }
  });

  it('a Tooltip-class component carries parts + properties in all frameworks', async () => {
    // Tooltip was one of ~57 components previously missing CSS_METADATA —
    // every framework shipped an empty comment block. Assert all three
    // generators now emit the CEM-derived data consistently.
    const frameworks = [
      ['react', 'react/Tooltip/Tooltip.css'],
      ['vue', 'vue/Tooltip/Tooltip.css'],
      ['angular', 'angular/Tooltip/tooltip.component.css'],
    ] as const;
    for (const [framework, rel] of frameworks) {
      const content = await fs.readFile(path.join(TEMPLATES_DIR, rel), 'utf-8');
      expect(
        extractPartsFromCss(content).length,
        `${framework} Tooltip.css has no parts — expected CEM-derived parts in the generated scaffold`
      ).toBeGreaterThan(0);
    }
  });
});

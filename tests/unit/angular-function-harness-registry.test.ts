/**
 * Function harness loop over every Angular Template (issue #77).
 *
 * The same CEM contract the React and Vue loops prove (issues #75, #76),
 * against the committed `.component.ts` Templates: host tag, CEM attributes,
 * CEM listeners with cleanup, dispatch reaching the `@Output()`, public CEM
 * methods on the component instance. On top, the Angular invariants: the
 * Template compiles, its selector is `k-` plus the tag, `style` on the `k-*`
 * element reaches the host, and every form control implements
 * ControlValueAccessor through a real `[formControl]`.
 *
 * Templates compile through Angular's JIT compiler with their real
 * `styleUrl`, and Web Awesome deep-imports resolve to a stub
 * (`vitest.wa-stub-alias.ts`), so no Pro token is needed. Metadata presence
 * and the eventless / methodless pins are asserted by the React loop's
 * coverage block; here each run must also report what it proved, so an
 * emptied CEM field cannot read as a pass (ADR 0003).
 *
 * A CEM attribute may have no `@Input()` only where validate:cem-sync
 * already triaged it as needing no registry prop (`isAllowlistedAttribute`).
 * React and Vue pass such attributes through their rest spread; Angular has
 * none, so they cannot reach the host there at all. Any other CEM attribute,
 * such as one a Web Awesome bump adds, fails here until it is surfaced or
 * triaged.
 */
// @vitest-environment jsdom

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Type } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import { toKebabCase } from '../../src/utils/naming.js';
import { isAllowlistedAttribute } from '../../scripts/validate-cem-sync.js';
import {
  FORM_CONTROL_FACETS,
  proveAngularTemplate,
} from './angular-function-harness.js';
import { METHODLESS_COMPONENTS } from './_helpers/methodless-components.js';
import { EVENTLESS_COMPONENTS } from './_helpers/eventless-components.js';

const METHODLESS = new Set(METHODLESS_COMPONENTS);
const EVENTLESS = new Set(EVENTLESS_COMPONENTS);

const TEMPLATES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../templates/angular'
);

/**
 * The form-control catalogue: Templates that implement ControlValueAccessor,
 * keyed by registry key, with the host property the form value maps to.
 * Pinned as committed data, not read from the generator's CVA sets: a derived
 * list would follow a generator that dropped a form control. The harness
 * checks both directions, since a pinned Template must provide
 * NG_VALUE_ACCESSOR and an unpinned one must not.
 */
const ANGULAR_FORM_CONTROLS: Readonly<Record<string, 'value' | 'checked'>> = {
  checkbox: 'checked',
  'color-picker': 'value',
  combobox: 'value',
  'file-input': 'value',
  input: 'value',
  'number-input': 'value',
  'otp-input': 'value',
  'radio-group': 'value',
  rating: 'value',
  select: 'value',
  slider: 'value',
  switch: 'checked',
  'tag-input': 'value',
  textarea: 'value',
};

describe('form-control catalogue (fail closed)', () => {
  it('pins only registry components', () => {
    const unknown = Object.keys(ANGULAR_FORM_CONTROLS).filter(
      (slug) => !(slug in LOCAL_REGISTRY)
    );
    expect(unknown).toEqual([]);
  });

  it('maps the form value to checked exactly where the CEM declares checked', () => {
    const mismatched = Object.entries(ANGULAR_FORM_CONTROLS).filter(
      ([slug, property]) =>
        (property === 'checked') !==
        (COMPONENT_METADATA[slug]?.attributes.some(
          (attribute) => attribute.name === 'checked'
        ) ?? false)
    );
    expect(mismatched).toEqual([]);
  });
});

describe('every Angular Template against CEM metadata', () => {
  for (const [slug, definition] of Object.entries(LOCAL_REGISTRY)) {
    it(`${definition.name} (${slug}) matches its CEM contract`, async () => {
      const metadata = COMPONENT_METADATA[slug];
      expect(
        metadata,
        `no COMPONENT_METADATA entry for registry component "${slug}"`
      ).toBeDefined();

      const file = `${toKebabCase(definition.name)}.component`;
      const mod = (await import(
        /* @vite-ignore */ `../../templates/angular/${definition.name}/${file}.js`
      )) as Record<string, Type<unknown> | undefined>;
      const Template = mod[`${definition.name}Component`];
      expect(
        Template,
        `templates/angular/${definition.name}/${file}.ts does not export ${definition.name}Component`
      ).toBeDefined();
      if (!Template) return;

      const { violations, proved, omittedInputs } = await proveAngularTemplate({
        Template,
        metadata,
        mayOmitInput: (attribute) => isAllowlistedAttribute(slug, attribute),
        formControl: ANGULAR_FORM_CONTROLS[slug],
        readResource: (url) =>
          readFile(path.resolve(TEMPLATES_DIR, definition.name, url), 'utf8'),
      });

      expect(violations).toEqual([]);

      // A clean run must also be a run that checked something: every CEM
      // member was observed on the host, except attributes the triage lets
      // Angular omit, and only the pinned eventless / methodless components
      // may prove zero events / methods (ADR 0003).
      expect(proved.attributes).toBe(
        metadata.attributes.length - omittedInputs.length
      );
      expect(proved.events).toBe(metadata.events.length);
      if (!EVENTLESS.has(slug)) {
        expect(proved.events).toBeGreaterThan(0);
      }
      expect(proved.methods).toBe(metadata.methods.length);
      if (!METHODLESS.has(slug)) {
        expect(proved.methods).toBeGreaterThan(0);
      }
      expect(proved.formControl).toBe(
        slug in ANGULAR_FORM_CONTROLS ? FORM_CONTROL_FACETS.length : 0
      );
    });
  }
});

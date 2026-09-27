/**
 * Enumerated booleans (`spellcheck`, `autocorrect`) through every React and
 * Vue variant, across prop changes (issue #101).
 *
 * The function harnesses prove the TypeScript Templates write the pinned
 * keyword for true and for false, each on a fresh mount. Two things stay
 * outside them: the JavaScript variants (`.jsx` is hand-maintained, and
 * neither it nor `.js.vue` has a harness yet, #71), the docs-site wrappers
 * (hand-maintained copies of the React Templates that back Storybook), and a
 * prop that changes
 * after mount, which is where a React effect with the wrong dependencies or
 * a Vue branch that ignores `undefined` would go wrong. So each variant is
 * mounted once and moved true -> false -> unset: the attribute must read the
 * true keyword, then the false keyword, then be gone, leaving the element's
 * own default.
 *
 * Targets come from the pin and the committed CEM metadata, not from the
 * registry's `keywords`, so a registry entry that lost its keywords cannot
 * also drop its Templates from this check.
 */
// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import type { Component } from 'vue';
import { describe, expect, it } from 'vitest';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import { ENUMERATED_BOOLEAN_ATTRIBUTES } from './_helpers/enumerated-boolean-attributes.js';

type Step = boolean | undefined;
const STEPS: readonly Step[] = [true, false, undefined];

/**
 * The props a consumer passes at `step`. Unset means the key is absent, not
 * present as `undefined`: Vue casts only an absent Boolean prop to `false`,
 * which is the case a Template has to guard against.
 */
function propsAt(attribute: string, step: Step): Record<string, boolean> {
  return step === undefined ? {} : { [attribute]: step };
}

/** The attribute each step must leave on the host. */
function expected(attribute: string, step: Step): string | null {
  const keywords = ENUMERATED_BOOLEAN_ATTRIBUTES[attribute];
  if (!keywords || step === undefined) return null;
  return step ? keywords.true : keywords.false;
}

const TARGETS = Object.entries(COMPONENT_METADATA).flatMap(
  ([slug, metadata]) => {
    const component = LOCAL_REGISTRY[slug];
    if (!component) return [];
    return metadata.attributes
      .filter((attribute) => attribute.name in ENUMERATED_BOOLEAN_ATTRIBUTES)
      .map((attribute) => ({
        slug,
        name: component.name,
        tagName: metadata.tagName,
        attribute: attribute.name,
      }));
  }
);

describe('enumerated-boolean targets', () => {
  it('covers every component the CEM declares one on', () => {
    // The premise: an empty target list would pass every case below.
    expect([...new Set(TARGETS.map((target) => target.slug))].sort()).toEqual([
      'combobox',
      'input',
      'tag-input',
      'textarea',
    ]);
  });
});

/** Every React source that carries its own copy of the keyword write. */
const REACT_SOURCES = [
  {
    label: 'Template .tsx',
    path: (name: string) => `../../templates/react/${name}/${name}.tsx`,
  },
  {
    label: 'Template .jsx',
    path: (name: string) => `../../templates/react/${name}/${name}.jsx`,
  },
  {
    label: 'docs wrapper',
    path: (name: string) => `../../docs/src/components/ui/${name}/${name}.tsx`,
  },
];

describe.each(REACT_SOURCES)('React $label', ({ path }) => {
  it.each(TARGETS)(
    '$name writes $attribute as its keyword across prop changes',
    async ({ name, tagName, attribute }) => {
      const mod = (await import(/* @vite-ignore */ path(name))) as Record<
        string,
        React.ComponentType<Record<string, unknown>>
      >;
      const Template = mod[name];
      expect(Template).toBeDefined();

      const element = (step: Step) =>
        React.createElement(Template, propsAt(attribute, step));
      const view = render(element(STEPS[0]));
      const seen: Array<string | null> = [];
      for (const [index, step] of STEPS.entries()) {
        if (index > 0) view.rerender(element(step));
        seen.push(
          view.container.querySelector(tagName)?.getAttribute(attribute) ?? null
        );
      }
      view.unmount();

      expect(seen).toEqual(STEPS.map((step) => expected(attribute, step)));
    }
  );
});

describe.each(['vue', 'js.vue'] as const)('Vue .%s', (extension) => {
  it.each(TARGETS)(
    '$name writes $attribute as its keyword across prop changes',
    async ({ name, tagName, attribute }) => {
      const mod = (await import(
        /* @vite-ignore */ `../../templates/vue/${name}/${name}.${extension}`
      )) as { default: Component };

      const value = ref<Step>(STEPS[0]);
      const container = document.createElement('div');
      const app = createApp(
        defineComponent({
          render: () => h(mod.default, propsAt(attribute, value.value)),
        })
      );
      app.mount(container);
      const seen: Array<string | null> = [];
      for (const [index, step] of STEPS.entries()) {
        if (index > 0) {
          value.value = step;
          await nextTick();
        }
        seen.push(
          container.querySelector(tagName)?.getAttribute(attribute) ?? null
        );
      }
      app.unmount();

      expect(seen).toEqual(STEPS.map((step) => expected(attribute, step)));
    }
  );
});

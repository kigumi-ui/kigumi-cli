/**
 * Function harness loop over every Vue TypeScript Template (issue #76).
 *
 * The same CEM contract the React loop proves (issue #75), against the
 * committed `.vue` Templates: host tag, CEM attributes, CEM listeners with
 * cleanup, dispatch reaching the consumer's `@wa-*` listener, public CEM
 * methods on `defineExpose`, and class forwarding. JavaScript `.js.vue`
 * variants stay out; the JS-is-a-subset-of-TS check is their gate.
 *
 * The SFCs compile through `vitest.vue-plugin.ts` with the same
 * `isCustomElement` rule `kigumi init` writes for consumers, and Web Awesome
 * deep-imports resolve to a stub (`vitest.wa-stub-alias.ts`), so no Pro token
 * is needed. Metadata presence is asserted by the React loop's coverage block;
 * here each run must also report what it exercised, so an emptied CEM field
 * cannot read as a pass (ADR 0003).
 *
 * One Vue-specific input mapping: a `v-model` Template carries its CEM
 * `value` / `checked` attribute as `modelValue`, and binds that model over
 * any raw attribute of the same name. The probe therefore feeds that one
 * attribute through `modelValue`, per `VUE_MODEL_ATTRIBUTE` below.
 */
// @vitest-environment jsdom

import { createApp, defineComponent, h, shallowRef, type Component } from 'vue';
import { describe, expect, it } from 'vitest';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import { probeAttributes, proveVueTemplate } from './vue-function-harness.js';
import { METHODLESS_COMPONENTS } from './_helpers/methodless-components.js';

const METHODLESS = new Set(METHODLESS_COMPONENTS);

/**
 * Vue Templates that expose a `v-model`, keyed by registry key, with the CEM
 * attribute that model carries. Pinned as committed data, not read from the
 * generator: a derived map would follow a generator that bound the model to
 * the wrong attribute. Both directions are asserted below, so a Template that
 * gains or loses `modelValue` must edit this map in the same commit.
 */
const VUE_MODEL_ATTRIBUTE: Readonly<Record<string, 'value' | 'checked'>> = {
  checkbox: 'checked',
  'color-picker': 'value',
  combobox: 'value',
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

type CompiledTemplate = Component & {
  emits?: readonly string[];
  props?: Record<string, unknown>;
};

async function importTemplate(
  name: string
): Promise<CompiledTemplate | undefined> {
  const modulePath = `../../templates/vue/${name}/${name}.vue`;
  const mod = (await import(/* @vite-ignore */ modulePath)) as {
    default?: CompiledTemplate;
  };
  return mod.default;
}

/** Route the model-carried attribute through `modelValue`. */
function toVueProps(
  slug: string,
  attributes: Record<string, string | boolean>
): Record<string, unknown> {
  const modelAttribute = VUE_MODEL_ATTRIBUTE[slug];
  if (!modelAttribute || !(modelAttribute in attributes)) return attributes;
  const { [modelAttribute]: modelValue, ...rest } = attributes;
  return { ...rest, modelValue };
}

describe('v-model pin (fail closed)', () => {
  it('pins every Vue Template that declares modelValue, and only those', async () => {
    const declaring: string[] = [];
    for (const [slug, definition] of Object.entries(LOCAL_REGISTRY)) {
      const Template = await importTemplate(definition.name);
      if (Template?.props && 'modelValue' in Template.props) {
        declaring.push(slug);
      }
    }
    expect(declaring.sort()).toEqual(Object.keys(VUE_MODEL_ATTRIBUTE).sort());
  });

  it('pins only attributes the CEM actually declares', () => {
    const unknown = Object.entries(VUE_MODEL_ATTRIBUTE).filter(
      ([slug, attribute]) =>
        !COMPONENT_METADATA[slug]?.attributes.some((a) => a.name === attribute)
    );
    expect(unknown).toEqual([]);
  });
});

describe('every Vue Template against CEM metadata', () => {
  for (const [slug, definition] of Object.entries(LOCAL_REGISTRY)) {
    it(`${definition.name} (${slug}) matches its CEM contract`, async () => {
      const metadata = COMPONENT_METADATA[slug];
      expect(
        metadata,
        `no COMPONENT_METADATA entry for registry component "${slug}"`
      ).toBeDefined();

      const Template = await importTemplate(definition.name);
      expect(
        Template,
        `templates/vue/${definition.name}/${definition.name}.vue has no default export`
      ).toBeDefined();
      if (!Template) return;

      const { violations, proved } = await proveVueTemplate({
        metadata,
        attributes: probeAttributes(metadata.attributes),
        className: 'probe-class',
        emits: Template.emits,
        mount: ({ attributes, className, handlers }) => {
          const exposed = shallowRef<Record<string, unknown> | null>(null);
          const container = document.createElement('div');
          const app = createApp(
            defineComponent({
              render: () =>
                h(Template, {
                  ...toVueProps(slug, attributes),
                  class: className,
                  ...handlers,
                  ref: exposed,
                }),
            })
          );
          app.mount(container);
          return {
            container,
            unmount: () => {
              app.unmount();
            },
            refHandle: {
              get current() {
                return exposed.value;
              },
            },
          };
        },
      });

      expect(violations).toEqual([]);

      expect(proved.attributes).toBe(metadata.attributes.length);
      expect(proved.attributes).toBeGreaterThan(0);
      expect(proved.events).toBe(metadata.events.length);
      expect(proved.methods).toBe(metadata.methods.length);
      if (!METHODLESS.has(slug)) {
        expect(proved.methods).toBeGreaterThan(0);
      }
    });
  }
});

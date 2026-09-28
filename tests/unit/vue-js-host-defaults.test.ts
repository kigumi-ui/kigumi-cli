/**
 * A `.js.vue` Template mounted with no props writes exactly the host
 * attributes its `.vue` Template writes (issue #152).
 *
 * The generator used to copy each registry prop's `default` into the runtime
 * `defineProps`, and `hostAttributes()` forwards every value that is not
 * `undefined` or `false`. So only the Vue JavaScript variant put registry
 * defaults on the host: `size="medium"` (deprecated by Web Awesome 3.13),
 * Button `appearance="filled"` over Web Awesome's `accent`, Slider
 * `with-tooltip`, SplitPanel `primary="start"`. React, Vue TS and Angular
 * write nothing and leave the element's own default. Comparing the two Vue
 * dialects on the committed Templates holds every component to that, and an
 * unset prop to meaning "the element decides".
 *
 * The Web Awesome imports are stubbed in this lane, so the hosts never
 * upgrade: every attribute read here is one the Template wrote.
 */
// @vitest-environment jsdom

import { createApp, h } from 'vue';
import type { Component } from 'vue';
import { describe, expect, it } from 'vitest';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';

async function unsetHostAttributes(
  name: string,
  tagName: string,
  extension: 'vue' | 'js.vue'
): Promise<Record<string, string>> {
  const mod = (await import(
    /* @vite-ignore */ `../../templates/vue/${name}/${name}.${extension}`
  )) as { default: Component };
  const container = document.createElement('div');
  const app = createApp({ render: () => h(mod.default) });
  // A Template with a required prop warns when it is left out, which is the
  // case under test here; the warning is not.
  app.config.warnHandler = () => {};
  app.mount(container);
  const host = container.querySelector(tagName);
  if (!host) throw new Error(`${name}.${extension} rendered no <${tagName}>`);
  const attributes = Object.fromEntries(
    [...host.attributes].map((attribute) => [attribute.name, attribute.value])
  );
  app.unmount();
  return attributes;
}

describe('Vue JS Templates leave unset props to the element', () => {
  it.each(Object.values(LOCAL_REGISTRY))(
    '$name.js.vue writes the same host attributes as $name.vue when no prop is set',
    async ({ name, tagName }) => {
      const typed = await unsetHostAttributes(name, tagName, 'vue');
      const javascript = await unsetHostAttributes(name, tagName, 'js.vue');
      expect(javascript).toEqual(typed);
    }
  );
});

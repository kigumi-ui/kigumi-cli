/**
 * Protects: issue #133 (PR #134)
 * Bug: the registry gave QrCode `fill` / `background` the defaults
 *      `black` / `white`, while Web Awesome's are empty. The `.js.vue`
 *      Template declares registry defaults in `defineProps`, so it always
 *      wrote `fill="black"` to `<wa-qr-code>`. Web Awesome only falls back to
 *      the CSS `color` / `background-color` when the attribute is empty, so
 *      the replacement the deprecation message recommends had no effect.
 * Fix: both defaults are `''`, matching the CEM.
 *
 * Verification target: the committed Vue Templates, mounted without either
 * prop. An unset deprecated color must not reach the host as an attribute.
 */
// @vitest-environment jsdom

import type { Component } from 'vue';
import { describe, expect, it } from 'vitest';
import { mountVueTemplate } from '../vue-function-harness.js';

async function importTemplate(file: string): Promise<Component> {
  const mod = (await import(
    /* @vite-ignore */ `../../../templates/vue/QrCode/${file}`
  )) as { default: Component };
  return mod.default;
}

describe('QrCode color defaults leave the CSS fallback in effect', () => {
  it.each(['QrCode.vue', 'QrCode.js.vue'])(
    '%s writes no fill or background when neither is set',
    async (file) => {
      const mount = mountVueTemplate(await importTemplate(file));
      const mounted = mount({
        attributes: { value: 'https://kigumi.style' },
        className: 'probe',
        handlers: {},
      });
      try {
        const host = mounted.container.querySelector('wa-qr-code');
        // Premise: the Template rendered its host and forwarded a set prop.
        expect(host?.getAttribute('value')).toBe('https://kigumi.style');
        expect(host?.getAttribute('fill') ?? '').toBe('');
        expect(host?.getAttribute('background') ?? '').toBe('');
      } finally {
        mounted.unmount();
      }
    }
  );
});

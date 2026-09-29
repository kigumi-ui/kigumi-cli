/**
 * Slider's `min-value` / `max-value` stay off the host until a consumer sets
 * them, in every React and Vue variant (issue #102).
 *
 * `wa-slider` reads these two by presence: its `formResetCallback` returns a
 * range slider's thumbs to `getAttribute('min-value') ?? min` and
 * `getAttribute('max-value') ?? max`. Writing Web Awesome's own property
 * defaults (0 and 50) is therefore not the same as writing nothing: a range
 * slider over -50..100 would reset to 0..50 instead of -50..100. So the
 * registry props carry no `default`, which is what keeps the `.js.vue`
 * generator from materialising one, and each variant is mounted unset (both
 * attributes absent) and set (both present, the premise that the probe can
 * see them). Angular binds `[attr.min-value]` to an input with no default,
 * and the Angular harness proves the set case.
 */
// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { createApp, h } from 'vue';
import type { Component } from 'vue';
import { describe, expect, it } from 'vitest';

const RANGE = { range: true, min: -50, max: 100 };
const SET = { ...RANGE, 'min-value': 10, 'max-value': 60 };
const UNSET_EXPECTED = { 'min-value': null, 'max-value': null };
const SET_EXPECTED = { 'min-value': '10', 'max-value': '60' };

function rangeAttributes(container: Element): Record<string, string | null> {
  const host = container.querySelector('wa-slider');
  if (!host) throw new Error('wa-slider not rendered');
  return {
    'min-value': host.getAttribute('min-value'),
    'max-value': host.getAttribute('max-value'),
  };
}

const REACT_SOURCES = [
  { label: 'Template .tsx', path: '../../templates/react/Slider/Slider.tsx' },
  { label: 'Template .jsx', path: '../../templates/react/Slider/Slider.jsx' },
  {
    label: 'docs wrapper',
    path: '../../docs/src/components/ui/Slider/Slider.tsx',
  },
];

describe.each(REACT_SOURCES)('React $label', ({ path }) => {
  it.each([
    ['unset', RANGE, UNSET_EXPECTED],
    ['set', SET, SET_EXPECTED],
  ] as const)('%s range values', async (_case, props, expected) => {
    const mod = (await import(/* @vite-ignore */ path)) as {
      Slider: React.ComponentType<Record<string, unknown>>;
    };
    const view = render(React.createElement(mod.Slider, props));
    expect(rangeAttributes(view.container)).toEqual(expected);
    view.unmount();
  });
});

describe.each(['vue', 'js.vue'] as const)('Vue .%s', (extension) => {
  it.each([
    ['unset', RANGE, UNSET_EXPECTED],
    ['set', SET, SET_EXPECTED],
  ] as const)('%s range values', async (_case, props, expected) => {
    const mod = (await import(
      /* @vite-ignore */ `../../templates/vue/Slider/Slider.${extension}`
    )) as { default: Component };
    const container = document.createElement('div');
    const app = createApp({ render: () => h(mod.default, props) });
    app.mount(container);
    expect(rangeAttributes(container)).toEqual(expected);
    app.unmount();
  });
});

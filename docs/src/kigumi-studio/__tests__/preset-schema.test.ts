import { describe, it, expect } from 'vitest';
import { PROPERTIES_BY_VAR } from '../lib/property-definitions';
import { SHADOW_COMPONENTS } from '../lib/shadow-components';

import midnightBlue from '../themes/midnight-blue.json';
import monochrome from '../themes/monochrome.json';
import neoBrutalism from '../themes/neo-brutalism.json';
import oceanBreeze from '../themes/ocean-breeze.json';
import warmEarth from '../themes/warm-earth.json';
import canvas from '../themes/canvas.json';
import kanban from '../themes/kanban.json';
import shopaholic from '../themes/shopaholic.json';

const presets = [
  { name: 'midnight-blue', data: midnightBlue },
  { name: 'monochrome', data: monochrome },
  { name: 'neo-brutalism', data: neoBrutalism },
  { name: 'ocean-breeze', data: oceanBreeze },
  { name: 'warm-earth', data: warmEarth },
  { name: 'canvas', data: canvas },
  { name: 'kanban', data: kanban },
  { name: 'shopaholic', data: shopaholic },
];

const validClassNames = new Set(SHADOW_COMPONENTS.map((c) => c.className));

describe('preset JSON files', () => {
  it.each(presets)('$name has required schema fields', ({ data }) => {
    expect(data.version).toBe(1);
    expect(typeof data.name).toBe('string');
    expect(data.name.length).toBeGreaterThan(0);
    expect(typeof data.light).toBe('object');
    expect(typeof data.dark).toBe('object');
  });

  it.each(presets)(
    '$name light tokens are known --wa-* properties',
    ({ data }) => {
      for (const key of Object.keys(data.light)) {
        expect(
          PROPERTIES_BY_VAR.has(key),
          `Unknown light property: ${key}`
        ).toBe(true);
      }
    }
  );

  it.each(presets)(
    '$name dark tokens are known --wa-* properties',
    ({ data }) => {
      for (const key of Object.keys(data.dark)) {
        expect(
          PROPERTIES_BY_VAR.has(key),
          `Unknown dark property: ${key}`
        ).toBe(true);
      }
    }
  );

  it.each(presets)(
    '$name shadowComponents reference valid class names',
    ({ data }) => {
      for (const className of data.shadowComponents ?? []) {
        expect(
          validClassNames.has(className),
          `Unknown shadow class: ${className}`
        ).toBe(true);
      }
    }
  );

  it.each(presets)(
    '$name light token values are non-empty strings',
    ({ data }) => {
      for (const [key, value] of Object.entries(data.light)) {
        expect(typeof value, `${key} should be string`).toBe('string');
        expect(
          (value as string).length,
          `${key} should not be empty`
        ).toBeGreaterThan(0);
      }
    }
  );

  it.each(presets)(
    '$name dark token values are non-empty strings',
    ({ data }) => {
      for (const [key, value] of Object.entries(data.dark)) {
        expect(typeof value, `${key} should be string`).toBe('string');
        expect(
          (value as string).length,
          `${key} should not be empty`
        ).toBeGreaterThan(0);
      }
    }
  );
});

describe('preset collection', () => {
  it('has at least 5 presets', () => {
    expect(presets.length).toBeGreaterThanOrEqual(5);
  });

  it('all presets have unique names', () => {
    const names = presets.map((p) => p.data.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

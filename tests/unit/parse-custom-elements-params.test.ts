/**
 * CEM method parameter → wrapper parameter type (issue #136).
 *
 * The CEM leaves a parameter's `type` out when the source only gives it a
 * default (`alpha = 100` in wa-color-picker's `getHexString`). The parser
 * used to fill the gap with `any`, which every generated wrapper then
 * carried into a consumer's lint as `no-explicit-any`.
 */
import { describe, expect, it } from 'vitest';
import {
  methodParameters,
  paramType,
} from '../../scripts/parse-custom-elements.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';

describe('paramType (pure)', () => {
  it('keeps the type text the CEM declares', () => {
    expect(paramType({ name: 'options', type: { text: 'FocusOptions' } })).toBe(
      'FocusOptions'
    );
  });

  it('infers number from a numeric default', () => {
    expect(paramType({ name: 'alpha', default: '100' })).toBe('number');
    expect(paramType({ name: 'delta', default: '-0.5' })).toBe('number');
  });

  it('infers string from a quoted default', () => {
    expect(paramType({ name: 'format', default: "'hex'" })).toBe('string');
    expect(paramType({ name: 'format', default: '"hex"' })).toBe('string');
  });

  it('infers boolean from a boolean default', () => {
    expect(paramType({ name: 'force', default: 'false' })).toBe('boolean');
  });

  it('falls back to unknown, never any', () => {
    expect(paramType({ name: 'value' })).toBe('unknown');
    expect(paramType({ name: 'value', default: 'SOME_CONSTANT' })).toBe(
      'unknown'
    );
  });
});

describe('methodParameters (pure): optionality (issue #108)', () => {
  // The CEM says per parameter whether a call may leave it out. Dropping that
  // made React and Vue require every argument and Angular require none, so
  // wa-stepper's goTo(name) took no name in Angular and focus(options) took
  // mandatory options in React.
  it('marks a parameter the CEM flags optional', () => {
    expect(
      methodParameters([
        { name: 'options', type: { text: 'FocusOptions' }, optional: true },
      ])
    ).toEqual([{ name: 'options', type: 'FocusOptions', optional: true }]);
  });

  it('marks a parameter with a default optional', () => {
    expect(
      methodParameters([
        { name: 'index', type: { text: 'number' } },
        {
          name: 'behavior',
          type: { text: 'ScrollBehavior' },
          default: "'smooth'",
        },
      ])
    ).toEqual([
      { name: 'index', type: 'number' },
      { name: 'behavior', type: 'ScrollBehavior', optional: true },
    ]);
  });

  it('leaves a required parameter required', () => {
    expect(
      methodParameters([{ name: 'name', type: { text: 'string' } }])
    ).toEqual([{ name: 'name', type: 'string' }]);
  });

  it('keeps an optional parameter required when a required one follows', () => {
    // TypeScript rejects a required parameter after an optional one.
    expect(
      methodParameters([
        { name: 'a', type: { text: 'string' }, optional: true },
        { name: 'b', type: { text: 'string' } },
      ])
    ).toEqual([
      { name: 'a', type: 'string' },
      { name: 'b', type: 'string' },
    ]);
  });
});

describe('committed COMPONENT_METADATA', () => {
  it('records stepper goTo(name) as required and button focus(options) as optional', () => {
    const param = (key: string, method: string) =>
      COMPONENT_METADATA[key].methods.find((m) => m.name === method)
        ?.parameters?.[0];
    expect(param('stepper', 'goTo')).toEqual({ name: 'name', type: 'string' });
    expect(param('button', 'focus')).toEqual({
      name: 'options',
      type: 'FocusOptions',
      optional: true,
    });
  });

  it('carries no any-typed method parameter', () => {
    const anyTyped = Object.entries(COMPONENT_METADATA).flatMap(
      ([key, metadata]) =>
        metadata.methods.flatMap((method) =>
          (method.parameters ?? [])
            .filter((p) => /\bany\b/.test(p.type))
            .map((p) => `${key}.${method.name}(${p.name}: ${p.type})`)
        )
    );
    expect(anyTyped).toEqual([]);
  });

  it('types color-picker getHexString alpha from its default', () => {
    const method = COMPONENT_METADATA['color-picker'].methods.find(
      (m) => m.name === 'getHexString'
    );
    expect(method?.parameters?.find((p) => p.name === 'alpha')?.type).toBe(
      'number'
    );
  });
});

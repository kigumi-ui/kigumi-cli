/**
 * CEM method parameter → wrapper parameter type (issue #136).
 *
 * The CEM leaves a parameter's `type` out when the source only gives it a
 * default (`alpha = 100` in wa-color-picker's `getHexString`). The parser
 * used to fill the gap with `any`, which every generated wrapper then
 * carried into a consumer's lint as `no-explicit-any`.
 */
import { describe, expect, it } from 'vitest';
import { paramType } from '../../scripts/parse-custom-elements.js';
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

describe('committed COMPONENT_METADATA', () => {
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

/**
 * Registry Validation Tests
 *
 * Unit tests for the pure validators exported from
 * scripts/validate-registry.ts. These exercise the per-component checks
 * with inline ComponentDefinition fixtures (no fs, no temp dirs).
 */

import { describe, it, expect } from 'vitest';
import {
  validateProps,
  validateTagName,
} from '../../scripts/validate-registry.js';
import type {
  ComponentDefinition,
  ComponentProp,
} from '../../src/utils/registry.js';

function makeComponent(
  overrides: Partial<ComponentDefinition> = {}
): ComponentDefinition {
  return {
    name: 'Button',
    tagName: 'wa-button',
    category: 'action',
    description: 'A button',
    dependencies: [],
    files: { react: [], vue: [], angular: [] },
    props: [],
    importPath: '@awesome.me/webawesome/dist/components/button/button.js',
    tier: 'free',
    ...overrides,
  };
}

describe('validateTagName', () => {
  it('passes when lowercase key matches tag exactly', () => {
    const errors = validateTagName(
      makeComponent({ tagName: 'wa-input' }),
      'input'
    );
    expect(errors).toEqual([]);
  });

  it('passes when CamelCase key normalizes to matching kebab-case tag', () => {
    const errors = validateTagName(
      makeComponent({ tagName: 'wa-button-group' }),
      'ButtonGroup'
    );
    expect(errors).toEqual([]);
  });

  it('rejects a tag that merely contains the key as a substring', () => {
    const errors = validateTagName(
      makeComponent({ tagName: 'wa-number-input' }),
      'input'
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('must equal');
  });

  it('rejects a tag without the wa- prefix', () => {
    const errors = validateTagName(
      makeComponent({ tagName: 'button' }),
      'button'
    );
    expect(errors.some((e) => e.includes("must start with 'wa-'"))).toBe(true);
  });
});

describe('validateProps', () => {
  const baseProps: ComponentProp[] = [
    {
      name: 'variant',
      type: 'string',
      values: ['neutral', 'brand', 'success'],
      default: 'neutral',
    },
    { name: 'disabled', type: 'boolean', default: 'false' },
  ];

  it('passes for a well-formed props array', () => {
    const errors = validateProps(makeComponent({ props: baseProps }), 'button');
    expect(errors).toEqual([]);
  });

  it('flags a prop with a missing name', () => {
    const errors = validateProps(
      makeComponent({
        props: [{ name: '', type: 'string' }],
      }),
      'button'
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("missing 'name'");
  });

  it('flags a prop with a type outside the allowed set', () => {
    const errors = validateProps(
      makeComponent({
        props: [{ name: 'shape', type: 'enum' } as unknown as ComponentProp],
      }),
      'button'
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('invalid type');
  });

  it('flags a values field that is not an array', () => {
    const errors = validateProps(
      makeComponent({
        props: [
          {
            name: 'size',
            type: 'string',
            values: 'small,medium,large',
          } as unknown as ComponentProp,
        ],
      }),
      'button'
    );
    expect(errors.some((e) => e.includes("'values' must be an array"))).toBe(
      true
    );
  });

  it('flags a default that is not in the declared values', () => {
    const errors = validateProps(
      makeComponent({
        props: [
          {
            name: 'size',
            type: 'string',
            values: ['small', 'large'],
            default: 'medium',
          },
        ],
      }),
      'button'
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('not in values');
  });

  it('accepts a default when no values array is declared', () => {
    const errors = validateProps(
      makeComponent({
        props: [{ name: 'label', type: 'string', default: 'Click me' }],
      }),
      'button'
    );
    expect(errors).toEqual([]);
  });
});

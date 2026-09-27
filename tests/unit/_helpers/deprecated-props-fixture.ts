/**
 * The deprecated props every deprecation test generates from (issue #129):
 * one plain name and one kebab-case name, since Templates quote a kebab name
 * and Angular camelCases it. Spread into a fixture component beside props
 * that are not deprecated, which must come out without a tag.
 */

import type { ComponentProp } from '../../../src/utils/registry.js';

export const DEPRECATION_MESSAGES = {
  min: 'Set options.scales.r.min in the chart JSON config instead.',
  'index-axis': 'Has no effect on this chart.',
} as const;

export const DEPRECATED_PROPS: readonly ComponentProp[] = [
  {
    name: 'min',
    type: 'number',
    description: 'Floor value for the value axis scale',
    deprecated: DEPRECATION_MESSAGES.min,
  },
  {
    name: 'index-axis',
    type: 'string',
    values: ['x', 'y'],
    default: 'x',
    deprecated: DEPRECATION_MESSAGES['index-axis'],
  },
];

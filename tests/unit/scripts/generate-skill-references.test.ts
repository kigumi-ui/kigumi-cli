import { describe, expect, it } from 'vitest';
import { formatCompactProps } from '../../../scripts/generate-skill-references.js';

describe('formatCompactProps', () => {
  it('keeps the compact form for props that are not deprecated', () => {
    expect(
      formatCompactProps([
        { name: 'open', type: 'boolean', default: 'false' },
        { name: 'label', type: 'string', required: true },
        { name: 'grid', type: 'string', values: ['x', 'y'], default: 'x' },
      ])
    ).toBe('open(boolean=false), label(string, required), grid(x|y=x)');
  });

  // Agents read these surfaces to write code, so a deprecated prop has to say
  // so there too, or they keep reaching for it (issue #129).
  it('labels a deprecated prop so agents stop reaching for it', () => {
    expect(
      formatCompactProps([
        {
          name: 'min',
          type: 'number',
          deprecated:
            'Set options.scales.r.min in the chart JSON config instead.',
        },
        {
          name: 'grid',
          type: 'string',
          values: ['x', 'y'],
          default: 'x',
          deprecated: 'Has no effect on this chart.',
        },
      ])
    ).toBe('min(number, deprecated), grid(x|y=x, deprecated)');
  });

  it('reports none for a component without props', () => {
    expect(formatCompactProps([])).toBe('none');
  });
});

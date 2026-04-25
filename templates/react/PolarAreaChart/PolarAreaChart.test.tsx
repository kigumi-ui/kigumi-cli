import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PolarAreaChart } from './PolarAreaChart';

describe('PolarAreaChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<PolarAreaChart />);
    expect(container.querySelector('wa-polar-area-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-polar-area-chart', () => {
    const { container } = render(<PolarAreaChart className="custom-class" />);
    const element = container.querySelector('wa-polar-area-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PieChart } from './PieChart';

describe('PieChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<PieChart />);
    expect(container.querySelector('wa-pie-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-pie-chart', () => {
    const { container } = render(<PieChart className="custom-class" />);
    const element = container.querySelector('wa-pie-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});

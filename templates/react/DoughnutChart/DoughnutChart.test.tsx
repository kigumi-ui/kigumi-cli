import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DoughnutChart } from './DoughnutChart';

describe('DoughnutChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<DoughnutChart />);
    expect(container.querySelector('wa-doughnut-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-doughnut-chart', () => {
    const { container } = render(<DoughnutChart className="custom-class" />);
    const element = container.querySelector('wa-doughnut-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});

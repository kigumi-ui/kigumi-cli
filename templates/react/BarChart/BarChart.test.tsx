import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BarChart } from './BarChart';

describe('BarChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<BarChart />);
    expect(container.querySelector('wa-bar-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-bar-chart', () => {
    const { container } = render(<BarChart className="custom-class" />);
    const element = container.querySelector('wa-bar-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});

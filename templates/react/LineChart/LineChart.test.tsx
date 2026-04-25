import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LineChart } from './LineChart';

describe('LineChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<LineChart />);
    expect(container.querySelector('wa-line-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-line-chart', () => {
    const { container } = render(<LineChart className="custom-class" />);
    const element = container.querySelector('wa-line-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});

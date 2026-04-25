import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ScatterChart } from './ScatterChart';

describe('ScatterChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScatterChart />);
    expect(container.querySelector('wa-scatter-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-scatter-chart', () => {
    const { container } = render(<ScatterChart className="custom-class" />);
    const element = container.querySelector('wa-scatter-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});

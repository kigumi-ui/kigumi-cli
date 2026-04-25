import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RadarChart } from './RadarChart';

describe('RadarChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<RadarChart />);
    expect(container.querySelector('wa-radar-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-radar-chart', () => {
    const { container } = render(<RadarChart className="custom-class" />);
    const element = container.querySelector('wa-radar-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});

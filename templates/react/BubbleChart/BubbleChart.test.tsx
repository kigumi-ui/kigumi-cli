import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BubbleChart } from './BubbleChart';

describe('BubbleChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<BubbleChart />);
    expect(container.querySelector('wa-bubble-chart')).toBeTruthy();
  });

  it('applies custom className to the underlying wa-bubble-chart', () => {
    const { container } = render(<BubbleChart className="custom-class" />);
    const element = container.querySelector('wa-bubble-chart');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });
});

import React from 'react';
import { render } from '@testing-library/react';
import { BubbleChart } from './BubbleChart';

describe('BubbleChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<BubbleChart />);
    expect(container.querySelector('wa-bubble-chart')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<BubbleChart className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

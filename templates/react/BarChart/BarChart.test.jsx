import React from 'react';
import { render } from '@testing-library/react';
import { BarChart } from './BarChart';

describe('BarChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<BarChart />);
    expect(container.querySelector('wa-bar-chart')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<BarChart className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

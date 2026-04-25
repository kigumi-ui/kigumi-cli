import React from 'react';
import { render } from '@testing-library/react';
import { DoughnutChart } from './DoughnutChart';

describe('DoughnutChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<DoughnutChart />);
    expect(container.querySelector('wa-doughnut-chart')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<DoughnutChart className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});

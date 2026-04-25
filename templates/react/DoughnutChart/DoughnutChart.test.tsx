import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DoughnutChart } from './DoughnutChart';

describe('DoughnutChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<DoughnutChart />);
    expect(container.querySelector('wa-doughnut-chart')).toBeTruthy();
  });
});
